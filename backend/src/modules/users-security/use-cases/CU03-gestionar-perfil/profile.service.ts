import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import type { FuncionDto } from '../../shared/dto/login-response.dto.js';
import * as bcrypt from 'bcrypt';
import { RegisterClienteDto } from './dto/register-cliente.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

import { BitacoraService } from '../../shared/services/bitacora.service.js';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  async getProfile(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
      include: { rol: true, cliente: true, empleado: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const { password_hash, ...userWithoutPassword } = usuario;

    const rolFunciones = await this.prisma.rol_funcion.findMany({
      where: { id_rol: usuario.id_rol },
      include: { funcion: { include: { modulo: true } } },
    });

    const funciones: FuncionDto[] = rolFunciones.map((rf) => ({
      id_funcion: rf.funcion.id_funcion,
      nombre: rf.funcion.nombre,
      modulo: rf.funcion.modulo.nombre,
      nivel_acceso: rf.descripcion ?? 'Lectura',
    }));

    return {
      user: userWithoutPassword,
      rol: { id_rol: usuario.rol.id_rol, nombre: usuario.rol.nombre },
      funciones,
    };
  }

  async registerCliente(dto: RegisterClienteDto) {
    // 1. Validar que el correo no exista
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    // 2. Validar que el CI no exista (si se proporcionó)
    if (dto.ci) {
      const existingCliente = await this.prisma.cliente.findUnique({
        where: { ci: dto.ci },
      });
      if (existingCliente) {
        throw new BadRequestException('El CI ya está registrado');
      }
    }

    // 3. Obtener el rol de Cliente
    const rolCliente = await this.prisma.rol.findUnique({
      where: { nombre: 'Cliente' },
    });

    if (!rolCliente) {
      throw new BadRequestException('Rol Cliente no encontrado en el sistema');
    }

    // 4. Obtener el max id_usuario (por falta de autoincrement en el esquema base)
    const result = await this.prisma.usuario.aggregate({
      _max: {
        id_usuario: true,
      },
    });
    const nextId = (result._max.id_usuario || 0) + 1;

    // 5. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 6. Transacción para crear usuario y cliente
    const nuevoUsuario = await this.prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          id_usuario: nextId,
          email: dto.email,
          password_hash: passwordHash,
          id_rol: rolCliente.id_rol,
          estado: 'activo',
        },
      });

      await tx.cliente.create({
        data: {
          id_cliente: nextId,
          nombre: dto.nombre,
          apellido: dto.apellido,
          ci: dto.ci || null,
        },
      });

      return user;
    });

    const { password_hash, ...userSinPass } = nuevoUsuario;

    await this.bitacora.logCreacion(
      'cuenta de cliente',
      `Cliente: ${dto.email} (ID: ${nuevoUsuario.id_usuario})`,
      nuevoUsuario.id_usuario,
    );

    return userSinPass;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
      include: { cliente: true, empleado: true },
    });

    if (!usuario) {
      throw new BadRequestException('El usuario no existe');
    }

    if (usuario.cliente) {
      // Preparar campos a actualizar para cliente
      const dataToUpdate: any = {};
      if (dto.nombre !== undefined) dataToUpdate.nombre = dto.nombre;
      if (dto.apellido !== undefined) dataToUpdate.apellido = dto.apellido;
      if (dto.sexo !== undefined) dataToUpdate.sexo = dto.sexo;
      if (dto.fecha_nacimiento !== undefined && dto.fecha_nacimiento !== '') {
        dataToUpdate.fecha_nacimiento = new Date(dto.fecha_nacimiento);
      }
      if (dto.preferencias_estilo !== undefined) {
        dataToUpdate.preferencias_estilo = dto.preferencias_estilo;
      }

      const updated = await this.prisma.cliente.update({
        where: { id_cliente: userId },
        data: dataToUpdate,
      });

      await this.bitacora.logModificacion(
        'perfil de usuario',
        `Usuario: ${usuario.email} (ID: ${userId})`,
        userId,
      );

      return updated;
    } else if (usuario.empleado) {
      // Preparar campos a actualizar para empleado
      const dataToUpdate: any = {};
      if (dto.nombre !== undefined) dataToUpdate.nombre = dto.nombre;
      if (dto.apellido !== undefined) dataToUpdate.apellido = dto.apellido;
      if (dto.telefono !== undefined) dataToUpdate.telefono = dto.telefono;

      const updated = await this.prisma.empleado.update({
        where: { id_empleado: userId },
        data: dataToUpdate,
      });

      await this.bitacora.logModificacion(
        'perfil de usuario',
        `Usuario: ${usuario.email} (ID: ${userId})`,
        userId,
      );

      return updated;
    } else {
      throw new BadRequestException('El usuario no tiene un perfil válido para actualizar');
    }
  }
}
