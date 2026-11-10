import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { UpdateCompanyDto } from './dto/company.dto.js';
import * as fs from 'fs';
import * as path from 'path';
import pkg from 'pg';
const { Client } = pkg;

export interface CompanyRecord {
  codigo_empresa: string;
  razon_social: string;
  nombre_comercial: string;
  nit: string;
  pais: string;
  moneda_principal: string;
  moneda_secundaria: string;
  email: string;
  telefono: string;
  ciudad_nombre: string;
  direccion: string;
  estado: string;
  logo_url: string;
  fecha_modificacion: string;
}

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly dataFile = path.resolve(this.dataDir, 'tenants_company.json');

  private defaultCompanies: Record<string, CompanyRecord> = {
    dressly: {
      codigo_empresa: 'dressly',
      razon_social: 'Dressly Fashion Store S.R.L.',
      nombre_comercial: 'Dressly Fashion Store',
      nit: '1029384756',
      pais: 'Bolivia',
      moneda_principal: 'BOB',
      moneda_secundaria: 'USD',
      email: 'contacto@dressly.com',
      telefono: '+591 3 3456789',
      ciudad_nombre: 'Santa Cruz de la Sierra',
      direccion: 'Av. San Martín #450, Equipetrol',
      estado: 'ACTIVO',
      logo_url: '/logo.jpg',
      fecha_modificacion: new Date().toISOString(),
    },
    'aura-sport': {
      codigo_empresa: 'aura-sport',
      razon_social: 'Aura Athletics & Sportswear S.A.',
      nombre_comercial: 'Aura Athletics',
      nit: '9876543210',
      pais: 'Bolivia',
      moneda_principal: 'BOB',
      moneda_secundaria: 'USD',
      email: 'info@auraathletics.com',
      telefono: '+591 3 3887766',
      ciudad_nombre: 'Santa Cruz de la Sierra',
      direccion: 'Centro Comercial Las Brisas, Piso 2, Local 210',
      estado: 'ACTIVO',
      logo_url: '/logo-aura.jpg',
      fecha_modificacion: new Date().toISOString(),
    },
    urbanly: {
      codigo_empresa: 'urbanly',
      razon_social: 'Urbanly Fashion Store S.R.L.',
      nombre_comercial: 'Urbanly Fashion Store',
      nit: '5647382910',
      pais: 'Bolivia',
      moneda_principal: 'BOB',
      moneda_secundaria: 'USD',
      email: 'crew@urbanly.com',
      telefono: '+591 3 3112233',
      ciudad_nombre: 'Santa Cruz de la Sierra',
      direccion: 'Calle 21 de Calacoto, San Miguel',
      estado: 'ACTIVO',
      logo_url: '/logo-urbanly.jpg',
      fecha_modificacion: new Date().toISOString(),
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacoraService: BitacoraService,
    private readonly configService: ConfigService,
  ) {
    this.ensureStorage();
  }

  /**
   * Aprovisiona físicamente una nueva base de datos para un nuevo Tenant en Azure PostgreSQL.
   * Ejecuta la plantilla DDL EsquemaEcommerce.sql y crea el usuario administrador inicial.
   */
  private async provisionTenantDatabase(tenantKey: string, companyName: string): Promise<void> {
    const dbName = `${tenantKey.replace(/[^a-z0-9_]/g, '_')}_db`;
    const defaultUrl = this.configService.getOrThrow<string>('DATABASE_URL');
    const urlObj = new URL(defaultUrl);
    const serverUrl = `${urlObj.protocol}//${urlObj.username}:${encodeURIComponent(urlObj.password)}@${urlObj.host}/postgres?sslmode=require`;

    const client = new Client({ connectionString: serverUrl });
    try {
      await client.connect();
      const checkRes = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
      if (checkRes.rowCount === 0) {
        this.logger.log(`Aprovisionando base de datos física para nuevo inquilino: ${dbName}...`);
        await client.query(`CREATE DATABASE "${dbName}";`);
        this.logger.log(`Base de datos ${dbName} creada con éxito en Azure PostgreSQL.`);

        // Cargar esquema estructural DDL de EsquemaEcommerce.sql
        const ddlPath = path.resolve(process.cwd(), 'Base de Datos', 'EsquemaEcommerce.sql');
        if (fs.existsSync(ddlPath)) {
          const tenantDbClient = new Client({
            connectionString: `${urlObj.protocol}//${urlObj.username}:${encodeURIComponent(urlObj.password)}@${urlObj.host}/${dbName}?sslmode=require`,
          });
          await tenantDbClient.connect();
          const ddlSql = fs.readFileSync(ddlPath, 'utf8');
          await tenantDbClient.query(ddlSql);

          // Crear usuario administrador inicial para la nueva empresa
          const adminEmail = `admin@${tenantKey}.bo`;
          await tenantDbClient.query(`
            INSERT INTO USUARIO (EMAIL, PASSWORD_HASH, ESTADO, ID_ROL)
            VALUES ('${adminEmail}', '$2b$10$dncfzXeXm93/Ze23m.0H2e7c31fP4.CsYkJ0zQeY2BbdfPu9OEj4O', 'activo', 1)
            ON CONFLICT (EMAIL) DO NOTHING;
          `);
          await tenantDbClient.end();
          this.logger.log(`Esquema y administrador inicial (${adminEmail}) creados en ${dbName}.`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error aprovisionando base de datos para ${tenantKey}: ${err.message}`);
    } finally {
      await client.end().catch(() => {});
    }
  }

  private ensureStorage() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!fs.existsSync(this.dataFile)) {
        fs.writeFileSync(this.dataFile, JSON.stringify(this.defaultCompanies, null, 2), 'utf8');
      }
    } catch (e) {
      this.logger.error('Error inicializando almacenamiento de compañías:', e);
    }
  }

  private loadAll(): Record<string, CompanyRecord> {
    try {
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      this.logger.warn('Error leyendo archivo de compañías, usando defaults:', e);
    }
    return { ...this.defaultCompanies };
  }

  private saveAll(data: Record<string, CompanyRecord>) {
    try {
      this.ensureStorage();
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      this.logger.error('Error guardando archivo de compañías:', e);
    }
  }

  async getCompanyInfo(tenantKey?: string, userId: number = 1, ip?: string): Promise<CompanyRecord> {
    const key = (tenantKey || 'dressly').toLowerCase().trim();
    const all = this.loadAll();
    const company = all[key] || all['dressly'] || this.defaultCompanies['dressly'];

    if (ip && userId) {
      await this.bitacoraService.logAction(
        'Consulta de Configuración',
        `Empresa: ${company.nombre_comercial}`,
        userId,
        ip,
      );
    }

    return company;
  }

  async listAllCompanies(): Promise<CompanyRecord[]> {
    const all = this.loadAll();
    return Object.values(all);
  }

  async updateCompany(
    dto: UpdateCompanyDto,
    tenantKey?: string,
    userId: number = 1,
    ip?: string,
  ): Promise<{ success: boolean; message: string; data: CompanyRecord }> {
    const key = (dto.codigo_empresa || tenantKey || 'dressly').toLowerCase().trim();
    const all = this.loadAll();
    const isNewTenant = !all[key];
    const existing = all[key] || this.defaultCompanies[key] || this.defaultCompanies['dressly'];

    // Validar tamaño si logo es Base64
    if (dto.logo_url && dto.logo_url.startsWith('data:')) {
      const stringLength = dto.logo_url.length - 'data:image/png;base64,'.length;
      const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
      const sizeInMb = sizeInBytes / (1024 * 1024);
      if (sizeInMb > 2) {
        throw new BadRequestException('El archivo de logotipo excede el tamaño máximo permitido (2 MB).');
      }
    }

    const updated: CompanyRecord = {
      ...existing,
      ...dto,
      codigo_empresa: key,
      fecha_modificacion: new Date().toISOString(),
    };

    all[key] = updated;
    this.saveAll(all);

    // Si es un inquilino nuevo, aprovisionar automáticamente su base de datos física
    if (isNewTenant) {
      await this.provisionTenantDatabase(key, updated.nombre_comercial);
    }

    this.logger.log(`Empresa [${key}] ${isNewTenant ? 'registrada y aprovisionada' : 'actualizada'} con éxito por usuario ${userId}`);

    if (ip && userId) {
      await this.bitacoraService.logAction(
        isNewTenant ? 'Registro y Aprovisionamiento de Nueva Empresa' : 'Actualización de Datos Corporativos',
        `Empresa: ${updated.nombre_comercial} (Ruta: /store/${key})`,
        userId,
        ip,
      );
    }

    return {
      success: true,
      message: `Empresa ${updated.nombre_comercial} ${isNewTenant ? 'creada y aprovisionada' : 'actualizada'} exitosamente con su ruta /store/${key}`,
      data: updated,
    };
  }
}
