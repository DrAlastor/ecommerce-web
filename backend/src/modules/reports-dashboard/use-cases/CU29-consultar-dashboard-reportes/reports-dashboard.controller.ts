/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Control (API REST) — Backend
 * @responsabilidad Recibe la solicitud HTTP, aplica guardas o validaciones y delega la lógica al servicio del caso de uso.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import {
  ExportFormat,
  QueryDashboardDto,
  QueryReportDto,
} from '../../dto/query-reports.dto.js';
import { ReportExporterService } from '../../shared/services/report-exporter.service.js';
import { ReportsDashboardService } from './reports-dashboard.service.js';

@Controller('reports')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class ReportsDashboardController {
  constructor(
    private readonly reportsService: ReportsDashboardService,
    private readonly exporterService: ReportExporterService,
  ) {}

  /**
   * Obtiene las sucursales a las que tiene acceso el usuario en sesión
   */
  @Get('branches')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async getAuthorizedBranches(@Req() req: any) {
    const auth = await this.reportsService.getAuthorizedBranches(req.user);
    return {
      isAdmin: auth.isAdmin,
      isGlobal: auth.isGlobal,
      branches: auth.branches,
    };
  }

  /**
   * Obtiene el catálogo de categorías para filtros de reporte
   */
  @Get('categories')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async getCategories() {
    return this.reportsService.getCategories();
  }

  /**
   * CU27 — Dashboard General: Indicadores consolidados, gráficos y alertas
   */
  @Get('dashboard')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async getDashboard(@Req() req: any, @Query() query: QueryDashboardDto) {
    return this.reportsService.getDashboardMetrics(query, req.user);
  }

  /**
   * CU27 — Previsualizar Reporte Seleccionado
   * Devuelve la estructura unificada (indicadores, gráficos y tabla de datos)
   */
  @Get('generate')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async generateReport(@Req() req: any, @Query() query: QueryReportDto) {
    return this.reportsService.generateReport(query, req.user);
  }

  /**
   * CU27 — Exportar Reporte en CSV, Excel (.xlsx) o PDF
   * Aplica exactamente los mismos filtros y lógica de cálculo que la previsualización en pantalla
   */
  @Get('export')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async exportReport(
    @Req() req: any,
    @Res() res: Response,
    @Query() query: QueryReportDto,
  ) {
    const reportData = await this.reportsService.generateReport(query, req.user);
    const formato = query.formato || ExportFormat.EXCEL;
    const cleanDate = new Date().toISOString().split('T')[0];
    const fileBaseName = `${query.tipo_reporte}_${cleanDate}`;

    if (formato === ExportFormat.CSV) {
      const buffer = await this.exporterService.exportToCsv(reportData);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileBaseName}.csv"`,
      );
      return res.send(buffer);
    }

    if (formato === ExportFormat.PDF) {
      const buffer = await this.exporterService.exportToPdf(reportData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileBaseName}.pdf"`,
      );
      return res.send(buffer);
    }

    // Por defecto: EXCEL (.xlsx)
    const buffer = await this.exporterService.exportToExcel(reportData);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileBaseName}.xlsx"`,
    );
    return res.send(buffer);
  }
}
