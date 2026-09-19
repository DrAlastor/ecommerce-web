import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../users-security/auth/auth.module.js';
import { UsersSecurityModule } from '../users-security/users-security.module.js';
import { ReportExporterService } from './shared/services/report-exporter.service.js';
import { ReportsDashboardController } from './use-cases/CU27-consultar-dashboard-reportes/reports-dashboard.controller.js';
import { ReportsDashboardService } from './use-cases/CU27-consultar-dashboard-reportes/reports-dashboard.service.js';

@Module({
  imports: [PrismaModule, AuthModule, UsersSecurityModule],
  controllers: [ReportsDashboardController],
  providers: [ReportsDashboardService, ReportExporterService],
  exports: [ReportsDashboardService, ReportExporterService],
})
export class ReportsDashboardModule {}
