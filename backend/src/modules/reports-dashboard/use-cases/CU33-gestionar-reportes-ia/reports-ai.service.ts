/**
 * @caso-de-uso CU33 — Gestionar Reportes por Voz y Lenguaje Natural con IA
 * @subsistema Inteligencia de Negocios y Reportes
 * @capa Lógica de Negocio y Servicio Externo LLM — Backend
 * @responsabilidad Proporciona interpretación de consultas en lenguaje natural,
 *                  generación de diagnósticos e insights ejecutivos y chat conversacional
 *                  utilizando Google Gemini con fallback local heurístico determinista.
 */

import { Injectable, Logger, Inject, forwardRef, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pg from 'pg';
const { Pool } = pg;
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
export class ReportsAiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportsAiService.name);
  private readonly geminiModel = 'gemini-3.5-flash-lite';
  private readOnlyPool?: pg.Pool;

  constructor(
    private readonly configService: ConfigService,
    private readonly nlpService: QbeNlpService,
    @Inject(forwardRef(() => QbeService))
    private readonly qbeService: QbeService,
  ) {}

  async onModuleInit() {
    await this.ensureAiDatabaseUser();
    this.initReadOnlyPool();
  }

  async onModuleDestroy() {
    if (this.readOnlyPool) {
      await this.readOnlyPool.end().catch(() => {});
    }
  }

  /**
   * Garantiza de forma idempotente que el usuario de solo lectura para la IA exista en PostgreSQL
   */
  private async ensureAiDatabaseUser(): Promise<void> {
    const mainDbUrl = this.configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
    if (!mainDbUrl) return;

    try {
      const pool = new Pool({ connectionString: mainDbUrl });
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ai_readonly') THEN
            CREATE ROLE ai_readonly WITH LOGIN PASSWORD 'ai_readonly_secure_pass_2026';
          ELSE
            ALTER ROLE ai_readonly WITH LOGIN PASSWORD 'ai_readonly_secure_pass_2026';
          END IF;
        END
        $$;
      `);
      await pool.query('GRANT CONNECT ON DATABASE dressly_db TO ai_readonly;').catch(() => {});
      await pool.query('GRANT USAGE ON SCHEMA public TO ai_readonly;').catch(() => {});
      await pool.query('GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_readonly;').catch(() => {});
      await pool.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ai_readonly;').catch(() => {});
      await pool.query('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM ai_readonly;').catch(() => {});
      await pool.query('REVOKE CREATE ON SCHEMA public FROM ai_readonly;').catch(() => {});
      await pool.query('REVOKE SELECT ON usuario FROM ai_readonly;').catch(() => {});
      await pool.query('GRANT SELECT (id_usuario, email, estado, id_rol) ON usuario TO ai_readonly;').catch(() => {});
      await pool.query('REVOKE SELECT ON token_recuperacion FROM ai_readonly;').catch(() => {});
      await pool.query("ALTER ROLE ai_readonly SET statement_timeout = '4000';").catch(() => {});
      await pool.end();
      this.logger.log('Rol de base de datos ai_readonly verificado y activo en PostgreSQL.');
    } catch (err: any) {
      this.logger.warn(`No se pudo autoverificar ai_readonly con superusuario: ${err.message}`);
    }
  }

  private initReadOnlyPool(): void {
    const aiUrl =
      this.configService.get<string>('AI_DATABASE_URL') ||
      process.env.AI_DATABASE_URL ||
      'postgresql://ai_readonly:ai_readonly_secure_pass_2026@localhost:5433/dressly_db?schema=public';

    try {
      this.readOnlyPool = new Pool({ connectionString: aiUrl });
      this.logger.log('Pool de solo lectura seguro para IA conectado exitosamente.');
    } catch (err: any) {
      this.logger.error('Error al inicializar pool de solo lectura para IA:', err);
    }
  }

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
  private async callGemini(prompt: string, timeoutMs = 12000): Promise<string | null> {
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
Eres el motor de traducción y generación de visualizaciones analíticas avanzadas de Dressly Boutique (sistema de moda y retail).
El usuario escribe o dicta por voz la siguiente consulta: "${raw}".

Las entidades disponibles son:
- "venta": Campos: id_venta, codigo_factura, fecha_venta, total, subtotal, impuestos, tipo_venta, estado, sucursal, cliente, cajero.
- "producto": Campos: id_producto, nombre, sku, descripcion, precio_base, categoria, genero, estado.
- "inventario_sucursal": Campos: sucursal, producto, sku_variante, talla, color, stock_disponible, stock_minimo, estado_stock.
- "cliente": Campos: id_cliente, nombre, apellido, email, telefono, puntos_fidelidad, total_compras, ciudad, estado.
- "reserva": Campos: id_reserva, codigo_reserva, fecha_reserva, fecha_limite, estado, total_estimado, sucursal, cliente.
- "movimiento_inventario": Campos: id_movimiento, tipo_movimiento, cantidad, motivo, fecha, sucursal, producto.

Analiza qué métrica o entidad solicita el usuario, cómo agruparla y cuál es la MEJOR VISUALIZACIÓN GRÁFICA (bar_vertical, bar_horizontal, peak_area, line_temporal, donut_percentage).

Genera una respuesta en formato JSON EXACTO con la siguiente estructura (sin formato Markdown, sin comillas invertidas):
{
  "entity": "venta | producto | inventario_sucursal | cliente | reserva | movimiento_inventario",
  "fields": ["campo1", "campo2"],
  "filters": [
    { "field": "campo", "operator": "eq|neq|gt|gte|lt|lte|contains|between|in", "value": "valor" }
  ],
  "groupBy": ["campo_agrupador"],
  "aggregations": [
    { "field": "campo", "func": "sum|avg|count|min|max", "alias": "Total Vendido" }
  ],
  "orderBy": { "field": "campo", "direction": "asc|desc" },
  "limit": 50,
  "chartSuggestion": "bar|donut|line|area",
  "chartSpec": {
    "chartType": "bar_vertical | bar_horizontal | peak_area | line_temporal | donut_percentage",
    "title": "Título ejecutivo y analítico del gráfico",
    "subtitle": "Subtítulo descriptivo",
    "xAxisKey": "campo_para_eje_x",
    "xAxisLabel": "Etiqueta del eje X",
    "yAxisKey": "campo_para_eje_y",
    "yAxisLabel": "Etiqueta del eje Y",
    "unit": "Bs. | unidades | clientes",
    "aiInsight": "Conclusión ejecutiva directa en 1 frase de lo que revela el gráfico."
  },
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
            const chartSpec = parsed.chartSpec?.chartType
              ? parsed.chartSpec
              : this.nlpService.buildChartSpec(
                  parsed.entity,
                  Array.isArray(parsed.groupBy) ? parsed.groupBy : undefined,
                  Array.isArray(parsed.aggregations) ? parsed.aggregations : [],
                  parsed.orderBy,
                  raw,
                );

            const suggestedPayload: ExecuteQbeQueryDto = {
              entity: parsed.entity,
              fields: parsed.fields.length > 0 ? parsed.fields : ['id_venta', 'total'],
              filters: Array.isArray(parsed.filters)
                ? parsed.filters.map((f: any) => {
                    let op = String(f.operator || 'eq').toLowerCase().trim();
                    if (op === 'less_than' || op === '<') op = 'lt';
                    if (op === 'less_than_or_equal' || op === '<=' || op === 'lte') op = 'lte';
                    if (op === 'greater_than' || op === 'more_than' || op === '>') op = 'gt';
                    if (op === 'greater_than_or_equal' || op === '>=' || op === 'gte') op = 'gte';
                    if (op === 'equals' || op === 'equal' || op === '=') op = 'eq';
                    if (op === 'not_equals' || op === '!=' || op === '<>') op = 'neq';
                    if (op === 'like') op = 'contains';
                    return {
                      field: f.field,
                      operator: op,
                      value: f.value,
                      value2: f.value2,
                    };
                  })
                : [],
              groupBy: Array.isArray(parsed.groupBy) && parsed.groupBy.length > 0 ? parsed.groupBy : undefined,
              aggregations: Array.isArray(parsed.aggregations) && parsed.aggregations.length > 0
                ? parsed.aggregations.map((a: any) => ({
                    field: a.field,
                    func: String(a.func || 'SUM').toUpperCase().trim(),
                    alias: a.alias,
                  }))
                : undefined,
              orderBy: parsed.orderBy?.field ? parsed.orderBy : undefined,
              limit: Number(parsed.limit) || 100,
              chartType: parsed.chartSuggestion === 'pie' || parsed.chartSuggestion === 'donut' ? 'pie' : 'bar',
              chartSpec,
            };

            return {
              interpreted: true,
              suggestedPayload,
              chartSpec,
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

    // Normalizar agregaciones forzando mayúsculas en func
    const aggregations = (Array.isArray(rawPayload?.aggregations) && rawPayload.aggregations.length > 0)
      ? rawPayload.aggregations.map((a: any) => ({
          field: a.field,
          func: String(a.func || 'SUM').toUpperCase().trim(),
          alias: a.alias,
        }))
      : undefined;

    return {
      entity,
      fields,
      filters,
      groupBy: Array.isArray(rawPayload?.groupBy) && rawPayload.groupBy.length > 0 ? rawPayload.groupBy : undefined,
      aggregations,
      orderBy: rawPayload?.orderBy?.field ? rawPayload.orderBy : undefined,
      limit: Number(rawPayload?.limit) || 50,
      chartType: rawPayload?.chartSuggestion === 'pie' || rawPayload?.chartSuggestion === 'donut' ? 'pie' : 'bar',
    };
  }

  /**
   * Ejecuta una consulta analítica directa en PostgreSQL con el usuario ai_readonly
   */
  private async executeDirectAiQuery(rawMsg: string): Promise<{
    rows: any[];
    sqlUsed: string;
    intent: string;
    keyMetrics: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }[];
    executiveSummary: string;
  } | null> {
    if (!this.readOnlyPool) {
      return null;
    }

    const norm = rawMsg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    let sql = '';
    let intent = '';

    if (/(prenda|ropa|producto)s?.*(cara|caro|costos|mayor precio|mas car|alta gama)/.test(norm) || /mas caras?/.test(norm)) {
      sql = `SELECT p.id_producto, p.nombre, p.precio_base, COALESCE(c.nombre, 'General') as categoria, p.estado 
             FROM producto p 
             LEFT JOIN categoria c ON p.id_categoria = c.id_categoria 
             ORDER BY p.precio_base DESC 
             LIMIT 10;`;
      intent = 'productos_caros';
    } else if (/(prenda|ropa|producto)s?.*(barat|econom|menor precio|mas barat|bajo costo)/.test(norm) || /mas baratas?/.test(norm)) {
      sql = `SELECT p.id_producto, p.nombre, p.precio_base, COALESCE(c.nombre, 'General') as categoria, p.estado 
             FROM producto p 
             LEFT JOIN categoria c ON p.id_categoria = c.id_categoria 
             ORDER BY p.precio_base ASC 
             LIMIT 10;`;
      intent = 'productos_baratos';
    } else if (/(stock|inventario).*?(bajo|critic|quiebre|poco|escas)/.test(norm) || /(prenda|variante)s?.*?(bajo|sin stock)/.test(norm)) {
      sql = `SELECT p.nombre as prenda, t.codigo as talla, s.nombre as sucursal, inv.stock_disponible, inv.stock_minimo 
             FROM inventario_sucursal inv 
             JOIN producto_variante pv ON inv.id_producto_variante = pv.id_producto_variante 
             JOIN producto p ON pv.id_producto = p.id_producto 
             JOIN talla t ON pv.id_talla = t.id_talla 
             JOIN sucursal s ON inv.id_sucursal = s.id_sucursal 
             WHERE inv.stock_disponible <= 15 
             ORDER BY inv.stock_disponible ASC 
             LIMIT 10;`;
      intent = 'inventario_bajo';
    } else if (/(inventario|stock).*?(sucursal|tienda)/.test(norm)) {
      sql = `SELECT s.nombre as sucursal, SUM(inv.stock_disponible)::int as total_unidades, COUNT(DISTINCT inv.id_producto_variante)::int as variantes_distintas 
             FROM sucursal s 
             JOIN inventario_sucursal inv ON s.id_sucursal = inv.id_sucursal 
             GROUP BY s.nombre 
             ORDER BY total_unidades DESC;`;
      intent = 'inventario_sucursal';
    } else if (/(cliente|comprador)s?.*?(compra|frecuente|fidelidad|puntos|mejor)/.test(norm)) {
      sql = `SELECT c.nombre || ' ' || c.apellido as cliente, c.ci, c.puntos_fidelidad, COUNT(v.id_venta)::int as compras_registradas 
             FROM cliente c 
             LEFT JOIN venta v ON c.id_cliente = v.id_cliente 
             GROUP BY c.id_cliente, c.nombre, c.apellido, c.ci, c.puntos_fidelidad 
             ORDER BY c.puntos_fidelidad DESC 
             LIMIT 10;`;
      intent = 'top_clientes';
    } else if (/(venta|ingreso|facturad)s?.*?(sucursal|tienda|mes|acumulad)/.test(norm) || /rendimiento comercial/.test(norm)) {
      sql = `SELECT COALESCE(s.nombre, 'Venta General') as sucursal, COUNT(v.id_venta)::int as transacciones, COALESCE(SUM(v.total), 0)::numeric as total_ventas 
             FROM sucursal s 
             LEFT JOIN empleado_sucursal es ON s.id_sucursal = es.id_sucursal 
             LEFT JOIN empleado e ON es.id_empleado = e.id_empleado 
             LEFT JOIN venta v ON e.id_empleado = v.id_empleado 
             GROUP BY s.nombre 
             ORDER BY total_ventas DESC;`;
      intent = 'ventas_sucursal';
    } else if (/(reserva|apartad)s?/.test(norm)) {
      sql = `SELECT r.codigo, r.estado, s.nombre as sucursal, c.nombre || ' ' || c.apellido as cliente, r.fecha_reserva 
             FROM reserva r 
             JOIN sucursal s ON r.id_sucursal = s.id_sucursal 
             JOIN cliente c ON r.id_cliente = c.id_cliente 
             ORDER BY r.fecha_reserva DESC 
             LIMIT 10;`;
      intent = 'reservas';
    }

    if (!sql) return null;

    try {
      const res = await this.readOnlyPool.query(sql);
      const rows = res.rows || [];

      const keyMetrics: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }[] = [];
      const lines: string[] = [];

      if (intent === 'productos_caros') {
        const maxPrice = Number(rows[0]?.precio_base || 0);
        const top5 = rows.slice(0, 5);
        const avgTop = top5.reduce((acc, r) => acc + (Number(r.precio_base) || 0), 0) / (top5.length || 1);

        lines.push('Las prendas con mayor precio registradas en la base de datos son:');
        top5.forEach((p) => {
          lines.push(`- ${p.nombre}: Bs. ${Number(p.precio_base).toFixed(2)} (${p.categoria})`);
        });
        lines.push('');
        lines.push(`El precio más alto alcanza Bs. ${maxPrice.toFixed(2)}, con un promedio de Bs. ${avgTop.toFixed(2)} en las variantes más exclusivas.`);

        keyMetrics.push({ label: 'Prenda Más Cara', value: `Bs. ${maxPrice.toFixed(2)}`, trend: 'up' });
        keyMetrics.push({ label: 'Top 5 Promedio', value: `Bs. ${avgTop.toFixed(2)}`, trend: 'neutral' });
        keyMetrics.push({ label: 'Registros BD', value: `${rows.length} prendas`, trend: 'neutral' });
      } else if (intent === 'productos_baratos') {
        const minPrice = Number(rows[0]?.precio_base || 0);
        const top5 = rows.slice(0, 5);

        lines.push('Las prendas más accesibles del catálogo son:');
        top5.forEach((p) => {
          lines.push(`- ${p.nombre}: Bs. ${Number(p.precio_base).toFixed(2)} (${p.categoria})`);
        });
        lines.push('');
        lines.push(`El precio de entrada más bajo es de Bs. ${minPrice.toFixed(2)}.`);

        keyMetrics.push({ label: 'Precio Mínimo', value: `Bs. ${minPrice.toFixed(2)}`, trend: 'down' });
        keyMetrics.push({ label: 'Prendas Listadas', value: top5.length, trend: 'neutral' });
      } else if (intent === 'inventario_bajo') {
        lines.push('Prendas con inventario crítico identificadas en tiendas:');
        rows.slice(0, 5).forEach((r) => {
          lines.push(`- ${r.prenda} (Talla ${r.talla}, Sucursal ${r.sucursal}): solo ${r.stock_disponible} unidad(es) disponible(s).`);
        });
        lines.push('');
        lines.push('Se recomienda gestionar transferencias inter-sucursales o reposición para prevenir quiebres de venta.');

        keyMetrics.push({ label: 'Variantes Críticas', value: rows.length, trend: 'down' });
        keyMetrics.push({ label: 'Menor Stock', value: `${rows[0]?.stock_disponible || 0} uds`, trend: 'down' });
      } else if (intent === 'inventario_sucursal') {
        const totalAll = rows.reduce((acc, r) => acc + (Number(r.total_unidades) || 0), 0);
        lines.push('Distribución del inventario físico consolidado por sucursal:');
        rows.forEach((r) => {
          lines.push(`- Sucursal ${r.sucursal}: ${r.total_unidades} prendas disponibles (${r.variantes_distintas} variantes activas).`);
        });
        lines.push('');
        lines.push(`Inventario total disponible en la red de sucursales: ${totalAll} prendas.`);

        keyMetrics.push({ label: 'Stock Total Red', value: `${totalAll} uds`, trend: 'neutral' });
        keyMetrics.push({ label: 'Sucursales', value: rows.length, trend: 'neutral' });
      } else if (intent === 'top_clientes') {
        lines.push('Clientes con mayor puntaje en el programa de fidelización:');
        rows.slice(0, 5).forEach((c) => {
          lines.push(`- ${c.cliente} (CI ${c.ci}): ${c.puntos_fidelidad} puntos acumulados.`);
        });

        keyMetrics.push({ label: 'Mayor Puntaje', value: `${rows[0]?.puntos_fidelidad || 0} pts`, trend: 'up' });
        keyMetrics.push({ label: 'Clientes Evaluados', value: rows.length, trend: 'neutral' });
      } else if (intent === 'ventas_sucursal') {
        if (rows.length === 0 || rows.every((r) => Number(r.total_ventas) === 0)) {
          lines.push('No se registran transacciones de venta completadas en el periodo actual.');
          lines.push('El sistema se encuentra a la espera del procesamiento de las primeras ventas de las sucursales.');
          keyMetrics.push({ label: 'Ventas Totales', value: 'Bs. 0.00', trend: 'neutral' });
          keyMetrics.push({ label: 'Transacciones', value: 0, trend: 'neutral' });
        } else {
          lines.push('Rendimiento comercial por sucursal verificado en tiempo real:');
          rows.forEach((r) => {
            lines.push(`- ${r.sucursal}: Bs. ${Number(r.total_ventas).toLocaleString('es-BO', { minimumFractionDigits: 2 })} (${r.transacciones} ventas).`);
          });
          const totalV = rows.reduce((acc, r) => acc + Number(r.total_ventas || 0), 0);
          keyMetrics.push({ label: 'Ventas Totales', value: `Bs. ${totalV.toFixed(2)}`, trend: 'up' });
        }
      }

      return {
        rows,
        sqlUsed: sql,
        intent,
        keyMetrics,
        executiveSummary: lines.join('\n'),
      };
    } catch (err: any) {
      this.logger.warn(`Error executing direct analytical SQL: ${err.message}`);
      return null;
    }
  }

  /**
   * CU33 — Chat Conversacional Analítico con IA
   * Responde de manera concisa, ejecutiva y directa con datos reales de PostgreSQL
   */
  async processChat(dto: AiChatQueryDto, user?: any): Promise<AiChatResponse> {
    const { message, history } = dto;
    const rawMsg = (message || '').trim();
    const apiKey = this.getApiKey();

    // 1. Detectar saludos o preguntas de presentación generales
    const isGreeting = /^(hola|buen(os)?\s*(d[ií]as?|tardes?|noches?)|qui[eé]n\s*eres|qu[eé]\s*puedes\s*hacer|ayuda|help)\b/i.test(rawMsg);
    if (isGreeting) {
      return {
        reply: 'Hola. Soy tu consultor de inteligencia de negocios para Dressly Boutique. Puedo analizar los datos del sistema en tiempo real y responderte consultas ejecutivas sobre ventas, inventario por sucursal, rendimiento de prendas, reservas y clientes. ¿En qué indicador te gustaría profundizar hoy?',
        keyMetrics: [
          { label: 'Sistema', value: 'Dressly AI', trend: 'neutral' },
          { label: 'Analítica', value: 'Tiempo Real', trend: 'up' },
          { label: 'Acceso BD', value: 'Solo Lectura', trend: 'neutral' },
        ],
        engine: apiKey ? 'gemini-3.5-flash' : 'local-heuristic',
      };
    }

    // 2. Intentar ejecución directa en PostgreSQL con el usuario ai_readonly (0ms latencia, datos reales)
    const directResult = await this.executeDirectAiQuery(rawMsg);
    if (directResult) {
      if (apiKey) {
        try {
          const geminiPrompt = `
Eres "Dressly AI Analytics", consultor analítico ejecutivo de Dressly Boutique.
El usuario realiza la siguiente consulta: "${rawMsg}".
Datos reales extraídos de PostgreSQL mediante el usuario ai_readonly:
${JSON.stringify(directResult.rows.slice(0, 10), null, 2)}

INSTRUCCIONES CLAVE:
1. Responde de forma DIRECTA, CONCISA y EJECUTIVA.
2. OBLIGATORIO: Presenta las 3 a 5 prendas, sucursales o clientes destacados en viñetas (-) con su nombre exacto y valor en Bs. (por ejemplo: "- Abrigo Largo de Lana: Bs. 890.00 (Chaquetas)").
3. Incluye una breve conclusión gerencial al final (máximo 2 líneas).
4. CERO EMOJIS (terminantemente prohibido cualquier emoji o emoticono).
5. Responde ÚNICAMENTE en JSON:
{
  "reply": "Texto con la respuesta ejecutiva y las viñetas con datos reales.",
  "keyMetrics": [
    { "label": "Etiqueta breve", "value": "Cifra con unidad", "trend": "up|down|neutral" }
  ]
}
`;
          const responseText = await this.callGemini(geminiPrompt, 12000);
          if (responseText) {
            const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed && parsed.reply) {
              let finalReply = parsed.reply;
              if (!finalReply.includes('-') && directResult.executiveSummary.includes('-')) {
                finalReply = `${finalReply}\n\n${directResult.executiveSummary}`;
              }
              return {
                reply: finalReply,
                keyMetrics:
                  Array.isArray(parsed.keyMetrics) && parsed.keyMetrics.length > 0
                    ? parsed.keyMetrics
                    : directResult.keyMetrics,
                engine: 'Gemini 3.5 Flash Lite + ai_readonly DB',
              };
            }
          }
        } catch (err: any) {
          this.logger.warn(`Gemini enrichment failed, using local DB synthesis: ${err.message}`);
        }
      }

      return {
        reply: directResult.executiveSummary,
        keyMetrics: directResult.keyMetrics,
        engine: 'PostgreSQL ai_readonly (Consulta real en BD)',
      };
    }

    // 3. Fallback a interpretación analítica QBE estándar
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

    // 5. Generar respuesta ejecutiva, directa y concisa con Gemini si la API key está disponible
    if (apiKey) {
      try {
        const historyContext = (history || [])
          .slice(-4)
          .map((h) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.content}`)
          .join('\n');

        const rowsSample = queryRows.slice(0, 10);

        const geminiPrompt = `
Eres "Dressly AI Analytics", el consultor analítico ejecutivo de Dressly Boutique.
El usuario realiza la siguiente consulta en el asistente de chat o por voz: "${rawMsg}".

Historial reciente:
${historyContext}

Datos analíticos verificados en tiempo real mediante el usuario seguro de solo lectura (ai_readonly en PostgreSQL):
- Entidad: ${entityName} (${normalizedPayload.entity})
- Registros coincidentes: ${totalCount}
- Métricas consolidadas:
${JSON.stringify(summary, null, 2)}
- Muestra de registros representativos:
${JSON.stringify(rowsSample, null, 2)}

INSTRUCCIONES CLAVE DE RESPUESTA:
1. Responde de forma DIRECTA, CONCISA y EJECUTIVA en 1 o 2 párrafos breves (máximo 4 a 6 líneas en total).
2. Proporciona inmediatamente las cifras y montos clave (en Bolivianos "Bs." o unidades) y menciona las sucursales o productos relevantes.
3. Si el usuario solicita un desglose amplio, usa viñetas cortas (-) con datos concretos sin extenderte en introducciones innecesarias.
4. NO le digas al usuario que mire tablas externas ni dashboards.
5. CERO EMOJIS (está terminantemente prohibido incluir cualquier emoji o emoticono).
6. Tono formal, ágil y profesional de alta dirección retail.

Responde ÚNICAMENTE en formato JSON EXACTO:
{
  "reply": "Respuesta directa, ejecutiva y concisa con cifras exactas.",
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

    // 6. Fallback determinista local conciso
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
   * Generador determinista local de respuestas ejecutivas concisas
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

    if (entity === 'venta') {
      parts.push(
        `Se auditaron ${totalCount} transacciones en ${entityName} con una facturación acumulada de ${summary.montoTotalVendido || 'Bs. 0.00'} y un ticket promedio de ${summary.ticketPromedio || 'Bs. 0.00'}.`,
      );
      if (Array.isArray(summary.rankingSucursales) && summary.rankingSucursales.length > 0) {
        parts.push('');
        parts.push('Rendimiento por sucursal:');
        summary.rankingSucursales.slice(0, 3).forEach((suc: any) => {
          parts.push(
            `- ${suc.sucursal}: Bs. ${Number(suc.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })} en ${suc.transacciones} transacciones.`,
          );
        });
      }
    } else if (entity === 'inventario_sucursal') {
      parts.push(
        `El inventario suma ${summary.stockFisicoTotal || '0 unidades'} en ${totalCount} variantes de prendas. Se detectaron ${summary.prendasEnRiesgo || 0} variantes en nivel crítico.`,
      );
      if (summary.criticosDetalle && summary.criticosDetalle.length > 0) {
        parts.push('');
        parts.push('Variantes con stock más bajo:');
        summary.criticosDetalle.slice(0, 3).forEach((c: any) => {
          parts.push(`- ${c.prenda} (Talla ${c.talla}, ${c.sucursal}): ${c.disponible} ud(s)`);
        });
      }
    } else if (entity === 'producto') {
      const isCaras = /(cara|caro|costos|mayor precio|mas car|alta gama)/i.test(userQuery);
      const isBaratas = /(barat|econom|menor precio|mas barat|bajo costo)/i.test(userQuery);

      if (isCaras && rows.length > 0) {
        const sorted = [...rows].sort((a, b) => (Number(b.precio_base) || 0) - (Number(a.precio_base) || 0)).slice(0, 5);
        parts.push('Las prendas con mayor precio registradas en la base de datos son:');
        sorted.forEach((p) => {
          parts.push(`- ${p.nombre}: Bs. ${Number(p.precio_base || 0).toFixed(2)} (${p.categoria || 'General'})`);
        });
        const maxPrice = Number(sorted[0]?.precio_base || 0);
        const avgTop = sorted.reduce((acc, p) => acc + (Number(p.precio_base) || 0), 0) / (sorted.length || 1);
        parts.push('');
        parts.push(`El precio más alto alcanza Bs. ${maxPrice.toFixed(2)}, con un promedio de Bs. ${avgTop.toFixed(2)} en las prendas destacadas.`);
      } else if (isBaratas && rows.length > 0) {
        const sorted = [...rows].sort((a, b) => (Number(a.precio_base) || 0) - (Number(b.precio_base) || 0)).slice(0, 5);
        parts.push('Las prendas más accesibles del catálogo son:');
        sorted.forEach((p) => {
          parts.push(`- ${p.nombre}: Bs. ${Number(p.precio_base || 0).toFixed(2)} (${p.categoria || 'General'})`);
        });
        const minPrice = Number(sorted[0]?.precio_base || 0);
        parts.push('');
        parts.push(`El precio de entrada más bajo es de Bs. ${minPrice.toFixed(2)}.`);
      } else {
        parts.push(
          `El catálogo cuenta con ${summary.totalCatalogo || totalCount} prendas activas, con un precio promedio de ${summary.precioPromedio || 'Bs. 0.00'}.`,
        );
        if (summary.distribucionCategorias) {
          parts.push('');
          parts.push('Principales categorías:');
          Object.entries(summary.distribucionCategorias).slice(0, 3).forEach(([cat, qty]) => {
            parts.push(`- ${cat}: ${qty} prenda(s)`);
          });
        }
      }
    } else if (entity === 'cliente') {
      parts.push(
        `Se registran ${totalCount} clientes en la base de datos con un acumulado de ${summary.puntosFidelidadTotal || 0} puntos de fidelidad.`,
      );
    } else {
      parts.push(
        `Se procesaron ${totalCount} registros de la entidad ${entityName} verificados directamente en la base de datos.`,
      );
    }

    return parts.join('\n');
  }
}
