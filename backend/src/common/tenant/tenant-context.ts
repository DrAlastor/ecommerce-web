/**
 * @file tenant-context.ts
 * @description Almacén de contexto asíncrono para aislamiento multi-tenant en NestJS.
 * Utiliza AsyncLocalStorage de Node.js para propagar el identificador del tenant
 * a lo largo de toda la cadena de ejecución de la solicitud HTTP sin acoplar los servicios.
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Retorna el tenantId activo en el contexto de la petición actual.
 * Si la ejecución ocurre fuera de una petición HTTP (jobs, seeding, arranque),
 * retorna 'dressly' como inquilino predeterminado.
 */
export function getTenantId(): string {
  const store = tenantStorage.getStore();
  return store?.tenantId || 'dressly';
}

/**
 * Ejecuta una función dentro del contexto de un tenant específico.
 */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return tenantStorage.run({ tenantId }, fn);
}

