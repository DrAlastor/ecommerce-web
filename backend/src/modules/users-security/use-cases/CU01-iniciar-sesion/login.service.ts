import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import type { FuncionDto, LoginResponseDto } from '../../shared/dto/login-response.dto.js';

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (usuario.estado !== 'activo') {
      throw new ForbiddenException('La cuenta se encuentra desactivada');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password_hash, ...userWithoutPassword } = usuario;
    return userWithoutPassword;
  }

  async login(user: any): Promise<LoginResponseDto> {
    const rol = await this.prisma.rol.findUnique({
      where: { id_rol: user.id_rol },
    });

    if (!rol) {
      throw new UnauthorizedException('Rol no encontrado o inválido');
    }

    const rolFunciones = await this.prisma.rol_funcion.findMany({
      where: { id_rol: user.id_rol },
      include: { funcion: { include: { modulo: true } } },
    });

    const funciones: FuncionDto[] = rolFunciones.map((rf) => ({
      id_funcion: rf.funcion.id_funcion,
      nombre: rf.funcion.nombre,
      modulo: rf.funcion.modulo.nombre,
      nivel_acceso: rf.descripcion ?? 'Lectura',
    }));

    const payload = { sub: user.id_usuario, email: user.email, rol: rol.nombre, id_rol: rol.id_rol };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: { id_usuario: user.id_usuario, email: user.email, estado: user.estado },
      rol: { id_rol: rol.id_rol, nombre: rol.nombre },
      funciones,
    };
  }
}
