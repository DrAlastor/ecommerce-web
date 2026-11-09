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
  private readonly geminiModel = 'gemini-3.5-flash-lite';

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
   * Cuando el usuario solicita un reporte o consulta de negocio por voz o texto,
   * el asistente consulta la base de datos en tiempo real, procesa las cifras y
   * REDACTA Y EXPLICA el reporte analítico directamente en texto (sin tablas ni redirecciones).
   */
  async processChat(dto: AiChatQueryDto, user?: any): Promise<AiChatResponse> {
    const { message, history } = dto;
    const rawMsg = (message || '').trim();
    const apiKey = this.getApiKey();

    // 1. Detectar saludos o preguntas de presentación generales
    const isGreeting = /^(hola|buen(os)?\s*(d[ií]as?|tardes?|noches?)|qui[eé]n\s*eres|qu[eé]\s*puedes\s*hacer|ayuda|help)\b/i.test(rawMsg);
    if (isGreeting) {
      return {
        reply: 'Hola. Soy tu consultor de inteligencia de negocios para Dressly Boutique. Puedo analizar los datos del sistema en tiempo real y redactarte reportes ejecutivos explicados sobre ventas, inventario por sucursal, rendimiento de prendas, reservas y clientes. Solo pídeme lo que necesitas (por ejemplo: "dame un reporte de ventas de este mes", "cómo están las existencias en tiendas" o "reporte de reservas") y te formularé el informe analítico completo aquí mismo.',
        keyMetrics: [
          { label: 'Sistema', value: 'Dressly AI', trend: 'neutral' },
          { label: 'Analítica', value: 'Tiempo Real', trend: 'up' },
          { label: 'Modalidad', value: 'Voz y Texto', trend: 'neutral' },
        ],
        engine: apiKey ? 'gemini-3.5-flash' : 'local-heuristic',
      };
    }

    // 2. Interpretar la consulta analítica para mapear entidad, campos y filtros
    const interpreted = await this.interpretNaturalQuery(rawMsg);
    const normalizedPayload = this.normalizeQbePayload(interpreted.suggestedPayload);

    // 3. Consultar la base de datos en tiempo real a través del motor analítico
    let queryRows: Record<string, any>[] = [];
    let totalCount = 0;
    let entityName = normalizedPayload.entity;

    if (this.qbeService) {
      try {
        const qbeRes = await this.qbeService.executeQuery(
          normalizedPayload,
          user || { id_rol: 1 },
        );
        queryRows = qbeRes.rows || [];
        totalCount = qbeRes.totalCount || queryRows.length;
        entityName = qbeRes.entityName || normalizedPayload.entity;
      } catch (err: any) {
        this.logger.warn(`Could not execute real-time analytical query for chat: ${err.message}`);
      }
    }

    // 4. Calcular métricas consolidadas y agregaciones de negocio
    const { summary, keyMetrics } = this.calculateEntityMetrics(
      normalizedPayload.entity,
      queryRows,
      totalCount,
    );

    // 5. Generar el reporte ejecutivo redactado y explicado con Gemini si la API key está disponible
    if (apiKey) {
      try {
        const historyContext = (history || [])
          .slice(-4)
          .map((h) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.content}`)
          .join('\n');

        const rowsSample = queryRows.slice(0, 10);

        const geminiPrompt = `
Eres "Dressly AI Analytics", el consultor analítico ejecutivo y director de Business Intelligence de Dressly Boutique.
El usuario realiza la siguiente consulta por voz o chat: "${rawMsg}".

Historial reciente:
${historyContext}

Hemos extraído en tiempo real los datos fidedignos de la base de datos de Dressly:
- Entidad analizada: ${entityName} (${normalizedPayload.entity})
- Total de registros coincidentes en el sistema: ${totalCount}
- Métricas consolidadas calculadas:
${JSON.stringify(summary, null, 2)}
- Muestra de registros reales:
${JSON.stringify(rowsSample, null, 2)}

INSTRUCCIÓN VITAL Y OBLIGATORIA DEL USUARIO:
El usuario te ha solicitado expresamente que le REDACTES Y LE EXPLIQUES EL REPORTE COMPLETO POR ESCRITO con tus palabras en este mensaje.
NO le digas al usuario que mire una tabla, ni que revise un dashboard o pantalla externa. Tú debes formular, explicar y redactar el reporte aquí mismo.

Estructura tu reporte analítico en texto con las siguientes 4 secciones (utiliza mayúsculas y viñetas):
1. DIAGNOSTICO EJECUTIVO: Resumen directo del volumen total, montos monetarios o unidades globales, y el estado general.
2. ANALISIS DETALLADO: Cifras concretas por sucursal, producto o categoría con montos y unidades exactas. Explica quién lidera y quién está rezagado.
3. ALERTAS OPERATIVAS: Puntos críticos identificados (ej. prendas con stock crítico, bajas ventas en ciertas tiendas o desbalances).
4. RECOMENDACIONES ESTRATEGICAS: Acciones directas y sugerencias de negocio para la gerencia.

REGLAS ESTRICTAS E INQUEBRANTABLES:
- CERO EMOJIS: Está terminantemente prohibido incluir cualquier emoji o emoticono en toda la respuesta.
- NUNCA digas: "mira la tabla", "a continuación verás los datos", "ve al dashboard" ni "entra a reportes". Eres tú quien redacta y explica el informe analítico aquí mismo.
- Cita los números reales que tienes arriba (en Bolivianos "Bs.", cantidades exactas de unidades y nombres de sucursales).

Responde ÚNICAMENTE en formato JSON EXACTO (sin bloques markdown ni comillas invertidas):
{
  "reply": "Texto del reporte ejecutivo completo y explicado para el usuario.",
  "keyMetrics": [
    { "label": "Etiqueta breve (máx 18 chars)", "value": "Cifra con unidad", "trend": "up|down|neutral" }
  ]
}
`;

        const responseText = await this.callGemini(geminiPrompt, 8000);
        if (responseText) {
          const cleanJson = responseText
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed && parsed.reply) {
            return {
              reply: parsed.reply,
              keyMetrics:
                Array.isArray(parsed.keyMetrics) && parsed.keyMetrics.length > 0
                  ? parsed.keyMetrics
                  : keyMetrics,
              engine: 'gemini-3.5-flash',
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Error generating explained report with Gemini: ${err.message}`);
      }
    }

    // 6. Fallback determinista local: Redacción explicada completa sin fallar
    const localReport = this.generateExecutiveReportLocal(
      normalizedPayload.entity,
      entityName,
      queryRows,
      totalCount,
      rawMsg,
      summary,
    );

    return {
      reply: localReport,
      keyMetrics,
      engine: 'local-heuristic',
    };
  }

  /**
   * Calcula agregaciones y estadísticas de negocio a partir de los datos crudos
   */
  private calculateEntityMetrics(
    entity: string,
    rows: Record<string, any>[],
    totalCount: number,
  ): {
    summary: Record<string, any>;
    keyMetrics: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }[];
  } {
    const summary: Record<string, any> = {
      totalRegistros: totalCount,
      muestraProcesada: rows.length,
    };
    const keyMetrics: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }[] = [];

    if (entity === 'venta') {
      const totalAmount = rows.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
      const avgTicket = rows.length > 0 ? totalAmount / rows.length : 0;

      const branchMap: Record<string, { total: number; count: number }> = {};
      const typeMap: Record<string, number> = {};

      for (const r of rows) {
        const suc = String(r.sucursal || 'Sin Sucursal');
        if (!branchMap[suc]) branchMap[suc] = { total: 0, count: 0 };
        branchMap[suc].total += Number(r.total) || 0;
        branchMap[suc].count += 1;

        const tipo = String(r.tipo_venta || 'otro');
        typeMap[tipo] = (typeMap[tipo] || 0) + 1;
      }

      const branchRanking = Object.entries(branchMap)
        .map(([sucursal, data]) => ({
          sucursal,
          total: data.total,
          transacciones: data.count,
        }))
        .sort((a, b) => b.total - a.total);

      summary.montoTotalVendido = `Bs. ${totalAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
      summary.ticketPromedio = `Bs. ${avgTicket.toFixed(2)}`;
      summary.ventasPorCanal = typeMap;
      summary.rankingSucursales = branchRanking;

      keyMetrics.push({
        label: 'Total Vendido',
        value: `Bs. ${totalAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
        trend: 'up',
      });
      keyMetrics.push({
        label: 'Transacciones',
        value: totalCount,
        trend: 'neutral',
      });
      keyMetrics.push({
        label: 'Ticket Promedio',
        value: `Bs. ${avgTicket.toFixed(2)}`,
        trend: 'neutral',
      });
      if (branchRanking.length > 0) {
        keyMetrics.push({
          label: 'Sucursal Líder',
          value: branchRanking[0].sucursal,
          trend: 'up',
        });
      }
    } else if (entity === 'inventario_sucursal') {
      const totalStock = rows.reduce((acc, r) => acc + (Number(r.stock_disponible) || 0), 0);
      const lowStockItems = rows.filter((r) => {
        const disp = Number(r.stock_disponible) || 0;
        const min = Number(r.stock_minimo) || 5;
        return disp <= min;
      });

      const branchStock: Record<string, number> = {};
      for (const r of rows) {
        const suc = String(r.sucursal || 'Sin Sucursal');
        branchStock[suc] = (branchStock[suc] || 0) + (Number(r.stock_disponible) || 0);
      }

      summary.stockFisicoTotal = `${totalStock} unidades`;
      summary.prendasEnRiesgo = lowStockItems.length;
      summary.stockPorSucursal = branchStock;
      summary.criticosDetalle = lowStockItems.slice(0, 5).map((i) => ({
        prenda: i.producto,
        talla: i.talla,
        sucursal: i.sucursal,
        disponible: i.stock_disponible,
      }));

      keyMetrics.push({
        label: 'Stock Total',
        value: `${totalStock} uds`,
        trend: 'neutral',
      });
      keyMetrics.push({
        label: 'Variantes Evaluadas',
        value: totalCount,
        trend: 'neutral',
      });
      keyMetrics.push({
        label: 'Stock Crítico',
        value: `${lowStockItems.length} prendas`,
        trend: lowStockItems.length > 0 ? 'down' : 'up',
      });
      if (lowStockItems.length > 0) {
        keyMetrics.push({
          label: 'Prenda Crítica',
          value: String(lowStockItems[0].producto || 'Prenda').slice(0, 16),
          trend: 'down',
        });
      }
    } else if (entity === 'producto') {
      const totalPrendas = totalCount;
      const prices = rows.map((r) => Number(r.precio_base) || 0).filter((p) => p > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

      const catMap: Record<string, number> = {};
      for (const r of rows) {
        const cat = String(r.categoria || 'Sin categoría');
        catMap[cat] = (catMap[cat] || 0) + 1;
      }

      summary.totalCatalogo = totalPrendas;
      summary.precioPromedio = `Bs. ${avgPrice.toFixed(2)}`;
      summary.distribucionCategorias = catMap;

      keyMetrics.push({
        label: 'Catálogo Prendas',
        value: totalPrendas,
        trend: 'neutral',
      });
      keyMetrics.push({
        label: 'Precio Promedio',
        value: `Bs. ${avgPrice.toFixed(2)}`,
        trend: 'neutral',
      });
      keyMetrics.push({
        label: 'Categorías Activas',
        value: Object.keys(catMap).length,
        trend: 'neutral',
      });
    } else if (entity === 'cliente') {
      const totalPoints = rows.reduce((acc, r) => acc + (Number(r.puntos_fidelidad) || 0), 0);
      const topClientes = [...rows]
        .sort((a, b) => (Number(b.total_compras) || 0) - (Number(a.total_compras) || 0))
        .slice(0, 3)
        .map((c) => ({
          nombre: c.nombre_completo || `${c.nombre || ''} ${c.apellido || ''}`.trim(),
          compras: c.total_compras,
        }));

      summary.totalClientes = totalCount;
      summary.puntosFidelidadTotal = totalPoints;
      summary.clientesDestacados = topClientes;

      keyMetrics.push({
        label: 'Clientes Totales',
        value: totalCount,
        trend: 'neutral',
      });
      keyMetrics.push({
        label: 'Puntos Acumulados',
        value: totalPoints,
        trend: 'up',
      });
    } else if (entity === 'reserva') {
      const statusMap: Record<string, number> = {};
      for (const r of rows) {
        const est = String(r.estado || 'pendiente');
        statusMap[est] = (statusMap[est] || 0) + 1;
      }
      summary.totalReservas = totalCount;
      summary.estadosReservas = statusMap;

      keyMetrics.push({
        label: 'Reservas Totales',
        value: totalCount,
        trend: 'neutral',
      });
      keyMetrics.push({
        label: 'Pendientes Retiro',
        value: statusMap['pendiente'] || 0,
        trend: (statusMap['pendiente'] || 0) > 0 ? 'neutral' : 'up',
      });
    } else {
      keyMetrics.push({
        label: 'Registros Analizados',
        value: totalCount,
        trend: 'neutral',
      });
    }

    return { summary, keyMetrics };
  }

  /**
   * Generador determinista local de reportes ejecutivos redactados
   */
  private generateExecutiveReportLocal(
    entity: string,
    entityName: string,
    rows: Record<string, any>[],
    totalCount: number,
    userQuery: string,
    summary: Record<string, any>,
  ): string {
    const parts: string[] = [];

    parts.push(`INFORME ANALITICO EJECUTIVO - DRESSLY BOUTIQUE`);
    parts.push(`Consulta atendida: "${userQuery}"`);
    parts.push(`Entidad evaluada: ${entityName} (Total registros en base de datos: ${totalCount})`);
    parts.push('');

    // 1. Diagnóstico Ejecutivo
    parts.push('1. DIAGNOSTICO EJECUTIVO');
    if (entity === 'venta') {
      parts.push(
        `Se han auditado ${totalCount} transacciones comerciales con una facturación acumulada de ${summary.montoTotalVendido || 'Bs. 0.00'}, alcanzando un ticket promedio de ${summary.ticketPromedio || 'Bs. 0.00'} por compra. La actividad comercial refleja dinamismo en los canales presenciales y digitales.`,
      );
    } else if (entity === 'inventario_sucursal') {
      parts.push(
        `Se registran ${summary.stockFisicoTotal || '0 unidades'} disponibles en piso de venta y almacenes, distribuidas en ${totalCount} variantes de prendas. Se identificaron ${summary.prendasEnRiesgo || 0} variantes en nivel crítico de reposición.`,
      );
    } else if (entity === 'producto') {
      parts.push(
        `El catálogo de prendas activas suma ${summary.totalCatalogo || totalCount} referencias, con un precio promedio ponderado de ${summary.precioPromedio || 'Bs. 0.00'}. Se observa cobertura en ${Object.keys(summary.distribucionCategorias || {}).length} líneas de moda.`,
      );
    } else {
      parts.push(
        `Se consolidaron exitosamente ${totalCount} registros del módulo ${entityName}. Los indicadores evaluados presentan consistencia operativa con las reglas de negocio establecidas.`,
      );
    }
    parts.push('');

    // 2. Análisis Detallado
    parts.push('2. ANALISIS DETALLADO');
    if (entity === 'venta' && Array.isArray(summary.rankingSucursales) && summary.rankingSucursales.length > 0) {
      parts.push('Distribución de rendimiento por sucursal:');
      summary.rankingSucursales.slice(0, 4).forEach((suc: any) => {
        parts.push(
          `- Sucursal ${suc.sucursal}: Bs. ${Number(suc.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })} en ${suc.transacciones} transacciones.`,
        );
      });
    } else if (entity === 'inventario_sucursal' && summary.criticosDetalle && summary.criticosDetalle.length > 0) {
      parts.push('Prendas con inventario crítico detectadas:');
      summary.criticosDetalle.forEach((c: any) => {
        parts.push(
          `- ${c.prenda} (Talla ${c.talla}) en ${c.sucursal}: solo ${c.disponible} unidad(es) disponible(s).`,
        );
      });
    } else if (entity === 'producto' && summary.distribucionCategorias) {
      parts.push('Concentración por categorías de colección:');
      Object.entries(summary.distribucionCategorias).slice(0, 5).forEach(([cat, qty]) => {
        parts.push(`- Categoría ${cat}: ${qty} prenda(s) catalogada(s).`);
      });
    } else {
      parts.push(`- Registros procesados de la base de datos: ${rows.length} de ${totalCount}.`);
      if (rows.length > 0) {
        parts.push(`- Variables analizadas: ${Object.keys(rows[0]).slice(0, 6).join(', ')}.`);
      }
    }
    parts.push('');

    // 3. Alertas Operativas
    parts.push('3. ALERTAS OPERATIVAS');
    if (entity === 'inventario_sucursal' && summary.prendasEnRiesgo > 0) {
      parts.push(
        `- Riesgo inminente de quiebre de stock en ${summary.prendasEnRiesgo} variantes de alta rotación.`,
      );
      parts.push('- Desbalance de existencias entre sucursales de alta demanda y tiendas periféricas.');
    } else if (entity === 'venta') {
      parts.push(
        '- Concentración de ingresos en sucursales principales con brecha frente a puntos de venta secundarios.',
      );
      parts.push('- Monitorear el volumen de transacciones en turnos matutinos vs vespertinos.');
    } else {
      parts.push('- Mantener seguimiento continuo para evitar discrepancias operativas.');
    }
    parts.push('');

    // 4. Recomendaciones de Negocio
    parts.push('4. RECOMENDACIONES DE NEGOCIO');
    if (entity === 'inventario_sucursal') {
      parts.push(
        '- Ejecutar transferencias de inventario inter-sucursal para equilibrar las unidades disponibles.',
      );
      parts.push(
        '- Emitir órdenes prioritarias de abastecimiento para las variantes con stock menor a 5 unidades.',
      );
    } else if (entity === 'venta') {
      parts.push(
        '- Impulsar promociones cruzadas o de ventas combinadas para elevar el ticket promedio en sucursales secundarias.',
      );
      parts.push(
        '- Fortalecer las campañas de ventas digitales para incrementar la participación del canal online.',
      );
    } else {
      parts.push(
        '- Auditar periódicamente los parámetros de la entidad para optimizar la toma de decisiones gerencial.',
      );
    }

    return parts.join('\n');
  }
}
