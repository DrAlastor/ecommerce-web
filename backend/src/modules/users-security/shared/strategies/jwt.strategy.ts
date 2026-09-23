/**
 * @file jwt.strategy.ts
 * @description Estrategia Passport JWT para autenticación de peticiones protegidas.
 * Extrae y valida el token Bearer del header 'Authorization', comprueba la existencia
 * y estado activo del usuario en la base de datos, e inyecta los datos de identidad en `request.user`.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../../prisma/prisma.service.js';

/**
 * Estructura del contenido decodificado (claims) en el token JWT.
 */
export interface JwtPayload {
  sub: number;       // ID del usuario (subject)
  email: string;     // Correo electrónico principal
  rol: string;       // Nombre del rol (ej. 'Administrador', 'Cliente')
  id_rol: number;    // ID numérico del rol en BD
  iat?: number;      // Timestamp de emisión (Issued At)
  exp?: number;      // Timestamp de expiración
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.getOrThrow<string>('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Procedimiento de validación del payload decodificado del JWT.
   * Consulta la base de datos para confirmar que el usuario existe y su estado es 'activo'.
   *
   * @param {JwtPayload} payload - Datos contenidos en el token firmado.
   * @returns {Promise<{ id_usuario: number, email: string, rol: string, id_rol: number }>}
   * Objeto de identidad inyectado automáticamente en `req.user`.
   * @throws {UnauthorizedException} Si el usuario no existe o se encuentra desactivado/bloqueado.
   */
  async validate(payload: JwtPayload) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: payload.sub },
    });

    if (!usuario || usuario.estado !== 'activo') {
      throw new UnauthorizedException('Sesión inválida o usuario desactivado');
    }

    return {
      id_usuario: payload.sub,
      email: payload.email,
      rol: payload.rol,
      id_rol: payload.id_rol,
    };
  }
}
