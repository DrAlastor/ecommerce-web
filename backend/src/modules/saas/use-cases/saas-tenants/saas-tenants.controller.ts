import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { SaasTenantsService } from './saas-tenants.service.js';
import { EnrichedTenantDetails, UpdateTenantAdminDto } from './saas-tenants.dto.js';
import { SaasSuperAdminGuard } from '../../guards/saas-superadmin.guard.js';

@Controller('saas/tenants')
@UseGuards(SaasSuperAdminGuard)
export class SaasTenantsController {
  constructor(private readonly tenantsService: SaasTenantsService) {}

  @Get()
  async getAllTenants(): Promise<EnrichedTenantDetails[]> {
    return this.tenantsService.getAllTenants();
  }

  @Put(':tenantKey')
  async updateTenant(
    @Param('tenantKey') tenantKey: string,
    @Body() dto: UpdateTenantAdminDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 1;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.tenantsService.updateTenant(tenantKey, dto, userId, ip);
  }
}

