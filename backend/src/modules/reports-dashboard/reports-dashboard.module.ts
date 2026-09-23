/**
 * @modulo ReportsDashboardModule
 * @subsistema Reportes y Analítica
 * @capa Módulo de infraestructura y orquestación NestJS
 * @descripcion Módulo que consolida y exporta los indicadores clave de rendimiento (KPIs),
 *              métricas operativas del negocio y exportaciones en PDF/Excel:
 *              - CU27: Consultar Dashboard y Generar Reportes Operativos
 */
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
