import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  FuncionDto,
  LoginResponseDto,
} from './dto/login-response.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Valida las credenciales del usuario.
   * Busca por email, verifica estado y compara contraseña con bcrypt.
   * Retorna el usuario sin password_hash.
   */
  async validateUser(email: string, password: string) {
    // Normalizar email
    const normalizedEmail = email.trim().toLowerCase();

    // Buscar usuario por email
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar estado de la cuenta
    if (usuario.estado !== 'activo') {
      throw new ForbiddenException('La cuenta se encuentra desactivada');
    }

    // Comparar contraseña con hash
    const isPasswordValid = await bcrypt.compare(
      password,
      usuario.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Retornar usuario sin password_hash
    const { password_hash, ...userWithoutPassword } = usuario;
    return userWithoutPassword;
  }

  /**
   * Genera el token JWT y construye la respuesta de login.
   * Consulta rol, funciones y módulos asociados.
   */
  async login(user: {
    id_usuario: number;
    email: string;
    estado: string;
    id_rol: number;
  }): Promise<LoginResponseDto> {
    // Obtener rol
    const rol = await this.prisma.rol.findUnique({
      where: { id_rol: user.id_rol },
    });

    if (!rol) {
      throw new UnauthorizedException('Rol no encontrado o inválido');
    }

    // Obtener funciones asignadas al rol con su módulo
    const rolFunciones = await this.prisma.rol_funcion.findMany({
      where: { id_rol: user.id_rol },
      include: {
        funcion: {
          include: {
            modulo: true,
          },
        },
      },
    });

    // Construir array de funciones con nivel de acceso
    const funciones: FuncionDto[] = rolFunciones.map((rf) => ({
      id_funcion: rf.funcion.id_funcion,
      nombre: rf.funcion.nombre,
      modulo: rf.funcion.modulo.nombre,
      nivel_acceso: rf.descripcion ?? 'Lectura',
    }));

    // Crear payload del JWT
    const payload = {
      sub: user.id_usuario,
      email: user.email,
      rol: rol.nombre,
      id_rol: rol.id_rol,
    };

    // Firmar token
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id_usuario: user.id_usuario,
        email: user.email,
        estado: user.estado,
      },
      rol: {
        id_rol: rol.id_rol,
        nombre: rol.nombre,
      },
      funciones,
    };
  }

  /**
   * Obtiene el perfil completo del usuario autenticado.
   * Usado por GET /auth/profile.
   */
  async getProfile(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
      include: {
        rol: true,
        cliente: true,
        empleado: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const { password_hash, ...userWithoutPassword } = usuario;

    // Obtener funciones del rol
    const rolFunciones = await this.prisma.rol_funcion.findMany({
      where: { id_rol: usuario.id_rol },
      include: {
        funcion: {
          include: {
            modulo: true,
          },
        },
      },
    });

    const funciones: FuncionDto[] = rolFunciones.map((rf) => ({
      id_funcion: rf.funcion.id_funcion,
      nombre: rf.funcion.nombre,
      modulo: rf.funcion.modulo.nombre,
      nivel_acceso: rf.descripcion ?? 'Lectura',
    }));

    return {
      user: userWithoutPassword,
      rol: {
        id_rol: usuario.rol.id_rol,
        nombre: usuario.rol.nombre,
      },
      funciones,
    };
  }
}
