import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SaasMonitoringService } from './saas-monitoring.service.js';
import {
  ClusterMonitoringOverview,
  OperationalResult,
  UpdateTenantQuotaDto,
} from '../../dto/saas-monitoring.dto.js';
import { SaasSuperAdminGuard } from '../../guards/saas-superadmin.guard.js';

@Controller('saas/monitoring')
@UseGuards(SaasSuperAdminGuard)
export class SaasMonitoringController {
  constructor(private readonly monitoringService: SaasMonitoringService) {}

  /**
   * CU05 - Panorama global de telemetría y salud de tenants.
   */
  @Get('overview')
  async getOverview(): Promise<ClusterMonitoringOverview> {
    return this.monitoringService.getClusterMonitoringOverview();
  }

  /**
   * CU05 - Prueba de conectividad (Ping) a base de datos de un tenant.
   */
  @Post(':tenant/ping')
  async pingTenant(
    @Param('tenant') tenant: string,
    @Req() req: any,
  ): Promise<OperationalResult> {
    const userId = req.user?.id_usuario || 1;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.monitoringService.pingTenant(tenant, userId, ip);
  }

  /**
   * CU05 - Reinicio y reciclaje de pool de conexiones Prisma de un tenant.
   */
  @Post(':tenant/reset-pool')
  async resetPool(
    @Param('tenant') tenant: string,
    @Req() req: any,
  ): Promise<OperationalResult> {
    const userId = req.user?.id_usuario || 1;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.monitoringService.resetTenantConnectionPool(tenant, userId, ip);
  }

  /**
   * CU05 - Purga de caché y buffers de memoria para un tenant.
   */
  @Post(':tenant/purge-cache')
  async purgeCache(
    @Param('tenant') tenant: string,
    @Req() req: any,
  ): Promise<OperationalResult> {
    const userId = req.user?.id_usuario || 1;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.monitoringService.purgeTenantCache(tenant, userId, ip);
  }

  /**
   * CU05 - Suspensión o reactivación preventiva de un tenant (aislamiento Noisy Neighbor / mora).
   */
  @Post(':tenant/toggle-status')
  async toggleStatus(
    @Param('tenant') tenant: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ): Promise<OperationalResult> {
    const userId = req.user?.id_usuario || 1;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.monitoringService.toggleTenantStatus(tenant, reason, userId, ip);
  }

  /**
   * CU05 - Ajuste de cuota de recursos (Almacenamiento y Conexiones máximas).
   */
  @Post(':tenant/update-quota')
  async updateQuota(
    @Param('tenant') tenant: string,
    @Body() dto: UpdateTenantQuotaDto,
    @Req() req: any,
  ): Promise<OperationalResult> {
    const userId = req.user?.id_usuario || 1;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.monitoringService.updateTenantQuota(tenant, dto, userId, ip);
  }
}

