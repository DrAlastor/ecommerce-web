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
   * Obtiene todos los roles con estadísticas básicas (usuarios y funciones asignadas)
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
   * Obtiene el árbol completo de módulos con todas sus funciones disponibles en el sistema
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
   * Obtiene el detalle de un rol específico, incluyendo sus funciones asignadas y niveles de acceso
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
   * Actualiza las relaciones ROL_FUNCION de un rol determinado
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
        (p) => p.id_funcion === 2 && (p.nivel_acceso === 'Edicion' || p.nivel_acceso === 'Edición'),
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
