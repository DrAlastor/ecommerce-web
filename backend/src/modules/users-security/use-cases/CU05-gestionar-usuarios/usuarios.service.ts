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

  async logConsultaUsers(adminId: number, ip?: string) {
    await this.bitacora.logConsulta('lista de usuarios', 'Módulo de Gestión de usuarios', adminId, ip);
  }

  async logConsultaUserDetail(userId: number, adminId: number, ip?: string) {
    await this.bitacora.logConsulta('detalle de usuario', `Usuario ID: ${userId}`, adminId, ip);
  }

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

    await this.bitacora.logModificacion(
      `estado de usuario a ${dto.estado}`,
      `Usuario: ${user.email} (ID: ${id})`,
      adminId,
      ip
    );

    return { message: 'Estado actualizado correctamente', estado: updatedUser.estado };
  }

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
