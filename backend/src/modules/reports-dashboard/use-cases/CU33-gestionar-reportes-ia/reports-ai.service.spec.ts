import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ReportsAiService } from './reports-ai.service.js';
import { QbeNlpService } from '../CU32-gestionar-reportes-qbe/qbe-nlp.service.js';

describe('CU33 - ReportsAiService (IA con Gemini y Fallback)', () => {
  let service: ReportsAiService;
  let configService: ConfigService;
  let nlpService: QbeNlpService;

  beforeEach(() => {
    configService = new ConfigService();
    nlpService = new QbeNlpService();
    service = new ReportsAiService(configService, nlpService);
  });

  it('debe generar un análisis de reporte estructurado correctamente', async () => {
    const analysis = await service.generateReportAnalysis({
      entity: 'venta',
      totalRows: 3,
      rows: [
        { id_venta: 1, total: 250, sucursal: 'Sucursal Central' },
        { id_venta: 2, total: 450, sucursal: 'Sucursal Norte' },
        { id_venta: 3, total: 300, sucursal: 'Sucursal Central' },
      ],
      userPrompt: 'Ventas de esta semana',
    });

    expect(analysis).toBeDefined();
    expect(analysis.executiveSummary).toBeTruthy();
    expect(Array.isArray(analysis.keyInsights)).toBe(true);
    expect(analysis.keyInsights.length).toBeGreaterThan(0);
    expect(Array.isArray(analysis.alerts)).toBe(true);
    expect(Array.isArray(analysis.recommendations)).toBe(true);
    expect(['gemini-3.5-flash', 'local-heuristic']).toContain(analysis.engine);
  });

  it('debe interpretar una consulta en lenguaje natural con fallback a QbeNlpService', async () => {
    const result = await service.interpretNaturalQuery('Ventas de vestidos por sucursal');
    expect(result).toBeDefined();
    expect(result.suggestedPayload).toBeDefined();
    expect(result.suggestedPayload.entity).toBeTruthy();
    expect(result.suggestedPayload.fields.length).toBeGreaterThan(0);
  });

  it('debe procesar una consulta de chat conversacional', async () => {
    const res = await service.processChat({
      message: 'Cuál es el estado de las existencias en almacén?',
    });

    expect(res).toBeDefined();
    expect(res.reply).toBeTruthy();
    expect(['gemini-3.5-flash', 'local-heuristic']).toContain(res.engine);
  });
});

