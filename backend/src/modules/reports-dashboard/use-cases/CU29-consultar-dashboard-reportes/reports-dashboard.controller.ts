/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Control (API REST) — Backend
 * @responsabilidad Recibe la solicitud HTTP, aplica guardas o validaciones y delega la lógica al servicio del caso de uso.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import {
  Body,
  BadRequestException,
  ServiceUnavailableException,
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
import * as https from 'https';
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
import { NeuralAnalyticsService } from './neural-analytics.service.js';

@Controller('reports')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class ReportsDashboardController {
  private readonly logger = new Logger(ReportsDashboardController.name);

  @Post('ai/transcribe')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async transcribe(@Body() body: { audio: string; mimeType: string }) {
    const endpoint = process.env.REPORTS_STT_URL;
    if (!endpoint) throw new ServiceUnavailableException('El servidor de transcripción no está configurado. Configura REPORTS_STT_URL con un servicio Whisper compatible.');
    if (typeof body.audio !== 'string' || body.audio.length > 8000000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.audio)) throw new BadRequestException('Audio inválido o demasiado grande. Máximo 6 MB.');
    const formats: Record<string,string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'audio/wav': 'wav' };
    const mime = (body.mimeType || '').split(';')[0];
    if (!formats[mime]) throw new BadRequestException('Formato de audio no admitido.');
    const data = new FormData();
    data.append('file', new Blob([new Uint8Array(Buffer.from(body.audio, 'base64'))], {type: mime}), 'consulta.' + formats[mime]);
    data.append('model', process.env.REPORTS_STT_MODEL || 'whisper-1');
    data.append('language', 'es');
    try {
      const result = await fetch(endpoint, {method: 'POST', body: data, signal: AbortSignal.timeout(60000)});
      if (!result.ok) throw new Error('STT HTTP ' + result.status);
      const json = await result.json() as {text?: string};
      if (!json.text?.trim()) throw new Error('Sin transcripción');
      return {text: json.text.trim()};
    } catch {
      throw new ServiceUnavailableException('No se pudo transcribir el audio. Comprueba que el servicio Whisper esté iniciado y admita este formato de audio.');
    }
  }

  constructor(
    private readonly reportsService: ReportsDashboardService,
    private readonly exporterService: ReportExporterService,
    private readonly qbeService: QbeService,
    private readonly reportsAiService: ReportsAiService,
    private readonly neuralAnalyticsService: NeuralAnalyticsService,
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
   * CU33 — Síntesis de Voz (TTS) con voz natural, cálida y femenina en español
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
      .replace(/Bs\./gi, 'Bolivianos')
      .replace(/USD/gi, 'dólares')
      .replace(/\$/g, 'dólares ')
      .trim()
      .slice(0, 1500);

    if (!cleanText) {
      return res.status(400).send('Texto vacío');
    }

    try {
      // 1. Intentar síntesis neural natural femenina (voz cálida y amigable)
      const chunks = this.splitTextIntoTtsChunks(cleanText, 175);
      const audioBuffers: Buffer[] = [];

      for (const chunk of chunks) {
        const audioBuffer = await this.fetchNaturalFemaleTts(chunk);
        if (audioBuffer && audioBuffer.length > 0) {
          audioBuffers.push(audioBuffer);
        }
      }

      if (audioBuffers.length > 0) {
        const combined = Buffer.concat(audioBuffers);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache');
        return res.send(combined);
      }
    } catch (err) {
      this.logger.warn('Fallo en Google TTS natural, recurriendo a motor local femenino:', err);
    }

    // 2. Fallback local con espeak-ng configurado en variante femenina y tono cálido (+f3)
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-cache');
    const child = spawn('espeak-ng', ['-v', 'es+f3', '-s', '175', '-p', '65', '--stdout', cleanText]);
    child.stdout.pipe(res);
    child.on('error', (err) => {
      this.logger.error('Error al invocar espeak-ng para TTS:', err);
      if (!res.headersSent) {
        res.status(500).send('Error en síntesis de voz');
      }
    });
  }

  /**
   * Divide un texto en oraciones o fragmentos de longitud adecuada para TTS
   */
  private splitTextIntoTtsChunks(text: string, maxLen = 175): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const s of sentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      if ((current + ' ' + trimmed).trim().length <= maxLen) {
        current = (current + ' ' + trimmed).trim();
      } else {
        if (current) chunks.push(current);
        if (trimmed.length <= maxLen) {
          current = trimmed;
        } else {
          const words = trimmed.split(' ');
          current = '';
          for (const w of words) {
            if ((current + ' ' + w).trim().length <= maxLen) {
              current = (current + ' ' + w).trim();
            } else {
              if (current) chunks.push(current);
              current = w;
            }
          }
        }
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  /**
   * Obtiene un fragmento de audio en formato MP3 con voz femenina natural en español
   */
  private fetchNaturalFemaleTts(text: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-419&client=tw-ob&q=${encodeURIComponent(text)}`;
      const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 }, (res) => {
        if (res.statusCode !== 200) {
          return resolve(null);
        }
        const data: Buffer[] = [];
        res.on('data', (c) => data.push(c));
        res.on('end', () => resolve(Buffer.concat(data)));
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  /**
   * Modelo Supervisado: Predicción de Demanda con Red Neuronal Artificial y Matriz de Abastecimiento
   */
  @Get('ai/predictions')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async getAiDemandPredictions(@Query('branchId') branchId?: string) {
    const id = branchId ? parseInt(branchId, 10) : undefined;
    return this.neuralAnalyticsService.getDemandForecasting(id);
  }

  /**
   * Modelo No Supervisado: Segmentación de Clientes RFM con K-Means (k=4) y Detección de Abandono
   */
  @Get('ai/rfm-clusters')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async getAiRfmClusters() {
    return this.neuralAnalyticsService.getRfmCustomerSegmentation();
  }

  /**
   * Modelado Estocástico: Simulación de Monte Carlo (Poisson + Normal) para Escenarios de Decisión
   */
  @Get('ai/scenarios')
  @FunctionRequired('Consultar dashboard y reportes', 'Lectura')
  async getAiMonteCarloScenarios(
    @Query('horizonDays') horizonDays?: string,
    @Query('growthRatePercent') growthRatePercent?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.neuralAnalyticsService.getMonteCarloScenarios({
      horizonDays: horizonDays ? parseInt(horizonDays, 10) : undefined,
      growthRatePercent: growthRatePercent ? parseFloat(growthRatePercent) : undefined,
      branchId: branchId ? parseInt(branchId, 10) : undefined,
    });
  }
}
