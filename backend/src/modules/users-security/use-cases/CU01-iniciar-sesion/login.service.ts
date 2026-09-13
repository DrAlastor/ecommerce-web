import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import type { FuncionDto, LoginResponseDto } from '../../shared/dto/login-response.dto.js';

import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { ActiveSessionService } from '../../shared/services/active-session.service.js';

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly bitacora: BitacoraService,
    private readonly activeSessionService: ActiveSessionService,
  ) {}

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      include: { cliente: true, empleado: true }
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

  async login(user: any, ip?: string): Promise<LoginResponseDto> {
    // Registrar al usuario como CONECTADO en tiempo real
    this.activeSessionService.connect(user.id_usuario);

    await this.bitacora.logInicioSesion(
      user.id_usuario,
      `Usuario: ${user.email} (ID: ${user.id_usuario})`,
      ip,
    );

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
      user: {
        id_usuario: user.id_usuario,
        email: user.email,
        estado: user.estado,
        cliente: user.cliente,
        empleado: user.empleado
      },
      rol: { id_rol: rol.id_rol, nombre: rol.nombre },
      funciones,
    };
  }
}
