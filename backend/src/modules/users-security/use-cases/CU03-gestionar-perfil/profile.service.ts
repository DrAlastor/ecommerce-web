import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import type { FuncionDto } from '../../shared/dto/login-response.dto.js';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

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
}
