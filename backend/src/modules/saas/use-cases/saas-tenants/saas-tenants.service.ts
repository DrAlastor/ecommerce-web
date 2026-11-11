import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../../users-security/shared/services/bitacora.service.js';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { EnrichedTenantDetails, UpdateTenantAdminDto } from './saas-tenants.dto.js';

@Injectable()
export class SaasTenantsService {
  private readonly logger = new Logger(SaasTenantsService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly companyFile = path.resolve(this.dataDir, 'tenants_company.json');
  private readonly metaFile = path.resolve(this.dataDir, 'tenants_saas_meta.json');

  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacoraService: BitacoraService,
  ) {}

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

  private saveCompanies(data: Record<string, any>) {
    try {
      fs.writeFileSync(this.companyFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e: any) {
      this.logger.error(`Error guardando companies: ${e.message}`);
    }
  }

  private loadMetadata(): Record<string, any> {
    try {
      if (fs.existsSync(this.metaFile)) {
        return JSON.parse(fs.readFileSync(this.metaFile, 'utf8'));
      }
    } catch (e: any) {
      this.logger.warn(`Error leyendo saas metadata: ${e.message}`);
    }
    return {};
  }

  private saveMetadata(data: Record<string, any>) {
    try {
      fs.writeFileSync(this.metaFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e: any) {
      this.logger.error(`Error guardando saas metadata: ${e.message}`);
    }
  }

  async getAllTenants(): Promise<EnrichedTenantDetails[]> {
    const companies = this.loadCompanies();
    const metadata = this.loadMetadata();
    const result: EnrichedTenantDetails[] = [];

    for (const key of Object.keys(companies)) {
      const comp = companies[key];
      const meta = metadata[key] || {};

      let totalProducts = 0;
      let totalCustomers = 0;
      let totalOrders = 0;
      let totalRevenue = 0;

      try {
        const client = this.prisma.getClientForTenant(key);
        const [pCount, cCount, vCount, vAgg] = await Promise.all([
          client.producto.count(),
          client.cliente.count(),
          client.venta.count(),
          client.venta.aggregate({ _sum: { total: true } }),
        ]);
        totalProducts = pCount;
        totalCustomers = cCount;
        totalOrders = vCount;
        totalRevenue = Number(vAgg._sum.total || 0);
      } catch (err: any) {
        this.logger.warn(`No se pudo leer conteo en DB para ${key}: ${err.message}`);
      }

      let dbName = `${key.replace(/[^a-z0-9_]/g, '_')}_db`;
      if (key === 'dressly') dbName = 'dressly_db';
      if (key === 'urbanly') dbName = 'urbanly_db';
      if (key === 'aura-sport') dbName = 'aura_sport_db';

      result.push({
        codigo_empresa: key,
        nombre_comercial: comp.nombre_comercial || key,
        razon_social: comp.razon_social || comp.nombre_comercial || key,
        nit: comp.nit || '',
        email: comp.email || `contacto@${key}.com`,
        telefono: comp.telefono || '',
        ciudad_nombre: comp.ciudad_nombre || 'Santa Cruz de la Sierra',
        direccion: comp.direccion || '',
        pais: comp.pais || 'Bolivia',
        estado: comp.estado || meta.status || 'ACTIVO',
        planId: meta.planId || (key === 'dressly' ? 'EMPRESARIAL' : key === 'urbanly' ? 'PREMIUM' : 'CORPORATIVO'),
        planName: meta.planName || (key === 'dressly' ? 'Plan Empresarial' : key === 'urbanly' ? 'Plan Premium' : 'Plan Corporativo'),
        monthlyFeeUSD: meta.monthlyFeeUSD || (key === 'dressly' ? 299.9 : key === 'urbanly' ? 69.9 : 149.9),
        databaseName: dbName,
        totalProducts,
        totalCustomers,
        totalOrders,
        totalRevenue,
        createdAt: meta.createdAt || comp.fecha_modificacion || new Date().toISOString(),
        lastModified: comp.fecha_modificacion || new Date().toISOString(),
      });
    }

    return result;
  }

  async updateTenant(
    tenantKey: string,
    dto: UpdateTenantAdminDto,
    userId: number = 1,
    ip?: string,
  ): Promise<{ success: boolean; message: string; data: EnrichedTenantDetails }> {
    const key = tenantKey.toLowerCase().trim();
    const companies = this.loadCompanies();
    const metadata = this.loadMetadata();

    if (!companies[key]) {
      throw new NotFoundException(`Inquilino [${key}] no encontrado.`);
    }

    const currentComp = companies[key];
    const currentMeta = metadata[key] || {};

    // 1. Actualizar objeto Company
    companies[key] = {
      ...currentComp,
      nombre_comercial: dto.nombre_comercial,
      razon_social: dto.razon_social,
      nit: dto.nit ?? currentComp.nit,
      email: dto.email,
      telefono: dto.telefono ?? currentComp.telefono,
      ciudad_nombre: dto.ciudad_nombre ?? currentComp.ciudad_nombre,
      direccion: dto.direccion ?? currentComp.direccion,
      estado: dto.estado ?? currentComp.estado ?? 'ACTIVO',
      fecha_modificacion: new Date().toISOString(),
    };
    this.saveCompanies(companies);

    // 2. Actualizar Metadata de Plan y Estado
    if (dto.planId || dto.planName || dto.estado) {
      metadata[key] = {
        ...currentMeta,
        planId: dto.planId || currentMeta.planId || 'PREMIUM',
        planName: dto.planName || currentMeta.planName || 'Plan Premium',
        status: dto.estado || currentMeta.status || 'ACTIVO',
      };
      this.saveMetadata(metadata);
    }

    // 3. Sincronizar contraseña del usuario admin en su BD si se especificó
    if (dto.adminPassword) {
      try {
        const client = this.prisma.getClientForTenant(key);
        const hash = await bcrypt.hash(dto.adminPassword, 10);
        await client.usuario.updateMany({
          where: { id_rol: 1 },
          data: { password_hash: hash },
        });
        this.logger.log(`Contraseña de admin actualizada en DB para tenant [${key}].`);
      } catch (err: any) {
        this.logger.warn(`No se pudo actualizar contraseña en BD de tenant [${key}]: ${err.message}`);
      }
    }

    // 4. Registrar en bitácora
    if (ip) {
      await this.bitacoraService.logAction(
        'Modificación de Tenant',
        `Super Admin actualizó datos de empresa: ${dto.nombre_comercial} (${key})`,
        userId,
        ip,
      );
    }

    const all = await this.getAllTenants();
    const updated = all.find((t) => t.codigo_empresa === key)!;

    return {
      success: true,
      message: `Datos del inquilino [${dto.nombre_comercial}] actualizados con éxito.`,
      data: updated,
    };
  }
}

