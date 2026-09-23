/**
 * @file roles.service.ts
 * @caso-de-uso CU05 — Gestionar roles y permisos
 * @subsistema Usuarios y Seguridad
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Implementa los procedimientos de gestión RBAC: consulta de roles con estadísticas,
 * construcción del árbol de módulos/funciones del sistema, y actualización atómica en bloque de permisos con reglas de protección de superadministrador.
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { UpdateRolePermissionsDto } from './dto/roles.dto.js';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  /**
   * Obtiene la lista completa de roles del sistema con estadísticas calculadas en base de datos.
   * Conteo agregado de usuarios asociados y total de funciones activas por rol.
   *
   * @returns {Promise<Array<{ id_rol: number, nombre: string, permiso: string, total_usuarios: number, total_funciones: number }>>}
   * Lista ordenada de roles.
   */
  async getRoles() {
    const roles = await this.prisma.rol.findMany({
      include: {
        _count: {
          select: {
            usuario: true,
            rol_funcion: true,
          },
        },
      },
      orderBy: { id_rol: 'asc' },
    });

    return roles.map((r) => ({
      id_rol: r.id_rol,
      nombre: r.nombre,
      permiso: r.permiso,
      total_usuarios: r._count.usuario,
      total_funciones: r._count.rol_funcion,
    }));
  }

  /**
   * Obtiene el árbol completo de módulos y sus funciones de negocio asociadas.
   * Utilizado en la interfaz gráfica de administración para renderizar el panel de checkboxes y niveles de acceso.
   *
   * @returns {Promise<Array<{ id_modulo: number, nombre: string, descripcion: string, funciones: any[] }>>}
   * Estructura jerárquica de módulos y funciones.
   */
  async getModulesTree() {
    const modulos = await this.prisma.modulo.findMany({
      include: {
        funcion: {
          orderBy: { id_funcion: 'asc' },
        },
      },
      orderBy: { id_modulo: 'asc' },
    });

    return modulos.map((m) => ({
      id_modulo: m.id_modulo,
      nombre: m.nombre,
      descripcion: m.descripcion,
      funciones: m.funcion.map((f) => ({
        id_funcion: f.id_funcion,
        nombre: f.nombre,
        descripcion: f.descripcion,
        id_modulo: f.id_modulo,
      })),
    }));
  }

  /**
   * Procedimiento de consulta detallada de un rol específico por su identificador.
   * Carga las relaciones con la tabla `rol_funcion` y `modulo`, computando resúmenes de permisos (Lectura vs Edición).
   *
   * @param {number} id - Identificador del rol.
   * @returns {Promise<any>} Datos del rol, resumen numérico por nivel y desglose de funciones.
   * @throws {NotFoundException} Si el rol no existe.
   */
  async getRoleById(id: number) {
    const rol = await this.prisma.rol.findUnique({
      where: { id_rol: id },
      include: {
        _count: {
          select: { usuario: true },
        },
        rol_funcion: {
          include: {
            funcion: {
              include: {
                modulo: true,
              },
            },
          },
          orderBy: { id_funcion: 'asc' },
        },
      },
    });

    if (!rol) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    const funcionesAsignadas = rol.rol_funcion.map((rf) => ({
      id_funcion: rf.id_funcion,
      nombre: rf.funcion.nombre,
      descripcion: rf.funcion.descripcion,
      id_modulo: rf.funcion.id_modulo,
      modulo: rf.funcion.modulo.nombre,
      nivel_acceso: rf.descripcion || 'Lectura',
    }));

    const readCount = funcionesAsignadas.filter(
      (f) => (f.nivel_acceso || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'lectura',
    ).length;

    const editCount = funcionesAsignadas.filter(
      (f) => (f.nivel_acceso || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'edicion',
    ).length;

    return {
      id_rol: rol.id_rol,
      nombre: rol.nombre,
      permiso: rol.permiso,
      total_usuarios: rol._count.usuario,
      total_funciones: funcionesAsignadas.length,
      resumen_niveles: {
        lectura: readCount,
        edicion: editCount,
      },
      funciones: funcionesAsignadas,
    };
  }

  /**
   * Procedimiento de actualización en bloque de los permisos de un rol (tabla `rol_funcion`).
   * Reglas de integridad y seguridad:
   * 1. Comprueba la existencia del rol.
   * 2. Regla de autoprotección: Impide retirar o degradar el permiso de Edición de 'Gestionar roles' al rol Administrador.
   * 3. Valida que no se envíen IDs de función repetidos en el payload.
   * 4. Valida que todos los IDs de función referenciados existan en la base de datos.
   * 5. Ejecuta una transacción atómica: elimina los permisos previos del rol y reinserta los nuevos con nivel normalizado ('Edicion' o 'Lectura').
   * 6. Registra la auditoría en la bitácora del sistema.
   *
   * @param {number} id - ID del rol a modificar.
   * @param {UpdateRolePermissionsDto} dto - Lista de funciones y niveles a asignar.
   * @param {number} idUsuario - ID del administrador que realiza la modificación.
   * @param {string} [ip] - Dirección IP de origen.
   * @returns {Promise<any>} Rol actualizado con sus nuevos permisos.
   * @throws {NotFoundException} Si el rol no existe.
   * @throws {BadRequestException} Si se violan reglas de integridad o de protección de superadministrador.
   */
  async updateRolePermissions(
    id: number,
    dto: UpdateRolePermissionsDto,
    idUsuario: number,
    ip?: string,
  ) {
    const rol = await this.prisma.rol.findUnique({
      where: { id_rol: id },
    });

    if (!rol) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    // Regla crítica de protección: El Administrador (ID 1) no puede perder privilegios clave
    const isSuperAdmin = rol.id_rol === 1 || rol.nombre.toLowerCase() === 'administrador';
    if (isSuperAdmin) {
      const hasManageRoles = dto.permissions.some(
        (p) => p.id_funcion === 5 && (p.nivel_acceso === 'Edicion' || p.nivel_acceso === 'Edición'),
      );
      if (!hasManageRoles) {
        throw new BadRequestException(
          'No se puede retirar ni degradar el permiso de Edición sobre "Gestionar roles" al Administrador.',
        );
      }
    }

    // Validar que no haya funciones duplicadas en el payload
    const functionIds = dto.permissions.map((p) => p.id_funcion);
    const uniqueIds = new Set(functionIds);
    if (uniqueIds.size !== functionIds.length) {
      throw new BadRequestException('No se permiten funciones duplicadas en la lista de permisos.');
    }

    // Validar que todas las funciones existan en el sistema
    if (functionIds.length > 0) {
      const existingFuncs = await this.prisma.funcion.findMany({
        where: { id_funcion: { in: functionIds } },
        select: { id_funcion: true },
      });

      if (existingFuncs.length !== functionIds.length) {
        throw new BadRequestException('Una o más funciones proporcionadas no existen en el sistema.');
      }
    }

    // Normalizar nivel de acceso para almacenar en DB ('Edicion' o 'Lectura')
    const normalizeNivel = (nivel: string) => {
      const norm = nivel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return norm === 'edicion' ? 'Edicion' : 'Lectura';
    };

    // Actualizar en transacción atómica
    await this.prisma.$transaction(async (tx) => {
      // Eliminar asociaciones actuales
      await tx.rol_funcion.deleteMany({
        where: { id_rol: id },
      });

      // Crear nuevas asociaciones
      if (dto.permissions.length > 0) {
        await tx.rol_funcion.createMany({
          data: dto.permissions.map((p) => ({
            id_rol: id,
            id_funcion: p.id_funcion,
            descripcion: normalizeNivel(p.nivel_acceso),
          })),
        });
      }
    });

    // Auditoría en bitácora
    await this.bitacora.logAction(
      `Modificó permisos del rol ${rol.nombre}`,
      'ROL_FUNCION',
      idUsuario,
      ip,
    );

    return this.getRoleById(id);
  }
}
