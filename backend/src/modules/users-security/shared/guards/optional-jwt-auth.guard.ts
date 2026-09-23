/**
 * @file optional-jwt-auth.guard.ts
 * @description Guardián de autenticación JWT opcional.
 * Utilizado en rutas públicas que pueden enriquecerse si el usuario ha iniciado sesión
 * (por ejemplo: catálogo de productos con recomendaciones personalizadas, carrito de compras anónimo vs autenticado),
 * pero sin bloquear ni arrojar error 401 si la petición proviene de un visitante anónimo.
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard opcional: Extrae el usuario si el Bearer token es válido; si no existe token o es inválido,
 * permite continuar la ejecución asignando `null` a `request.user` sin interrumpir la petición.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Sobrescribe el manejador de respuesta de Passport.
   *
   * @param {any} err - Error eventual producido durante la decodificación.
   * @param {any} user - Objeto de usuario extraído del payload si el token fue válido.
   * @returns {any | null} Usuario validado o null para visitantes anónimos.
   */
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
