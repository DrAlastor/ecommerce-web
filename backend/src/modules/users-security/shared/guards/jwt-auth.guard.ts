/**
 * @file jwt-auth.guard.ts
 * @description Guardián de autenticación basado en JSON Web Tokens (JWT).
 * Intercepta peticiones entrantes y delega en Passport JWT Strategy para validar
 * la firma criptográfica del Bearer token y la vigencia temporal del usuario.
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard obligatorio: Si la petición no incluye un token JWT válido o el usuario está inactivo,
 * deniega el acceso lanzando automáticamente un UnauthorizedException (HTTP 401).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
