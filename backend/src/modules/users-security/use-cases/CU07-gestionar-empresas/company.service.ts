import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { UpdateCompanyDto, RegisterCompanyDto } from './dto/company.dto.js';
import { AppearanceStorageService } from '../CU08-personalizar-apariencia/appearance-storage.service.js';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcrypt';
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
    private readonly appearanceStorage: AppearanceStorageService,
  ) {
    this.ensureStorage();
  }

  /**
   * Aprovisiona físicamente una nueva base de datos para un nuevo Tenant en Azure PostgreSQL.
   * Ejecuta la plantilla DDL EsquemaEcommerce.sql y crea el usuario administrador inicial con su rol y perfil de empleado.
   */
  private async provisionTenantDatabase(
    tenantKey: string,
    companyName: string,
    adminEmail?: string,
    adminPassword?: string,
    ownerName?: string,
    ownerPhone?: string,
  ): Promise<void> {
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

        // Cargar esquema estructural DDL de EsquemaEcommerce.sql probando rutas candidatas
        const candidatePaths = [
          path.resolve(process.cwd(), 'Base de Datos', 'EsquemaEcommerce.sql'),
          path.resolve(process.cwd(), 'backend', 'Base de Datos', 'EsquemaEcommerce.sql'),
          path.resolve(process.cwd(), '..', 'Base de Datos', 'EsquemaEcommerce.sql'),
          path.resolve(process.cwd(), 'ecommerce-web', 'backend', 'Base de Datos', 'EsquemaEcommerce.sql'),
        ];
        const ddlPath = candidatePaths.find((p) => fs.existsSync(p));

        if (!ddlPath) {
          throw new Error(`No se encontró EsquemaEcommerce.sql en: ${candidatePaths.join(', ')}`);
        }

        const tenantDbClient = new Client({
          connectionString: `${urlObj.protocol}//${urlObj.username}:${encodeURIComponent(urlObj.password)}@${urlObj.host}/${dbName}?sslmode=require`,
        });
        await tenantDbClient.connect();

        try {
          const ddlSql = fs.readFileSync(ddlPath, 'utf8');
          await tenantDbClient.query(ddlSql);

          // Crear usuario administrador inicial para la nueva empresa
          const finalAdminEmail = (adminEmail || `admin@${tenantKey}.bo`).toLowerCase().trim();
          const finalPassword = adminPassword || 'Admin123*';
          const passwordHash = await bcrypt.hash(finalPassword, 10);

          const userRes = await tenantDbClient.query(
            `
            INSERT INTO USUARIO (EMAIL, PASSWORD_HASH, ESTADO, ID_ROL)
            VALUES ($1, $2, 'activo', 1)
            ON CONFLICT (EMAIL) DO UPDATE SET PASSWORD_HASH = EXCLUDED.PASSWORD_HASH
            RETURNING ID_USUARIO;
          `,
            [finalAdminEmail, passwordHash],
          );

          const adminUserId = userRes.rows[0]?.id_usuario || 1;

          // Crear perfil inicial de empleado para el administrador
          const fullName = (ownerName || 'Administrador General').trim();
          const nameParts = fullName.split(' ');
          const nombre = nameParts[0] || 'Administrador';
          const apellido = nameParts.slice(1).join(' ') || 'Principal';
          const telefono = ownerPhone || '+591 0000000';

          await tenantDbClient.query(
            `
            INSERT INTO EMPLEADO (ID_EMPLEADO, CODIGO_EMPLEADO, CI, NOMBRE, APELLIDO, TELEFONO, FECHA_CONTRATACION, ESTADO)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, 'activo')
            ON CONFLICT (ID_EMPLEADO) DO UPDATE 
            SET NOMBRE = EXCLUDED.NOMBRE, APELLIDO = EXCLUDED.APELLIDO, TELEFONO = EXCLUDED.TELEFONO;
          `,
            [adminUserId, 'EMP-ADM-001', '0000000', nombre, apellido, telefono],
          );

          this.logger.log(`Esquema DDL completo, administrador (${finalAdminEmail}) y perfil creados en ${dbName}.`);
        } finally {
          await tenantDbClient.end().catch(() => {});
        }

        // Precalentar pool de conexión en PrismaService
        try {
          await this.prisma.getClientForTenant(tenantKey).$connect();
          this.logger.log(`Pool de conexión Prisma inicializado para nuevo tenant [${tenantKey}].`);
        } catch (poolErr: any) {
          this.logger.warn(`Pool de conexión para ${tenantKey} se inicializará bajo demanda: ${poolErr.message}`);
        }
      }
      // También se ejecuta al reintentar un aprovisionamiento parcialmente completado.
      await this.provisionTenantAppearance(tenantKey, companyName);
    } catch (err: any) {
      this.logger.error(`Error aprovisionando base de datos para ${tenantKey}: ${err.message}`);
      throw new BadRequestException(`Fallo en el aprovisionamiento de la base de datos para ${tenantKey}: ${err.message}`);
    } finally {
      await client.end().catch(() => {});
    }
  }

  /**
   * Inicializa la configuración de apariencia visual del nuevo tenant para que su tienda sea visible de inmediato.
   */
  private async provisionTenantAppearance(tenantKey: string, companyName: string): Promise<void> {
    const appearance = {
          codigo_empresa: tenantKey,
          site_title: companyName,
          primary_color: '#1A1A1A',
          secondary_color: '#8C827A',
          accent_color: '#C4956A',
          font_family: 'Playfair Display, serif',
          tagline: 'COLECCIÓN EXCLUSIVA',
          hero_headline: 'NUEVA COLECCIÓN',
          hero_subheadline: companyName.toUpperCase(),
          hero_description: `Descubre las prendas y tendencias exclusivas diseñadas por ${companyName}.`,
          hero_banner_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
          badge: 'NUEVO LANZAMIENTO',
          cta_primary_text: 'Explorar Catálogo',
          cta_secondary_text: 'Ver Novedades',
          trust1_title: 'Envío Garantizado',
          trust1_desc: 'Despacho seguro nacional',
          trust2_title: 'Calidad Premium',
          trust2_desc: 'Materiales seleccionados',
          trust3_title: 'Pagos Seguros',
          trust3_desc: 'QR, Tarjetas & Pasarela',
          admin_sidebar_color: '#1A1A1A',
          admin_accent_color: '#C4956A',
          storefront_bg_color: '#FAF8F5',
          fecha_modificacion: new Date().toISOString(),
    };
    await this.appearanceStorage.put(tenantKey, appearance, true);
    this.logger.log(`Apariencia visual inicial para ${tenantKey} disponible.`);
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

  /**
   * Registra una nueva empresa y aprovisiona automáticamente su base de datos física
   * y su cuenta de usuario administrador inicial.
   */
  async registerCompany(
    dto: RegisterCompanyDto,
    ip?: string,
  ): Promise<{ success: boolean; message: string; data: any }> {
    const key = (dto.codigo_empresa || '').toLowerCase().trim();
    if (!key) {
      throw new BadRequestException('El identificador único (slug) de la empresa es obligatorio.');
    }

    const all = this.loadAll();
    if (all[key]) {
      throw new BadRequestException(`El identificador de empresa "${key}" ya está en uso. Por favor elija otro.`);
    }

    const newCompany: CompanyRecord = {
      codigo_empresa: key,
      razon_social: dto.razon_social.trim(),
      nombre_comercial: dto.nombre_comercial.trim(),
      nit: dto.nit.trim(),
      pais: dto.pais || 'Bolivia',
      moneda_principal: dto.moneda_principal || 'BOB',
      moneda_secundaria: dto.moneda_secundaria || 'USD',
      email: dto.email.trim(),
      telefono: dto.telefono || '+591 0000000',
      ciudad_nombre: dto.ciudad_nombre || 'Santa Cruz de la Sierra',
      direccion: dto.direccion || 'Oficina Central',
      estado: 'ACTIVO',
      logo_url: dto.logo_url || '/logo.jpg',
      fecha_modificacion: new Date().toISOString(),
    };

    all[key] = newCompany;
    this.saveAll(all);

    // Aprovisionar físicamente la base de datos y el usuario admin
    await this.provisionTenantDatabase(
      key,
      newCompany.nombre_comercial,
      dto.admin_email,
      dto.admin_password,
      dto.admin_nombre,
      dto.admin_telefono,
    );

    this.logger.log(`Nueva empresa [${key}] registrada y aprovisionada exitosamente con base de datos ${key}_db`);

    if (ip) {
      await this.bitacoraService.logAction(
        'Alta de Nueva Empresa SaaS',
        `Empresa: ${newCompany.nombre_comercial} (Ruta: /store/${key}, Admin: ${dto.admin_email})`,
        1,
        ip,
      );
    }

    return {
      success: true,
      message: `¡Empresa ${newCompany.nombre_comercial} creada y aprovisionada exitosamente! Tu base de datos y usuario administrador están listos.`,
      data: {
        codigo_empresa: key,
        nombre_comercial: newCompany.nombre_comercial,
        store_url: `/store/${key}`,
        login_url: `/store/${key}/login`,
        admin_email: dto.admin_email,
        database_name: `${key.replace(/[^a-z0-9_]/g, '_')}_db`,
      },
    };
  }
}
