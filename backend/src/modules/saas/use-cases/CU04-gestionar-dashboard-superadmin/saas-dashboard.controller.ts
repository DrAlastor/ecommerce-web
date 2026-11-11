import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SaasDashboardService } from './saas-dashboard.service.js';
import { SaasDashboardFilterDto, SaasDashboardMetricsResponse } from '../../dto/saas-dashboard.dto.js';
import { SaasSuperAdminGuard } from '../../guards/saas-superadmin.guard.js';

@Controller('saas/dashboard')
@UseGuards(SaasSuperAdminGuard)
export class SaasDashboardController {
  constructor(private readonly dashboardService: SaasDashboardService) {}

  /**
   * CU04 - Gestionar Dashboard de Super Admin
   * Retorna métricas consolidadas, KPIs ejecutivos estilo Power BI,
   * modelos predictivos de Machine Learning y segmentación por clusters de inquilinos.
   */
  @Get('metrics')
  async getDashboardMetrics(
    @Query() filters: SaasDashboardFilterDto,
  ): Promise<SaasDashboardMetricsResponse> {
    return this.dashboardService.getSuperAdminDashboard(filters);
  }
}

