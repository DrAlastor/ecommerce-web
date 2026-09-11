import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../../prisma/prisma.service.js';

export interface JwtPayload {
  sub: number;
  email: string;
  rol: string;
  id_rol: number;
  iat?: number;
  exp?: number;
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
   * Valida el payload del JWT.
   * Verifica que el usuario aún exista y esté activo.
   * El objeto retornado se inyecta en request.user.
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
