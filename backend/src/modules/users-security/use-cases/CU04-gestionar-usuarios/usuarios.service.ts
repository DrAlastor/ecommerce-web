/**
 * @file usuarios.service.ts
 * @caso-de-uso CU04 — Gestionar usuarios
 * @subsistema Usuarios y Seguridad
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Implementa los procedimientos de gestión de usuarios: filtrado dinámico,
 * verificación de presencia en tiempo real (`ActiveSessionService`), cambio de estado y actualización administrativa.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { ActiveSessionService } from '../../shared/services/active-session.service.js';
import { QueryUsersDto, UpdateUserStatusDto, UpdateUserAdminDto } from './dto/usuarios.dto.js';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
    private readonly activeSessionService: ActiveSessionService,
  ) {}

  /**
   * Procedimiento de consulta paginada de usuarios con filtros avanzados.
   * Filtra por coincidencia insensitiva en email, nombres, apellidos y CI (tanto de clientes como de empleados).
   * Adjunta en tiempo real el indicador booleano `conectado` mediante el servicio de sesiones activas.
   *
   * @param {QueryUsersDto} query - Filtros de búsqueda (texto, estado, id_rol, página, límite).
   * @returns {Promise<{ data: any[], meta: { total: number, page: number, limit: number, totalPages: number } }>}
   * Lista de usuarios enriquecida con estado de conexión y metadatos de paginación.
   */
  async findAll(query: QueryUsersDto) {
    const { search, role, status, page = 1, limit = 10 } = query;

    const where: any = {
      ...(status && { estado: status }),
      ...(role && { id_rol: role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { empleado: { nombre: { contains: search, mode: 'insensitive' } } },
          { empleado: { apellido: { contains: search, mode: 'insensitive' } } },
          { empleado: { ci: { contains: search, mode: 'insensitive' } } },
          { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
          { cliente: { apellido: { contains: search, mode: 'insensitive' } } },
          { cliente: { ci: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const total = await this.prisma.usuario.count({ where });
    
    const users = await this.prisma.usuario.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        rol: { select: { nombre: true } },
        empleado: { select: { nombre: true, apellido: true, ci: true, codigo_empleado: true } },
        cliente: { select: { nombre: true, apellido: true, ci: true } },
      },
      orderBy: { id_usuario: 'desc' },
    });

    return {
      data: users.map(user => ({
        id_usuario: user.id_usuario,
        email: user.email,
        estado: user.estado,
        conectado: this.activeSessionService.isConnected(user.id_usuario),
        rol: user.rol?.nombre,
        id_rol: user.id_rol,
        perfil: user.empleado || user.cliente || null,
        tipo: user.empleado ? 'empleado' : (user.cliente ? 'cliente' : 'ninguno'),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene la información detallada de un usuario por su identificador.
   *
   * @param {number} id - Identificador del usuario.
   * @returns {Promise<any>} Usuario con sus perfiles de empleado, cliente y rol.
   * @throws {NotFoundException} Si el usuario no existe.
   */
  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      include: {
        rol: true,
        empleado: true,
        cliente: true,
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      id_usuario: user.id_usuario,
      email: user.email,
      estado: user.estado,
      conectado: this.activeSessionService.isConnected(user.id_usuario),
      rol: user.rol,
      empleado: user.empleado,
      cliente: user.cliente,
    };
  }

  /**
   * Registra en la bitácora que un administrador consultó el listado general de usuarios.
   *
   * @param {number} adminId - ID del administrador.
   * @param {string} [ip] - Dirección IP.
   */
  async logConsultaUsers(adminId: number, ip?: string) {
    await this.bitacora.logConsulta('lista de usuarios', 'Módulo de Gestión de usuarios', adminId, ip);
  }

  /**
   * Registra en la bitácora que un administrador inspeccionó el detalle de un usuario específico.
   *
   * @param {number} userId - ID del usuario inspeccionado.
   * @param {number} adminId - ID del administrador.
   * @param {string} [ip] - Dirección IP.
   */
  async logConsultaUserDetail(userId: number, adminId: number, ip?: string) {
    await this.bitacora.logConsulta('detalle de usuario', `Usuario ID: ${userId}`, adminId, ip);
  }

  /**
   * Procedimiento de actualización de estado de cuenta (Activar / Suspender).
   * Si el usuario se desactiva, si estaba conectado se desvincula de las sesiones en memoria.
   *
   * @param {number} id - ID del usuario a modificar.
   * @param {UpdateUserStatusDto} dto - Nuevo estado ('activo' o 'inactivo').
   * @param {number} adminId - ID del administrador que ejecuta el cambio.
   * @param {string} ip - Dirección IP de origen.
   * @returns {Promise<{ message: string, estado: string }>} Confirmación de actualización.
   * @throws {NotFoundException} Si el usuario no existe.
   * @throws {BadRequestException} Si el usuario ya posee el estado solicitado.
   */
  async updateStatus(id: number, dto: UpdateUserStatusDto, adminId: number, ip: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id_usuario: id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.estado === dto.estado) {
      throw new BadRequestException(`El usuario ya se encuentra en estado ${dto.estado}`);
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: { estado: dto.estado },
    });

    if (dto.estado === 'inactivo') {
      this.activeSessionService.disconnect(id);
    }

    await this.bitacora.logModificacion(
      `estado de usuario a ${dto.estado}`,
      `Usuario: ${user.email} (ID: ${id})`,
      adminId,
      ip
    );

    return { message: 'Estado actualizado correctamente', estado: updatedUser.estado };
  }

  /**
   * Procedimiento administrativo para reasignar rol o actualizar correo electrónico.
   * Valida que el nuevo correo no esté registrado por otra cuenta antes de proceder.
   *
   * @param {number} id - ID del usuario.
   * @param {UpdateUserAdminDto} dto - Nuevo correo y/o nuevo rol.
   * @param {number} adminId - ID del administrador.
   * @param {string} ip - Dirección IP.
   * @returns {Promise<{ message: string, usuario: Usuario }>} Usuario modificado.
   * @throws {NotFoundException} Si el usuario no existe.
   * @throws {BadRequestException} Si el nuevo correo ya se encuentra en uso.
   */
  async updateAdminData(id: number, dto: UpdateUserAdminDto, adminId: number, ip: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id_usuario: id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email !== user.email) {
      const exists = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
      if (exists) throw new BadRequestException('El email ya está en uso');
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: {
        email: dto.email,
        id_rol: dto.id_rol,
      },
    });

    await this.bitacora.logModificacion(
      `datos de usuario`,
      `Usuario: ${updatedUser.email} (ID: ${id})`,
      adminId,
      ip
    );

    return { message: 'Datos actualizados correctamente', usuario: updatedUser };
  }
}
