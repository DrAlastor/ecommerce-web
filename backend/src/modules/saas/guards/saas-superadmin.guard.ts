/**
 * @file saas-superadmin.guard.ts
 * @description Guardián de seguridad que protege los endpoints de administración global SaaS.
 * Verifica estrictamente que el Bearer token provenga de una sesión activa de Super Administrador.
 */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SaasAuthService } from '../use-cases/saas-auth/saas-auth.service.js';

@Injectable()
export class SaasSuperAdminGuard implements CanActivate {
  constructor(private readonly saasAuthService: SaasAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticación de Super Administrador requerido');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      throw new UnauthorizedException('Token de Super Administrador no proporcionado');
    }

    try {
      const user = await this.saasAuthService.validateToken(token);
      if (user.rolGlobal !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Acceso denegado: Se requieren privilegios de Super Administrador');
      }
      request.user = user;
      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException(err.message || 'Token de Super Administrador inválido o expirado');
    }
  }
}

