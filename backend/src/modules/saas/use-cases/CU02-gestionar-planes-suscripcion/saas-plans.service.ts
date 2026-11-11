import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import pkg from 'pg';
const { Client } = pkg;
import { CreateSaasPlanDto, UpdateSaasPlanDto } from './saas-plans.dto.js';
import { BitacoraService } from '../../../users-security/shared/services/bitacora.service.js';

export interface SaasPlanItem {
  id: number;
  codigo: string;
  nombre: string;
  tipo_plan: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual: number;
  moneda: string;
  duracion_prueba_dias: number;
  requiere_pago: boolean;
  limite_usuarios: number;
  limite_sucursales: number;
  limite_almacenes: number;
  limite_productos: number;
  permite_offline: boolean;
  permite_ia_reportes: boolean;
  permite_ml_analytics: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
  activo: boolean;
}

@Injectable()
export class SaasPlansService {
  private readonly logger = new Logger(SaasPlansService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly plansFile = path.resolve(this.dataDir, 'saas_plans.json');

  private defaultPlans: SaasPlanItem[] = [
    {
      id: 1,
      codigo: 'PRUEBA',
      nombre: 'Plan de Prueba',
      tipo_plan: 'PRUEBA',
      descripcion: 'Acceso gratuito durante 7 días para evaluar el sistema.',
      precio_mensual: 0.0,
      precio_anual: 0.0,
      moneda: 'USD',
      duracion_prueba_dias: 7,
      requiere_pago: false,
      limite_usuarios: 3,
      limite_sucursales: 1,
      limite_almacenes: 1,
      limite_productos: 100,
      permite_offline: true,
      permite_ia_reportes: false,
      permite_ml_analytics: false,
      fecha_creacion: new Date().toISOString(),
      fecha_modificacion: new Date().toISOString(),
      activo: true,
    },
    {
      id: 2,
      codigo: 'BASICO',
      nombre: 'Plan Básico',
      tipo_plan: 'BASICO',
      descripcion: 'Funciones estándar para pequeños negocios de una sola tienda.',
      precio_mensual: 29.9,
      precio_anual: 299.0,
      moneda: 'USD',
      duracion_prueba_dias: 0,
      requiere_pago: true,
      limite_usuarios: 10,
      limite_sucursales: 1,
      limite_almacenes: 1,
      limite_productos: 1000,
      permite_offline: true,
      permite_ia_reportes: false,
      permite_ml_analytics: false,
      fecha_creacion: new Date().toISOString(),
      fecha_modificacion: new Date().toISOString(),
      activo: true,
    },
    {
      id: 3,
      codigo: 'PREMIUM',
      nombre: 'Plan Premium',
      tipo_plan: 'PREMIUM',
      descripcion: 'Gestión multi-sucursal y reportes inteligentes.',
      precio_mensual: 69.9,
      precio_anual: 699.0,
      moneda: 'USD',
      duracion_prueba_dias: 0,
      requiere_pago: true,
      limite_usuarios: 30,
      limite_sucursales: 3,
      limite_almacenes: 5,
      limite_productos: 5000,
      permite_offline: true,
      permite_ia_reportes: true,
      permite_ml_analytics: false,
      fecha_creacion: new Date().toISOString(),
      fecha_modificacion: new Date().toISOString(),
      activo: true,
    },
    {
      id: 4,
      codigo: 'CORPORATIVO',
      nombre: 'Plan Corporativo',
      tipo_plan: 'CORPORATIVO',
      descripcion: 'Organizaciones medianas con IA de reportes y BI con Machine Learning.',
      precio_mensual: 149.9,
      precio_anual: 1499.0,
      moneda: 'USD',
      duracion_prueba_dias: 0,
      requiere_pago: true,
      limite_usuarios: 100,
      limite_sucursales: 10,
      limite_almacenes: 20,
      limite_productos: 20000,
      permite_offline: true,
      permite_ia_reportes: true,
      permite_ml_analytics: true,
      fecha_creacion: new Date().toISOString(),
      fecha_modificacion: new Date().toISOString(),
      activo: true,
    },
    {
      id: 5,
      codigo: 'EMPRESARIAL',
      nombre: 'Plan Empresarial',
      tipo_plan: 'EMPRESARIAL',
      descripcion: 'Solución completa sin límites, soporte prioritario y aislamiento total.',
      precio_mensual: 299.9,
      precio_anual: 2999.0,
      moneda: 'USD',
      duracion_prueba_dias: 0,
      requiere_pago: true,
      limite_usuarios: 500,
      limite_sucursales: 50,
      limite_almacenes: 100,
      limite_productos: 100000,
      permite_offline: true,
      permite_ia_reportes: true,
      permite_ml_analytics: true,
      fecha_creacion: new Date().toISOString(),
      fecha_modificacion: new Date().toISOString(),
      activo: true,
    },
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly bitacoraService: BitacoraService,
  ) {
    this.ensureStorage();
  }

  private ensureStorage(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!fs.existsSync(this.plansFile)) {
        fs.writeFileSync(this.plansFile, JSON.stringify(this.defaultPlans, null, 2), 'utf8');
      }
    } catch (e: any) {
      this.logger.warn(`Error inicializando planes storage: ${e.message}`);
    }
  }

  private getSaasClient(): any {
    const rawUrl = this.configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
    if (!rawUrl) return null;
    const urlObj = new URL(rawUrl);
    const saasDbUrl = `${urlObj.protocol}//${urlObj.username}:${encodeURIComponent(urlObj.password)}@${urlObj.host}/SaaS?sslmode=require`;
    return new Client({ connectionString: saasDbUrl });
  }

  private loadLocalPlans(): SaasPlanItem[] {
    try {
      if (fs.existsSync(this.plansFile)) {
        return JSON.parse(fs.readFileSync(this.plansFile, 'utf8'));
      }
    } catch (e: any) {
      this.logger.warn(`Error leyendo archivo local de planes: ${e.message}`);
    }
    return this.defaultPlans;
  }

  private saveLocalPlans(plans: SaasPlanItem[]): void {
    try {
      fs.writeFileSync(this.plansFile, JSON.stringify(plans, null, 2), 'utf8');
    } catch (e: any) {
      this.logger.warn(`Error guardando archivo local de planes: ${e.message}`);
    }
  }

  /**
   * CU02 - Listar todos los planes de suscripción
   */
  async findAll(): Promise<SaasPlanItem[]> {
    const client = this.getSaasClient();
    if (client) {
      try {
        await client.connect();
        const res = await client.query(
          'SELECT * FROM planes_suscripcion ORDER BY id ASC',
        );
        if (res.rows && res.rows.length > 0) {
          const mapped: SaasPlanItem[] = res.rows.map((r: any) => ({
            id: r.id,
            codigo: r.codigo,
            nombre: r.nombre,
            tipo_plan: r.tipo_plan,
            descripcion: r.descripcion,
            precio_mensual: Number(r.precio_mensual),
            precio_anual: Number(r.precio_anual),
            moneda: r.moneda,
            duracion_prueba_dias: r.duracion_prueba_dias,
            requiere_pago: r.requiere_pago,
            limite_usuarios: r.limite_usuarios,
            limite_sucursales: r.limite_sucursales,
            limite_almacenes: r.limite_almacenes,
            limite_productos: r.limite_productos,
            permite_offline: r.permite_offline,
            permite_ia_reportes: r.permite_ia_reportes,
            permite_ml_analytics: r.permite_ml_analytics,
            fecha_creacion: r.fecha_creacion ? new Date(r.fecha_creacion).toISOString() : new Date().toISOString(),
            fecha_modificacion: r.fecha_modificacion ? new Date(r.fecha_modificacion).toISOString() : new Date().toISOString(),
            activo: r.activo !== false,
          }));
          this.saveLocalPlans(mapped);
          return mapped;
        }
      } catch (err: any) {
        this.logger.warn(`Error consultando PostgreSQL SaaS: ${err.message}. Usando local.`);
      } finally {
        try {
          await client.end();
        } catch {}
      }
    }
    return this.loadLocalPlans();
  }

  /**
   * CU02 - Consultar plan por ID
   */
  async findById(id: number): Promise<SaasPlanItem> {
    const plans = await this.findAll();
    const plan = plans.find((p) => p.id === id);
    if (!plan) {
      throw new NotFoundException(`Plan de suscripción #${id} no encontrado`);
    }
    return plan;
  }

  /**
   * CU02 - Crear nuevo plan de suscripción
   */
  async create(dto: CreateSaasPlanDto, user?: any, ip?: string): Promise<SaasPlanItem> {
    const plans = await this.findAll();
    const normalizedCode = dto.codigo.trim().toUpperCase();

    if (plans.some((p) => p.codigo.toUpperCase() === normalizedCode)) {
      throw new BadRequestException(`El código de plan "${normalizedCode}" ya se encuentra registrado.`);
    }

    const client = this.getSaasClient();
    let createdItem: SaasPlanItem | null = null;

    if (client) {
      try {
        await client.connect();
        const insertQuery = `
          INSERT INTO planes_suscripcion (
            codigo, nombre, tipo_plan, descripcion, precio_mensual, precio_anual,
            moneda, duracion_prueba_dias, requiere_pago, limite_usuarios,
            limite_sucursales, limite_almacenes, limite_productos, permite_offline,
            permite_ia_reportes, permite_ml_analytics, fecha_creacion, fecha_modificacion, activo
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW(), $17
          ) RETURNING *;
        `;
        const values = [
          normalizedCode,
          dto.nombre,
          dto.tipo_plan || 'PERSONALIZADO',
          dto.descripcion,
          dto.precio_mensual,
          dto.precio_anual,
          dto.moneda || 'USD',
          dto.duracion_prueba_dias || 0,
          dto.requiere_pago !== false,
          dto.limite_usuarios || 10,
          dto.limite_sucursales || 1,
          dto.limite_almacenes || 1,
          dto.limite_productos || 1000,
          dto.permite_offline !== false,
          dto.permite_ia_reportes || false,
          dto.permite_ml_analytics || false,
          dto.activo !== false,
        ];

        const res = await client.query(insertQuery, values);
        if (res.rows && res.rows.length > 0) {
          const r = res.rows[0];
          createdItem = {
            id: r.id,
            codigo: r.codigo,
            nombre: r.nombre,
            tipo_plan: r.tipo_plan,
            descripcion: r.descripcion,
            precio_mensual: Number(r.precio_mensual),
            precio_anual: Number(r.precio_anual),
            moneda: r.moneda,
            duracion_prueba_dias: r.duracion_prueba_dias,
            requiere_pago: r.requiere_pago,
            limite_usuarios: r.limite_usuarios,
            limite_sucursales: r.limite_sucursales,
            limite_almacenes: r.limite_almacenes,
            limite_productos: r.limite_productos,
            permite_offline: r.permite_offline,
            permite_ia_reportes: r.permite_ia_reportes,
            permite_ml_analytics: r.permite_ml_analytics,
            fecha_creacion: new Date(r.fecha_creacion).toISOString(),
            fecha_modificacion: new Date(r.fecha_modificacion).toISOString(),
            activo: r.activo,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Error insertando en PostgreSQL: ${err.message}. Guardando localmente.`);
      } finally {
        try {
          await client.end();
        } catch {}
      }
    }

    if (!createdItem) {
      const nextId = Math.max(...plans.map((p) => p.id), 0) + 1;
      createdItem = {
        id: nextId,
        codigo: normalizedCode,
        nombre: dto.nombre,
        tipo_plan: dto.tipo_plan || 'PERSONALIZADO',
        descripcion: dto.descripcion,
        precio_mensual: dto.precio_mensual,
        precio_anual: dto.precio_anual,
        moneda: dto.moneda || 'USD',
        duracion_prueba_dias: dto.duracion_prueba_dias || 0,
        requiere_pago: dto.requiere_pago !== false,
        limite_usuarios: dto.limite_usuarios || 10,
        limite_sucursales: dto.limite_sucursales || 1,
        limite_almacenes: dto.limite_almacenes || 1,
        limite_productos: dto.limite_productos || 1000,
        permite_offline: dto.permite_offline !== false,
        permite_ia_reportes: dto.permite_ia_reportes || false,
        permite_ml_analytics: dto.permite_ml_analytics || false,
        fecha_creacion: new Date().toISOString(),
        fecha_modificacion: new Date().toISOString(),
        activo: dto.activo !== false,
      };
      plans.push(createdItem);
      this.saveLocalPlans(plans);
    }

    // Auditoría
    await this.bitacoraService.logAction(
      'Creación de Plan de Suscripción (CU02)',
      `Nuevo plan creado: ${createdItem.nombre} (${createdItem.codigo}) con precio mensual $${createdItem.precio_mensual}`,
      user?.id || 1,
      ip || '127.0.0.1',
    );

    return createdItem;
  }

  /**
   * CU02 - Actualizar plan de suscripción existente
   */
  async update(id: number, dto: UpdateSaasPlanDto, user?: any, ip?: string): Promise<SaasPlanItem> {
    const plans = await this.findAll();
    const index = plans.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Plan #${id} no encontrado`);
    }

    const client = this.getSaasClient();
    let updatedItem: SaasPlanItem | null = null;

    if (client) {
      try {
        await client.connect();
        const updateQuery = `
          UPDATE planes_suscripcion SET
            nombre = COALESCE($1, nombre),
            tipo_plan = COALESCE($2, tipo_plan),
            descripcion = COALESCE($3, descripcion),
            precio_mensual = COALESCE($4, precio_mensual),
            precio_anual = COALESCE($5, precio_anual),
            moneda = COALESCE($6, moneda),
            duracion_prueba_dias = COALESCE($7, duracion_prueba_dias),
            requiere_pago = COALESCE($8, requiere_pago),
            limite_usuarios = COALESCE($9, limite_usuarios),
            limite_sucursales = COALESCE($10, limite_sucursales),
            limite_almacenes = COALESCE($11, limite_almacenes),
            limite_productos = COALESCE($12, limite_productos),
            permite_offline = COALESCE($13, permite_offline),
            permite_ia_reportes = COALESCE($14, permite_ia_reportes),
            permite_ml_analytics = COALESCE($15, permite_ml_analytics),
            activo = COALESCE($16, activo),
            fecha_modificacion = NOW()
          WHERE id = $17
          RETURNING *;
        `;
        const values = [
          dto.nombre ?? null,
          dto.tipo_plan ?? null,
          dto.descripcion ?? null,
          dto.precio_mensual ?? null,
          dto.precio_anual ?? null,
          dto.moneda ?? null,
          dto.duracion_prueba_dias ?? null,
          dto.requiere_pago ?? null,
          dto.limite_usuarios ?? null,
          dto.limite_sucursales ?? null,
          dto.limite_almacenes ?? null,
          dto.limite_productos ?? null,
          dto.permite_offline ?? null,
          dto.permite_ia_reportes ?? null,
          dto.permite_ml_analytics ?? null,
          dto.activo ?? null,
          id,
        ];

        const res = await client.query(updateQuery, values);
        if (res.rows && res.rows.length > 0) {
          const r = res.rows[0];
          updatedItem = {
            id: r.id,
            codigo: r.codigo,
            nombre: r.nombre,
            tipo_plan: r.tipo_plan,
            descripcion: r.descripcion,
            precio_mensual: Number(r.precio_mensual),
            precio_anual: Number(r.precio_anual),
            moneda: r.moneda,
            duracion_prueba_dias: r.duracion_prueba_dias,
            requiere_pago: r.requiere_pago,
            limite_usuarios: r.limite_usuarios,
            limite_sucursales: r.limite_sucursales,
            limite_almacenes: r.limite_almacenes,
            limite_productos: r.limite_productos,
            permite_offline: r.permite_offline,
            permite_ia_reportes: r.permite_ia_reportes,
            permite_ml_analytics: r.permite_ml_analytics,
            fecha_creacion: new Date(r.fecha_creacion).toISOString(),
            fecha_modificacion: new Date(r.fecha_modificacion).toISOString(),
            activo: r.activo,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Error actualizando plan en PostgreSQL: ${err.message}`);
      } finally {
        try {
          await client.end();
        } catch {}
      }
    }

    if (!updatedItem) {
      const existing = plans[index];
      updatedItem = {
        ...existing,
        ...dto,
        fecha_modificacion: new Date().toISOString(),
      };
      plans[index] = updatedItem;
      this.saveLocalPlans(plans);
    }

    // Auditoría
    await this.bitacoraService.logAction(
      'Actualización de Plan de Suscripción (CU02)',
      `Plan actualizado: ${updatedItem.nombre} (#${id}). Precio mensual: $${updatedItem.precio_mensual}, Activo: ${updatedItem.activo}`,
      user?.id || 1,
      ip || '127.0.0.1',
    );

    return updatedItem;
  }

  /**
   * CU02 - Desactivar o eliminar plan de suscripción
   */
  async delete(id: number, user?: any, ip?: string): Promise<{ success: boolean; message: string }> {
    const plans = await this.findAll();
    const plan = plans.find((p) => p.id === id);
    if (!plan) {
      throw new NotFoundException(`Plan #${id} no encontrado`);
    }

    const client = this.getSaasClient();
    if (client) {
      try {
        await client.connect();
        // Verificar si existen suscripciones activas vinculadas
        const checkSubs = await client.query(
          "SELECT COUNT(*) as count FROM suscripcion WHERE plan_id = $1 AND estado = 'ACTIVO'",
          [id],
        );
        const activeSubs = parseInt(checkSubs.rows[0]?.count || '0', 10);
        if (activeSubs > 0) {
          // Desactivar en lugar de borrar físicamente para mantener integridad referencial
          await client.query('UPDATE planes_suscripcion SET activo = FALSE, fecha_modificacion = NOW() WHERE id = $1', [id]);
          await this.bitacoraService.logAction(
            'Desactivación de Plan de Suscripción (CU02)',
            `Plan #${id} (${plan.nombre}) archivado/desactivado por tener ${activeSubs} inquilinos activos vinculados.`,
            user?.id || 1,
            ip || '127.0.0.1',
          );
          return {
            success: true,
            message: `El plan tiene ${activeSubs} empresa(s) con suscripción activa. Ha sido archivado/desactivado para nuevas contrataciones sin afectar a los inquilinos actuales.`,
          };
        }

        // Si no tiene inquilinos activos, eliminar registro
        await client.query('DELETE FROM planes_suscripcion WHERE id = $1', [id]);
      } catch (err: any) {
        this.logger.warn(`Error eliminando plan en PostgreSQL: ${err.message}`);
      } finally {
        try {
          await client.end();
        } catch {}
      }
    }

    const updatedList = plans.filter((p) => p.id !== id);
    this.saveLocalPlans(updatedList);

    await this.bitacoraService.logAction(
      'Eliminación de Plan de Suscripción (CU02)',
      `Plan #${id} (${plan.nombre}) eliminado del catálogo comercial.`,
      user?.id || 1,
      ip || '127.0.0.1',
    );

    return {
      success: true,
      message: `El plan "${plan.nombre}" ha sido eliminado exitosamente.`,
    };
  }
}

