/**
 * @file tenant.middleware.ts
 * @description Middleware para resolución e inyección del contexto de inquilino (Tenant).
 * Inspecciona encabezados (x-tenant-id), parámetros de consulta (tenant), y segmentos de URL
 * (/store/:tenant, /public/:tenant) para aislar la ejecución al tenant correcto.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { tenantStorage } from './tenant-context.js';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Encabezado explícito enviado por el cliente o frontend
    let tenant = (req.headers['x-tenant-id'] as string) || '';

    // 2. Parámetro de consulta (?tenant=...)
    if (!tenant && req.query.tenant) {
      tenant = String(req.query.tenant);
    }

    // 3. Segmento de URL (/store/:tenant, /public/:tenant, /catalog/:tenant)
    if (!tenant && req.originalUrl) {
      const match = req.originalUrl.match(/\/(?:store|public|tenant)\/([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        tenant = match[1];
      }
    }

    // Normalización y aliases de compatibilidad
    tenant = (tenant || 'dressly').toLowerCase().trim();
    if (tenant === 'subversive-urban' || tenant === 'subversive') {
      tenant = 'urbanly';
    } else if (tenant === 'aura') {
      tenant = 'aura-sport';
    }

    // Propagar identificador en la respuesta HTTP para trazabilidad
    res.setHeader('x-resolved-tenant', tenant);

    // Envolver el resto del ciclo de vida de la petición en el contexto del tenant
    tenantStorage.run({ tenantId: tenant }, () => {
      next();
    });
  }
}
