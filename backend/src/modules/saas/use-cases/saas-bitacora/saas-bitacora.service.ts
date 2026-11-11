import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';

export interface SaasBitacoraItem {
  id: number | string;
  accion: string;
  fecha_hora: string;
  entidad_afectada: string;
  ip?: string | null;
  usuario_id: number;
  usuario_email: string;
  tenantKey: string;
  tenantName: string;
}

@Injectable()
export class SaasBitacoraService {
  private readonly logger = new Logger(SaasBitacoraService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly companyFile = path.resolve(this.dataDir, 'tenants_company.json');

  constructor(private readonly prisma: PrismaService) {}

  private loadCompanies(): Record<string, any> {
    try {
      if (fs.existsSync(this.companyFile)) {
        return JSON.parse(fs.readFileSync(this.companyFile, 'utf8'));
      }
    } catch (e: any) {
      this.logger.warn(`Error leyendo companies: ${e.message}`);
    }
    return {};
  }

  async getConsolidatedBitacora(params?: {
    tenantKey?: string;
    search?: string;
    limit?: number;
  }): Promise<SaasBitacoraItem[]> {
    const companies = this.loadCompanies();
    const limit = params?.limit || 150;
    const targetTenants =
      params?.tenantKey && params.tenantKey !== 'ALL'
        ? [params.tenantKey]
        : Object.keys(companies);

    const allRecords: SaasBitacoraItem[] = [];

    for (const key of targetTenants) {
      const compName = companies[key]?.nombre_comercial || key;
      try {
        const client = this.prisma.getClientForTenant(key);
        const entries = await client.bitacora.findMany({
          orderBy: { fecha_hora: 'desc' },
          take: 50,
          include: {
            usuario: {
              select: { email: true, id_usuario: true },
            },
          },
        });

        entries.forEach((e) => {
          allRecords.push({
            id: `${key}_${e.id_bitacora}`,
            accion: e.accion,
            fecha_hora: e.fecha_hora.toISOString(),
            entidad_afectada: e.entidad_afectada,
            ip: e.ip,
            usuario_id: e.id_usuario,
            usuario_email: e.usuario?.email || 'sistema@fashionstore.com',
            tenantKey: key,
            tenantName: compName,
          });
        });
      } catch (err: any) {
        this.logger.warn(`Error consultando bitácora para tenant [${key}]: ${err.message}`);
      }
    }

    // Ordenar de más reciente a más antiguo
    let sorted = allRecords.sort(
      (a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime(),
    );

    if (params?.search) {
      const term = params.search.toLowerCase().trim();
      sorted = sorted.filter(
        (r) =>
          r.accion.toLowerCase().includes(term) ||
          r.entidad_afectada.toLowerCase().includes(term) ||
          r.usuario_email.toLowerCase().includes(term) ||
          r.tenantName.toLowerCase().includes(term),
      );
    }

    return sorted.slice(0, limit);
  }
}

