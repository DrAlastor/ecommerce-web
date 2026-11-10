/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Control (API REST) — Backend
 * @responsabilidad Recibe la solicitud HTTP, aplica guardas o validaciones y delega la lógica al servicio del caso de uso.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { spawn } from 'child_process';
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
import { QbeService } from '../CU32-gestionar-reportes-qbe/qbe.service.js';
import {
  ExecuteQbeQueryDto,
  ExportQbeQueryDto,
  InterpretNaturalQueryDto,
} from '../CU32-gestionar-reportes-qbe/qbe.dto.js';
import { ReportsAiService } from '../CU33-gestionar-reportes-ia/reports-ai.service.js';
import {
  AiChatQueryDto,
  GenerateReportAiAnalysisDto,
} from '../CU33-gestionar-reportes-ia/reports-ai.dto.js';

@Controller('reports')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class ReportsDashboardController {
  private readonly logger = new Logger(ReportsDashboardController.name);

  constructor(
    private readonly reportsService: ReportsDashboardService,
    private readonly exporterService: ReportExporterService,
    private readonly qbeService: QbeService,
    private readonly reportsAiService: ReportsAiService,
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

  /**
   * CU32 — Obtener Metadatos para el Constructor Visual QBE
   */
  @Get('qbe/metadata')
  @FunctionRequired('Gestionar reportes qbe', 'Lectura')
  async getQbeMetadata() {
    return this.qbeService.getMetadata();
  }

  /**
   * CU32 — Ejecutar Consulta Dinámica QBE
   */
  @Post('qbe/execute')
  @FunctionRequired('Gestionar reportes qbe', 'Lectura')
  async executeQbeQuery(@Req() req: any, @Body() dto: ExecuteQbeQueryDto) {
    return this.qbeService.executeQuery(dto, req.user);
  }

  /**
   * CU32 — Exportar Consulta Dinámica QBE a PDF, CSV o Excel
   */
  @Post('qbe/export')
  @FunctionRequired('Gestionar reportes qbe', 'Lectura')
  async exportQbeQuery(
    @Req() req: any,
    @Res() res: Response,
    @Body() dto: ExportQbeQueryDto,
  ) {
    const result = await this.qbeService.exportQuery(dto, req.user);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`,
    );
    return res.send(result.buffer);
  }

  /**
   * CU32 & CU33 — Interpretar Consulta en Lenguaje Natural a Estructura QBE con IA
   */
  @Post('qbe/interpret')
  @FunctionRequired('Gestionar reportes qbe', 'Lectura')
  async interpretQbeQuery(@Body() dto: InterpretNaturalQueryDto) {
    return this.reportsAiService.interpretNaturalQuery(dto.prompt);
  }

  /**
   * CU33 — Generar Diagnóstico e Insights Ejecutivos con IA (Gemini)
   */
  @Post('ai/analyze')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async generateAiReportAnalysis(@Body() dto: GenerateReportAiAnalysisDto) {
    return this.reportsAiService.generateReportAnalysis(dto);
  }

  /**
   * CU33 — Asistente Conversacional / Chat de Reportes con IA (Voz y Texto)
   */
  @Post('ai/chat')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async processAiChat(@Req() req: any, @Body() dto: AiChatQueryDto) {
    return this.reportsAiService.processChat(dto, req.user);
  }

  /**
   * CU33 — Síntesis de Voz (TTS) como respaldo universal para navegadores sin motor local
   */
  @Post('ai/tts')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async synthesizeVoice(
    @Body('text') text: string,
    @Res() res: Response,
  ) {
    const cleanText = (text || '')
      .replace(/[*_#`]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/--+/g, '')
      .trim()
      .slice(0, 1500);

    if (!cleanText) {
      return res.status(400).send('Texto vacío');
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-cache');

    const child = spawn('espeak-ng', ['-v', 'es', '-s', '150', '--stdout', cleanText]);

    child.stdout.pipe(res);

    child.on('error', (err) => {
      this.logger.error('Error al invocar espeak-ng para TTS:', err);
      if (!res.headersSent) {
        res.status(500).send('Error en síntesis de voz');
      }
    });
  }
}
