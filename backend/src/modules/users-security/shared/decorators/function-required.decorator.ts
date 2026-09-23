/**
 * @file function-required.decorator.ts
 * @description Decorador de metadatos para autorización granular basada en funciones del sistema (RBAC/Función).
 * Permite marcar controladores o métodos de endpoint indicando el módulo y la función/permiso requeridos
 * para que `FunctionGuard` valide si el rol del usuario autenticado tiene acceso en la tabla `rol_funcion`.
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Decorador de método/clase que asocia los requisitos de función de negocio a la ruta.
 *
 * @param {string} modulo - Nombre del módulo o subsistema (ej. 'Ventas y Facturación', 'Usuarios y Seguridad').
 * @param {string} permiso - Nombre de la función o acción requerida (ej. 'Gestionar Devoluciones', 'Gestionar empleados').
 * @returns {CustomDecorator<string>} Metadato 'function_required' consumible por el Reflector de NestJS.
 *
 * @example
 * ```typescript
 * @Get('devoluciones')
 * @FunctionRequired('Ventas y Facturación', 'Gestionar Devoluciones')
 * async getReturns() { ... }
 * ```
 */
export const FunctionRequired = (modulo: string, permiso: string) => 
  SetMetadata('function_required', { modulo, permiso });
