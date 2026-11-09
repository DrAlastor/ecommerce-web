/**
 * @caso-de-uso CU33 — Gestionar Reportes por Voz y Lenguaje Natural con IA
 * @subsistema Inteligencia de Negocios y Reportes
 * @capa Lógica de Negocio y Servicio Externo LLM — Backend
 * @responsabilidad Proporciona interpretación de consultas en lenguaje natural,
 *                  generación de diagnósticos e insights ejecutivos y chat conversacional
 *                  utilizando Google Gemini con fallback local heurístico determinista.
 */

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QbeNlpService } from '../CU32-gestionar-reportes-qbe/qbe-nlp.service.js';
import { QbeService } from '../CU32-gestionar-reportes-qbe/qbe.service.js';
import {
  ExecuteQbeQueryDto,
  InterpretedQbeResponse,
} from '../CU32-gestionar-reportes-qbe/qbe.dto.js';
import {
  AiChatQueryDto,
  AiChatResponse,
  AiReportAnalysis,
  GenerateReportAiAnalysisDto,
} from './reports-ai.dto.js';

@Injectable()
export class ReportsAiService {
  private readonly logger = new Logger(ReportsAiService.name);
  private readonly geminiModel = 'gemini-3.5-flash';

  constructor(
    private readonly configService: ConfigService,
    private readonly nlpService: QbeNlpService,
    @Inject(forwardRef(() => QbeService))
    private readonly qbeService: QbeService,
  ) {}

  /**
   * Obtiene la clave de API de Gemini desde las variables de entorno
   */
  private getApiKey(): string | null {
    const key =
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY ||
      '';
    return key.trim() ? key.trim().replace(/^["']|["']$/g, '') : null;
  }

  /**
   * Realiza una llamada HTTP POST a la API de Google Gemini con timeout controlado
   */
  private async callGemini(prompt: string, timeoutMs = 8000): Promise<string | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`Gemini API returned status ${response.status}: ${await response.text()}`);
        return null;
      }

      const json: any = await response.json();
      const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
      return candidate || null;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.logger.warn(`Gemini API call timed out after ${timeoutMs}ms`);
      } else {
        this.logger.warn(`Error calling Gemini API: ${err.message}`);
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * CU33 — Interpreta una consulta en lenguaje natural (voz o texto)
   * Intenta primero mediante Google Gemini; si falla o no hay API key, recurre al motor heurístico local.
   */
  async interpretNaturalQuery(prompt: string): Promise<InterpretedQbeResponse> {
    const raw = (prompt || '').trim();
    if (!raw) {
      return this.nlpService.interpretPrompt('');
    }

    const apiKey = this.getApiKey();
    if (apiKey) {
      try {
        const geminiPrompt = `
Eres el motor de traducción a consultas analíticas estructuradas de Dressly Boutique (sistema de moda y retail).
El usuario escribe o dicta por voz la siguiente consulta: "${raw}".

Las entidades disponibles son:
- "venta": Campos: id_venta, codigo_factura, fecha_venta, total, subtotal, impuestos, tipo_venta, estado, sucursal, cliente, cajero.
- "producto": Campos: id_producto, nombre, sku, descripcion, precio_base, categoria, genero, estado.
- "inventario_sucursal": Campos: sucursal, producto, sku_variante, talla, color, stock_disponible, stock_minimo, estado_stock.
- "cliente": Campos: id_cliente, nombre, apellido, email, telefono, puntos_fidelidad, total_compras, ciudad, estado.
- "reserva": Campos: id_reserva, codigo_reserva, fecha_reserva, fecha_limite, estado, total_estimado, sucursal, cliente.
- "movimiento_inventario": Campos: id_movimiento, tipo_movimiento, cantidad, motivo, fecha, sucursal, producto.

Genera una respuesta en formato JSON EXACTO con la siguiente estructura (sin formato Markdown, sin comillas invertidas):
{
  "entity": "venta | producto | inventario_sucursal | cliente | reserva | movimiento_inventario",
  "fields": ["campo1", "campo2"],
  "filters": [
    { "field": "campo", "operator": "equals|contains|greater_than|less_than|between|in", "value": "valor" }
  ],
  "groupBy": ["campo_agrupador"],
  "aggregations": [
    { "field": "campo", "func": "sum|avg|count|min|max", "alias": "Total Vendido" }
  ],
  "orderBy": { "field": "campo", "direction": "asc|desc" },
  "limit": 50,
  "chartSuggestion": "bar|donut|line|area",
  "explanation": "Breve explicación en una sola frase de lo que se va a mostrar.",
  "detectedKeywords": {
    "entityFound": "nombre_entidad",
    "metricsFound": ["métrica"],
    "filtersFound": ["filtro"],
    "groupByFound": ["agrupación"]
  }
}
`;

        const responseText = await this.callGemini(geminiPrompt, 6000);
        if (responseText) {
          const cleanJson = responseText
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed && parsed.entity && Array.isArray(parsed.fields)) {
            const suggestedPayload: ExecuteQbeQueryDto = {
              entity: parsed.entity,
              fields: parsed.fields.length > 0 ? parsed.fields : ['id_venta', 'total'],
              filters: Array.isArray(parsed.filters) ? parsed.filters : [],
              groupBy: Array.isArray(parsed.groupBy) && parsed.groupBy.length > 0 ? parsed.groupBy : undefined,
              aggregations: Array.isArray(parsed.aggregations) && parsed.aggregations.length > 0 ? parsed.aggregations : undefined,
              orderBy: parsed.orderBy?.field ? parsed.orderBy : undefined,
              limit: Number(parsed.limit) || 100,
              chartType: parsed.chartSuggestion === 'pie' || parsed.chartSuggestion === 'donut' ? 'pie' : 'bar',
            };

            return {
              interpreted: true,
              suggestedPayload,
              explanation: parsed.explanation || 'Consulta interpretada exitosamente con Gemini.',
              detectedKeywords: {
                entityFound: parsed.detectedKeywords?.entityFound || parsed.entity,
                metricsFound: parsed.detectedKeywords?.metricsFound || [],
                filtersFound: parsed.detectedKeywords?.filtersFound || [],
                groupByFound: parsed.detectedKeywords?.groupByFound || [],
              },
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Fallback to local NLP engine: ${err.message}`);
      }
    }

    // Fallback garantizado: Motor local heurístico
    return this.nlpService.interpretPrompt(raw);
  }

  /**
   * CU33 — Genera un diagnóstico e insights ejecutivos con IA a partir de un conjunto de datos
   */
  async generateReportAnalysis(dto: GenerateReportAiAnalysisDto): Promise<AiReportAnalysis> {
    const { entity, rows, totalRows, userPrompt } = dto;
    const apiKey = this.getApiKey();

    if (apiKey && rows.length > 0) {
      try {
        const sampleRows = rows.slice(0, 15);
        const dataSampleString = JSON.stringify(sampleRows, null, 2);

        const geminiPrompt = `
Eres el Director de Inteligencia de Negocios y Analítica Ejecutiva de Dressly Boutique (cadena de moda retail).
Analiza los siguientes datos extraídos de la entidad "${entity}" (Total de registros: ${totalRows}).
${userPrompt ? `Consulta original del usuario: "${userPrompt}".` : ''}

Muestra de datos analíticos:
${dataSampleString}

Genera un diagnóstico ejecutivo profundo en formato JSON EXACTO (sin markdown, sin comillas invertidas):
{
  "executiveSummary": "Resumen ejecutivo directo de 2 frases con los hallazgos principales y volumen general.",
  "keyInsights": [
    "Insight 1 con cifras o porcentajes relevantes identificados",
    "Insight 2 sobre el comportamiento o distribución de categorías/sucursales",
    "Insight 3 sobre concentración de ingresos o existencias"
  ],
  "alerts": [
    "Alerta 1 sobre posibles riesgos de stockout, caídas de ventas o productos inactivos",
    "Alerta 2 sobre disparidad entre tiendas o desviaciones"
  ],
  "recommendations": [
    "Recomendación estratégica 1 orientada a compras o reabastecimiento",
    "Recomendación estratégica 2 orientada a promociones o ventas"
  ]
}
`;

        const responseText = await this.callGemini(geminiPrompt, 7000);
        if (responseText) {
          const cleanJson = responseText
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed && parsed.executiveSummary && Array.isArray(parsed.keyInsights)) {
            return {
              executiveSummary: parsed.executiveSummary,
              keyInsights: parsed.keyInsights,
              alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
              recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
              generatedAt: new Date().toISOString(),
              engine: 'gemini-3.5-flash',
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Error generating Gemini report analysis: ${err.message}`);
      }
    }

    // Fallback heurístico determinista local
    return this.generateLocalHeuristicAnalysis(dto);
  }

  /**
   * Fallback local: Computa métricas estadísticas y genera un diagnóstico sin fallar
   */
  private generateLocalHeuristicAnalysis(dto: GenerateReportAiAnalysisDto): AiReportAnalysis {
    const { entity, rows, totalRows, userPrompt } = dto;

    let totalAmount = 0;
    let numericFieldFound = '';

    // Buscar campos numéricos clave como total, precio_base, stock_disponible, cantidad
    const numericKeys = ['total', 'precio_base', 'stock_disponible', 'cantidad', 'subtotal'];
    for (const key of numericKeys) {
      if (rows.length > 0 && key in rows[0]) {
        numericFieldFound = key;
        totalAmount = rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
        break;
      }
    }

    const avgAmount = rows.length > 0 && numericFieldFound ? totalAmount / rows.length : 0;

    const keyInsights: string[] = [
      `Se procesaron ${totalRows} registros en la consulta analítica de ${entity}.`,
    ];

    if (numericFieldFound) {
      keyInsights.push(
        `El acumulado para "${numericFieldFound}" suma Bs. ${totalAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}, con un promedio de Bs. ${avgAmount.toFixed(2)} por registro.`,
      );
    }

    const alerts: string[] = [];
    const recommendations: string[] = [];

    if (entity === 'inventario_sucursal') {
      const lowStockCount = rows.filter((r) => Number(r.stock_disponible || 0) <= 5).length;
      if (lowStockCount > 0) {
        alerts.push(`Se detectaron ${lowStockCount} variantes con inventario crítico (menor o igual a 5 unidades).`);
        recommendations.push('Iniciar solicitud de traspaso entre sucursales o emitir orden de compra a proveedores.');
      } else {
        keyInsights.push('Todos los ítems evaluados se encuentran por encima del umbral de seguridad de stock.');
      }
    } else if (entity === 'venta') {
      recommendations.push('Monitorear el ticket promedio semanal y comparar la conversión entre canales presenciales y ecommerce.');
    } else {
      recommendations.push('Revisar la rotación periódica de estos indicadores en el Centro de Reportes.');
    }

    return {
      executiveSummary: `Diagnóstico analítico generado para ${totalRows} registros de ${entity}.${userPrompt ? ` Enfoque: "${userPrompt}".` : ''}`,
      keyInsights,
      alerts: alerts.length > 0 ? alerts : ['No se detectaron anomalías severas en el conjunto de datos analizado.'],
      recommendations,
      generatedAt: new Date().toISOString(),
      engine: 'local-heuristic',
    };
  }

  /**
   * Normaliza entidades, campos y operadores para que coincidan exactamente con el catálogo QBE
   */
  private normalizeQbePayload(rawPayload: any): ExecuteQbeQueryDto {
    const validEntities: Record<string, string> = {
      inventario: 'inventario_sucursal',
      stock: 'inventario_sucursal',
      existencias: 'inventario_sucursal',
      almacen: 'inventario_sucursal',
      inventario_sucursal: 'inventario_sucursal',
      ventas: 'venta',
      venta: 'venta',
      factura: 'venta',
      facturas: 'venta',
      productos: 'producto',
      producto: 'producto',
      prendas: 'producto',
      clientes: 'cliente',
      cliente: 'cliente',
      reservas: 'reserva',
      reserva: 'reserva',
      movimientos: 'movimiento_inventario',
      movimiento_inventario: 'movimiento_inventario',
      kardex: 'movimiento_inventario',
    };

    const entityNorm = String(rawPayload?.entity || 'venta').toLowerCase().trim();
    const entity = validEntities[entityNorm] || 'venta';

    const defaultFieldsMap: Record<string, string[]> = {
      venta: ['id_venta', 'codigo_factura', 'fecha_venta', 'total', 'sucursal', 'tipo_venta'],
      producto: ['id_producto', 'nombre', 'sku', 'precio_base', 'categoria', 'genero'],
      inventario_sucursal: ['sucursal', 'producto', 'sku_variante', 'talla', 'color', 'stock_disponible', 'stock_minimo'],
      cliente: ['id_cliente', 'nombre_completo', 'email', 'ci', 'puntos_fidelidad'],
      reserva: ['id_reserva', 'codigo', 'fecha_reserva', 'estado', 'sucursal', 'cliente'],
      movimiento_inventario: ['id_movimiento', 'tipo_movimiento', 'cantidad', 'motivo', 'fecha', 'sucursal'],
    };

    const validFields = defaultFieldsMap[entity] || defaultFieldsMap.venta;

    let fields = Array.isArray(rawPayload?.fields) ? rawPayload.fields : [];
    if (fields.length === 0) {
      fields = validFields.slice(0, 5);
    } else {
      fields = fields.map((f: string) => {
        const lf = String(f).toLowerCase().trim();
        if (entity === 'inventario_sucursal') {
          if (lf.includes('producto') || lf.includes('nombre') || lf.includes('prenda')) return 'producto';
          if (lf.includes('stock') || lf.includes('cantidad') || lf.includes('disponible')) return 'stock_disponible';
          if (lf.includes('tienda')) return 'sucursal';
        }
        if (entity === 'venta') {
          if (lf.includes('monto') || lf.includes('precio') || lf.includes('ingreso')) return 'total';
          if (lf.includes('fecha')) return 'fecha_venta';
        }
        return validFields.includes(lf) ? lf : validFields[0];
      });
      fields = Array.from(new Set(fields));
    }

    const opMap: Record<string, string> = {
      equals: 'eq',
      '=': 'eq',
      eq: 'eq',
      less_than: 'lt',
      '<': 'lt',
      lt: 'lt',
      greater_than: 'gt',
      '>': 'gt',
      gt: 'gt',
      gte: 'gte',
      '>=': 'gte',
      lte: 'lte',
      '<=': 'lte',
      contains: 'contains',
      contiene: 'contains',
      like: 'contains',
    };

    const filters = (Array.isArray(rawPayload?.filters) ? rawPayload.filters : []).map((f: any) => {
      let field = String(f.field || '').toLowerCase().trim();
      if (entity === 'inventario_sucursal' && (field.includes('stock') || field.includes('cantidad'))) {
        field = 'stock_disponible';
      }
      return {
        field: validFields.includes(field) ? field : validFields[0],
        operator: (opMap[String(f.operator).toLowerCase()] || 'eq') as any,
        value: f.value,
      };
    });

    return {
      entity,
      fields,
      filters,
      groupBy: Array.isArray(rawPayload?.groupBy) && rawPayload.groupBy.length > 0 ? rawPayload.groupBy : undefined,
      aggregations: Array.isArray(rawPayload?.aggregations) && rawPayload.aggregations.length > 0 ? rawPayload.aggregations : undefined,
      orderBy: rawPayload?.orderBy?.field ? rawPayload.orderBy : undefined,
      limit: Number(rawPayload?.limit) || 50,
      chartType: rawPayload?.chartSuggestion === 'pie' || rawPayload?.chartSuggestion === 'donut' ? 'pie' : 'bar',
    };
  }

  /**
   * CU33 — Chat Conversacional Analítico con IA
   */
  async processChat(dto: AiChatQueryDto, user?: any): Promise<AiChatResponse> {
    const { message, history } = dto;
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const historyContext = (history || [])
          .slice(-6)
          .map((h) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.content}`)
          .join('\n');

        const chatPrompt = `
Eres "Dressly AI Analytics", el asistente inteligente y consultor de negocios de la cadena Dressly Boutique.
Tu función es responder preguntas ejecutivas sobre ventas, inventario, clientes, pedidos y rendimiento de sucursales.
Mantén un tono ejecutivo, profesional, claro y sin emojis.

Historial de conversación:
${historyContext}

Nueva consulta del usuario: "${message}".

Responde en formato JSON EXACTO (sin markdown, sin bloques de código ni comillas invertidas):
{
  "reply": "Respuesta directa y profesional respondiendo a la inquietud del usuario.",
  "keyMetrics": [
    { "label": "Métrica Relevante", "value": "Valor o Porcentaje", "trend": "up|down|neutral" }
  ],
  "suggestedAction": {
    "type": "run_qbe",
    "label": "Ver datos en QBE",
    "payload": {
      "entity": "venta",
      "fields": ["codigo_factura", "fecha_venta", "total", "sucursal"],
      "limit": 50
    }
  }
}
`;

        const responseText = await this.callGemini(chatPrompt, 7000);
        if (responseText) {
          const cleanJson = responseText
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed && parsed.reply) {
            let queryResult: any = undefined;
            let normalizedPayload: ExecuteQbeQueryDto | undefined = undefined;

            if (parsed.suggestedAction?.payload) {
              normalizedPayload = this.normalizeQbePayload(parsed.suggestedAction.payload);
              if (this.qbeService) {
                try {
                  const qbeRes = await this.qbeService.executeQuery(
                    normalizedPayload,
                    user || { id_rol: 1 },
                  );
                  queryResult = {
                    entity: qbeRes.entity,
                    entityName: qbeRes.entityName,
                    totalCount: qbeRes.totalCount,
                    columns: qbeRes.columns.slice(0, 5),
                    rows: qbeRes.rows.slice(0, 4),
                  };
                } catch (e: any) {
                  this.logger.warn(`Could not execute suggested QBE query in chat: ${e.message}`);
                }
              }
            }

            return {
              reply: parsed.reply,
              keyMetrics: Array.isArray(parsed.keyMetrics) ? parsed.keyMetrics : undefined,
              suggestedAction: normalizedPayload
                ? {
                    type: 'run_qbe',
                    label: parsed.suggestedAction?.label || 'Ver consulta completa en QBE',
                    payload: normalizedPayload,
                  }
                : undefined,
              queryResult,
              engine: 'gemini-3.5-flash',
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Error in Gemini chat: ${err.message}`);
      }
    }

    // Fallback conversacional determinista
    const interpreted = this.nlpService.interpretPrompt(message);
    const normalizedFallbackPayload = this.normalizeQbePayload(interpreted.suggestedPayload);
    let fallbackQueryResult: any = undefined;
    if (this.qbeService) {
      try {
        const qbeRes = await this.qbeService.executeQuery(
          normalizedFallbackPayload,
          user || { id_rol: 1 },
        );
        fallbackQueryResult = {
          entity: qbeRes.entity,
          entityName: qbeRes.entityName,
          totalCount: qbeRes.totalCount,
          columns: qbeRes.columns.slice(0, 5),
          rows: qbeRes.rows.slice(0, 4),
        };
      } catch (e: any) {
        this.logger.warn(`Could not execute fallback QBE query: ${e.message}`);
      }
    }

    return {
      reply: `He procesado tu consulta "${message}". Te sugiero revisar la consulta analítica en la entidad ${normalizedFallbackPayload.entity} para visualizar los indicadores en detalle.`,
      suggestedAction: {
        type: 'run_qbe',
        label: `Consultar ${normalizedFallbackPayload.entity}`,
        payload: normalizedFallbackPayload,
      },
      queryResult: fallbackQueryResult,
      engine: 'local-heuristic',
    };
  }
}
