import { Injectable, Logger } from '@nestjs/common';
import {
  ExecuteQbeQueryDto,
  InterpretedQbeResponse,
  QbeAggregationDto,
  QbeChartSpecDto,
  QbeChartType,
  QbeFilterDto,
} from './qbe.dto.js';

interface KeywordRule {
  synonyms: string[];
  entity: string;
  defaultFields: string[];
  primarySortField?: string;
  dateField?: string;
}

@Injectable()
export class QbeNlpService {
  private readonly logger = new Logger(QbeNlpService.name);

  private readonly entityRules: KeywordRule[] = [
    {
      entity: 'inventario_sucursal',
      synonyms: [
        'stock',
        'inventario',
        'existencia',
        'existencias',
        'almacen',
        'almacenes',
        'disponible',
        'disponibilidad',
        'unidades',
      ],
      defaultFields: [
        'sucursal',
        'producto',
        'sku_variante',
        'talla',
        'color',
        'stock_disponible',
        'stock_minimo',
      ],
      primarySortField: 'stock_disponible',
    },
    {
      entity: 'venta',
      synonyms: [
        'venta',
        'ventas',
        'factura',
        'facturas',
        'ticket',
        'tickets',
        'ingreso',
        'ingresos',
        'cobro',
        'cobros',
        'vendido',
        'vendidos',
        'vendida',
        'vendidas',
      ],
      defaultFields: [
        'id_venta',
        'codigo_factura',
        'fecha_venta',
        'total',
        'estado',
        'sucursal',
        'tipo_venta',
      ],
      primarySortField: 'total',
      dateField: 'fecha_venta',
    },
    {
      entity: 'producto',
      synonyms: [
        'producto',
        'productos',
        'prenda',
        'prendas',
        'ropa',
        'catalogo',
        'articulo',
        'articulos',
        'vestido',
        'vestidos',
        'pantalon',
        'pantalones',
        'camisa',
        'camisas',
        'abrigo',
        'abrigos',
      ],
      defaultFields: [
        'id_producto',
        'nombre',
        'sku',
        'precio_base',
        'categoria',
        'genero',
        'estado',
      ],
      primarySortField: 'precio_base',
    },
    {
      entity: 'cliente',
      synonyms: [
        'cliente',
        'clientes',
        'comprador',
        'compradores',
        'usuario',
        'usuarios',
        'puntos',
        'fidelidad',
        'fidelizacion',
      ],
      defaultFields: [
        'id_cliente',
        'nombre_completo',
        'ci',
        'email',
        'sexo',
        'puntos_fidelidad',
      ],
      primarySortField: 'puntos_fidelidad',
    },
    {
      entity: 'reserva',
      synonyms: [
        'reserva',
        'reservas',
        'apartado',
        'apartados',
        'separado',
        'separados',
        'cita',
        'citas',
      ],
      defaultFields: [
        'id_reserva',
        'codigo',
        'fecha_reserva',
        'estado',
        'sucursal',
        'cliente',
      ],
      primarySortField: 'fecha_reserva',
      dateField: 'fecha_reserva',
    },
    {
      entity: 'movimiento_inventario',
      synonyms: [
        'movimiento',
        'movimientos',
        'kardex',
        'traspaso',
        'traspasos',
        'transferencia',
        'transferencias',
        'entrada',
        'entradas',
        'salida',
        'salidas',
      ],
      defaultFields: [
        'id_movimiento',
        'tipo_movimiento',
        'cantidad',
        'motivo',
        'fecha',
        'sucursal',
      ],
      primarySortField: 'fecha',
      dateField: 'fecha',
    },
  ];

  /**
   * Interpreta un texto en lenguaje natural y extrae los parámetros de consulta estructurados QBE
   */
  interpretPrompt(prompt: string): InterpretedQbeResponse {
    const rawText = (prompt || '').trim();
    const normalized = this.normalizeText(rawText);
    const isComparison = /\b(compara|comparar|comparativa|comparacion|vs|contra|frente|diferencia)\b/.test(normalized);

    // 1. Identificar la entidad objetivo
    const entityMatch = this.detectEntity(normalized);
    const entity = entityMatch.entity;

    const detectedKeywords = {
      entityFound: entityMatch.rule.entity,
      metricsFound: [] as string[],
      filtersFound: [] as string[],
      groupByFound: [] as string[],
    };

    const filters: QbeFilterDto[] = [];
    let groupBy: string[] | undefined;
    const aggregations: QbeAggregationDto[] = [];
    let orderBy: { field: string; direction: 'asc' | 'desc' } | undefined;
    let limit: number = 100;

    // 2. Extraer Agrupamientos (Group By)
    const groupByDetected = this.detectGroupBy(normalized, entity);
    if (groupByDetected) {
      groupBy = [groupByDetected.field];
      detectedKeywords.groupByFound.push(groupByDetected.label);
    } else if (isComparison) {
      const fallbackGroup = entity === 'venta' ? 'sucursal' : (entity === 'inventario_sucursal' ? 'sucursal' : 'categoria');
      groupBy = [fallbackGroup];
      detectedKeywords.groupByFound.push(fallbackGroup);
    }

    // 3. Extraer Agregaciones y Métricas
    const aggsDetected = this.detectAggregations(normalized, entity, !!groupBy);
    if (aggsDetected.length > 0) {
      aggregations.push(...aggsDetected);
      aggsDetected.forEach((a) =>
        detectedKeywords.metricsFound.push(`${a.func}(${a.field})`),
      );
    } else if (isComparison && groupBy && groupBy.length > 0) {
      if (entity === 'venta') {
        aggregations.push({ field: 'total', func: 'SUM', alias: 'total_ventas' });
      } else if (entity === 'inventario_sucursal') {
        aggregations.push({ field: 'stock_disponible', func: 'SUM', alias: 'total_stock' });
      } else if (entity === 'producto') {
        aggregations.push({ field: 'precio_base', func: 'AVG', alias: 'precio_promedio' });
      } else if (entity === 'cliente') {
        aggregations.push({ field: 'id_cliente', func: 'COUNT', alias: 'total_clientes' });
      }
      aggregations.forEach((a) =>
        detectedKeywords.metricsFound.push(`${a.func}(${a.field})`),
      );
    }

    // 4. Extraer Filtros de Estado / Categoría / Tipo / Sucursal
    const categoricalFilters = this.detectCategoricalFilters(normalized, entity);
    categoricalFilters.forEach((f) => {
      filters.push(f.filter);
      detectedKeywords.filtersFound.push(f.description);
    });

    // 5. Extraer Filtros Numéricos (Comparadores)
    const numericFilters = this.detectNumericFilters(normalized, entity);
    numericFilters.forEach((f) => {
      filters.push(f.filter);
      detectedKeywords.filtersFound.push(f.description);
    });

    // 6. Extraer Filtros Temporales (Fechas)
    const dateFilters = this.detectDateFilters(normalized, entityMatch.rule);
    dateFilters.forEach((f) => {
      filters.push(f.filter);
      detectedKeywords.filtersFound.push(f.description);
    });

    // 7. Extraer Límites y Ordenamiento
    const limitDetected = this.detectLimit(normalized);
    if (limitDetected) {
      limit = limitDetected;
    }

    const orderDetected = this.detectOrderBy(normalized, entityMatch.rule, groupByDetected?.field);
    if (orderDetected) {
      orderBy = orderDetected;
    }

    // Campos a mostrar
    let fields: string[] = entityMatch.rule.defaultFields;
    if (groupBy && groupBy.length > 0) {
      // En consultas agrupadas, mostramos el campo agrupado y las métricas
      fields = [groupBy[0]];
    }

    // Construir explicación en español fluido
    const explanation = this.buildExplanation(
      entityMatch.rule.entity,
      groupBy,
      aggregations,
      filters,
      orderBy,
      limit,
    );

    const chartSpec = this.buildChartSpec(
      entity,
      groupBy && groupBy.length > 0 ? groupBy : undefined,
      aggregations,
      orderBy,
      rawText,
    );

    const filterLogic: 'AND' | 'OR' = isComparison && filters.length > 1 ? 'OR' : 'AND';

    const suggestedPayload: ExecuteQbeQueryDto = {
      entity,
      fields,
      filters: filters.length > 0 ? filters : undefined,
      filterLogic,
      groupBy: groupBy && groupBy.length > 0 ? groupBy : undefined,
      aggregations: aggregations.length > 0 ? aggregations : undefined,
      orderBy,
      limit,
      prompt: rawText,
      chartSpec,
    };

    return {
      interpreted: true,
      explanation,
      suggestedPayload,
      chartSpec,
      detectedKeywords,
    };
  }

  public buildChartSpec(
    entity: string,
    groupBy: string[] | undefined,
    aggregations: QbeAggregationDto[],
    orderBy: { field: string; direction: 'asc' | 'desc' } | undefined,
    prompt: string,
  ): QbeChartSpecDto {
    const norm = this.normalizeText(prompt);
    const isComparison = /\b(compara|comparar|comparativa|vs|contra|frente|diferencia)\b/.test(norm);
    let chartType: QbeChartType = isComparison ? 'bar_vertical' : 'bar_vertical';

    if (/\b(circular|torta|pie|donut|dona|distribucion|proporcion|porcentaje)\b/.test(norm)) {
      chartType = 'donut_percentage';
    } else if (/\b(pico|picos|area|linea|lineas|tendencia|historico|evolucion|diario|semanal|mensual|tiempo)\b/.test(norm)) {
      chartType = 'peak_area';
    } else if (/\b(ranking|top|horizontal|mas vendido|menos vendido|menor stock)\b/.test(norm)) {
      chartType = 'bar_horizontal';
    } else if (groupBy && groupBy.length === 1 && ['sucursal', 'tipo_venta', 'categoria'].includes(groupBy[0])) {
      chartType = 'bar_vertical';
    }

    const xKey = groupBy && groupBy.length > 0 ? groupBy[0] : (entity === 'producto' ? 'nombre' : (entity === 'venta' ? 'sucursal' : 'id'));
    const yKey = aggregations.length > 0 ? (aggregations[0].alias || aggregations[0].field) : (entity === 'venta' ? 'total' : 'stock_disponible');
    const unit = ['total', 'subtotal', 'precio_base'].some((k) => yKey.toLowerCase().includes(k)) ? 'Bs.' : 'unidades';

    const entityTitles: Record<string, string> = {
      venta: 'Análisis de Facturación y Ventas',
      producto: 'Inventario y Catálogo de Prendas',
      inventario_sucursal: 'Disponibilidad de Stock por Sucursal',
      cliente: 'Comportamiento y Fidelización de Clientes',
      reserva: 'Monitoreo de Reservas de Prendas',
      movimiento_inventario: 'Kardex de Movimientos de Inventario',
    };

    const baseTitle = entityTitles[entity] || 'Reporte Dinámico';
    const title = isComparison
      ? `Comparativa: ${baseTitle} ${groupBy && groupBy.length > 0 ? `por ${groupBy[0]}` : ''}`.trim()
      : `${baseTitle} ${groupBy && groupBy.length > 0 ? `por ${groupBy[0]}` : ''}`.trim();

    return {
      chartType,
      title,
      subtitle: `Visualización generada a partir de consulta: "${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
      xAxisKey: xKey,
      xAxisLabel: xKey.charAt(0).toUpperCase() + xKey.slice(1).replace('_', ' '),
      yAxisKey: yKey,
      yAxisLabel: unit === 'Bs.' ? 'Monto Acumulado (Bs.)' : 'Cantidad',
      unit,
      aiInsight: isComparison
        ? `Evaluación comparativa multi-variable para contrastar métricas y variaciones entre segmentos.`
        : `Visualización analítica configurada para evaluar ${title.toLowerCase()} en base a los registros activos.`,
    };
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿?¡!,;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private detectEntity(text: string): { entity: string; rule: KeywordRule } {
    let bestRule = this.entityRules[1]; // default: venta
    let highestScore = 0;

    // Regla de alta prioridad: "stock" o "existencias" apunta con fuerza a inventario_sucursal
    if (/\b(stock|existencia|existencias|inventario|almacen)\b/.test(text)) {
      return { entity: 'inventario_sucursal', rule: this.entityRules[0] };
    }

    for (const rule of this.entityRules) {
      let score = 0;
      for (const synonym of rule.synonyms) {
        const regex = new RegExp(`\\b${synonym}\\b`, 'g');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length * 2;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestRule = rule;
      }
    }

    return { entity: bestRule.entity, rule: bestRule };
  }

  private detectGroupBy(
    text: string,
    entity: string,
  ): { field: string; label: string } | null {
    if (/\b(por sucursal|por tienda|por sede|agrupado por sucursal|entre sucursales|entre tiendas|comparar sucursales|compara sucursales)\b/.test(text)) {
      return { field: 'sucursal', label: 'Sucursal' };
    }
    if (/\b(por categoria|por rubro|por tipo de prenda|agrupado por categoria|entre categorias|comparar categorias)\b/.test(text)) {
      return { field: 'categoria', label: 'Categoría' };
    }
    if (/\b(por estado|por estatus|agrupado por estado)\b/.test(text)) {
      return { field: 'estado', label: 'Estado' };
    }
    if (/\b(por tipo|por canal|por tipo de venta|presencial vs digital|digital vs presencial|canales de venta)\b/.test(text)) {
      return { field: entity === 'venta' ? 'tipo_venta' : 'tipo_movimiento', label: 'Tipo / Canal' };
    }
    if (/\b(por genero|por sexo|hombres vs mujeres|mujeres vs hombres)\b/.test(text)) {
      return { field: entity === 'cliente' ? 'sexo' : 'genero', label: 'Género' };
    }
    if (/\b(por temporada|por coleccion)\b/.test(text)) {
      return { field: 'temporada', label: 'Temporada' };
    }
    if (/\b(por producto|por prenda|entre productos|entre prendas)\b/.test(text)) {
      return { field: 'producto', label: 'Prenda' };
    }

    // Si es una consulta comparativa explícita y no se especificó 'por ...', inferir el agrupamiento lógico
    if (/\b(compara|comparar|comparativa|vs|contra|diferencia)\b/.test(text)) {
      if (/\b(sucursal|tienda|cochabamba|la paz|santa cruz)\b/.test(text)) {
        return { field: 'sucursal', label: 'Sucursal' };
      }
      if (/\b(canal|presencial|digital|online)\b/.test(text)) {
        return { field: entity === 'venta' ? 'tipo_venta' : 'tipo_movimiento', label: 'Tipo / Canal' };
      }
      if (/\b(categoria|prenda|vestido|abrigo|pantalon)\b/.test(text)) {
        return { field: entity === 'inventario_sucursal' ? 'producto' : 'categoria', label: 'Categoría / Prenda' };
      }
      if (/\b(genero|sexo|mujer|hombre)\b/.test(text)) {
        return { field: entity === 'cliente' ? 'sexo' : 'genero', label: 'Género' };
      }
      if (entity === 'venta') {
        return { field: 'sucursal', label: 'Sucursal' };
      }
    }

    return null;
  }

  private detectAggregations(
    text: string,
    entity: string,
    hasGroupBy: boolean,
  ): QbeAggregationDto[] {
    const aggs: QbeAggregationDto[] = [];

    // Suma / Total
    if (/\b(total|suma|monto|ingreso|ingresos|ganancia|ganancias|recaudacion)\b/.test(text)) {
      if (entity === 'venta') {
        aggs.push({ field: 'total', func: 'SUM', alias: 'total_ventas' });
      } else if (entity === 'inventario_sucursal') {
        aggs.push({ field: 'stock_disponible', func: 'SUM', alias: 'total_unidades_stock' });
      } else if (entity === 'movimiento_inventario') {
        aggs.push({ field: 'cantidad', func: 'SUM', alias: 'total_movido' });
      }
    }

    // Promedio
    if (/\b(promedio|media|medio|precio medio)\b/.test(text)) {
      if (entity === 'venta') {
        aggs.push({ field: 'total', func: 'AVG', alias: 'ticket_promedio' });
      } else if (entity === 'producto') {
        aggs.push({ field: 'precio_base', func: 'AVG', alias: 'precio_promedio' });
      } else if (entity === 'cliente') {
        aggs.push({ field: 'puntos_fidelidad', func: 'AVG', alias: 'promedio_puntos' });
      }
    }

    // Conteo / Cantidad
    if (/\b(cantidad|cuantos|numero de|conteo|total de prendas|total de productos|total de ventas)\b/.test(text) || (hasGroupBy && aggs.length === 0)) {
      if (entity === 'venta') {
        aggs.push({ field: 'id_venta', func: 'COUNT', alias: 'cantidad_ventas' });
      } else if (entity === 'producto') {
        aggs.push({ field: 'id_producto', func: 'COUNT', alias: 'cantidad_productos' });
      } else if (entity === 'inventario_sucursal') {
        aggs.push({ field: 'id_inventario', func: 'COUNT', alias: 'cantidad_items' });
      } else if (entity === 'cliente') {
        aggs.push({ field: 'id_cliente', func: 'COUNT', alias: 'cantidad_clientes' });
      } else if (entity === 'reserva') {
        aggs.push({ field: 'id_reserva', func: 'COUNT', alias: 'cantidad_reservas' });
      }
    }

    // Máximo / Mínimo
    if (/\b(maximo|mayor precio|mas caro|pico)\b/.test(text)) {
      if (entity === 'producto') {
        aggs.push({ field: 'precio_base', func: 'MAX', alias: 'precio_maximo' });
      } else if (entity === 'venta') {
        aggs.push({ field: 'total', func: 'MAX', alias: 'venta_maxima' });
      }
    }

    if (/\b(minimo|menor precio|mas barato)\b/.test(text)) {
      if (entity === 'producto') {
        aggs.push({ field: 'precio_base', func: 'MIN', alias: 'precio_minimo' });
      }
    }

    return aggs;
  }

  private detectCategoricalFilters(
    text: string,
    entity: string,
  ): Array<{ filter: QbeFilterDto; description: string }> {
    const list: Array<{ filter: QbeFilterDto; description: string }> = [];

    // Ciudades / Sucursales (soporta comparación con operador IN)
    const cities = ['cochabamba', 'la paz', 'santa cruz', 'sucre', 'tarija', 'oruro', 'potosi', 'beni', 'pando'];
    const matchedCities = cities
      .filter((city) => text.includes(city))
      .map((city) => city.charAt(0).toUpperCase() + city.slice(1));

    if (matchedCities.length > 1) {
      list.push({
        filter: { field: 'sucursal', operator: 'in', value: matchedCities.join(', ') },
        description: `Sucursal en (${matchedCities.join(', ')})`,
      });
    } else if (matchedCities.length === 1) {
      list.push({
        filter: { field: 'sucursal', operator: 'contains', value: matchedCities[0] },
        description: `Sucursal contiene "${matchedCities[0]}"`,
      });
    }

    // Estados
    if (/\b(activos|activas|activo|activa)\b/.test(text)) {
      list.push({
        filter: { field: 'estado', operator: 'eq', value: 'activo' },
        description: 'Estado es "activo"',
      });
    }
    if (/\b(inactivos|inactivas|inactivo|inactiva)\b/.test(text)) {
      list.push({
        filter: { field: 'estado', operator: 'eq', value: 'inactivo' },
        description: 'Estado es "inactivo"',
      });
    }
    if (/\b(completada|completadas|pagada|pagadas|finalizada)\b/.test(text)) {
      list.push({
        filter: { field: 'estado', operator: 'eq', value: 'completada' },
        description: 'Estado es "completada"',
      });
    }
    if (/\b(pendiente|pendientes|por pagar)\b/.test(text)) {
      list.push({
        filter: { field: 'estado', operator: 'eq', value: 'pendiente' },
        description: 'Estado es "pendiente"',
      });
    }
    if (/\b(cancelada|canceladas|anulada|anuladas)\b/.test(text)) {
      list.push({
        filter: { field: 'estado', operator: 'eq', value: 'cancelada' },
        description: 'Estado es "cancelada"',
      });
    }

    // Canal de venta (soporta comparación Presencial vs Digital)
    if (entity === 'venta') {
      const hasDigital = /\b(digital|online|web|ecommerce)\b/.test(text);
      const hasPresencial = /\b(presencial|tienda fisica|pos)\b/.test(text);
      if (hasDigital && hasPresencial) {
        list.push({
          filter: { field: 'tipo_venta', operator: 'in', value: 'digital, presencial' },
          description: 'Canal de venta en (digital, presencial)',
        });
      } else if (hasDigital) {
        list.push({
          filter: { field: 'tipo_venta', operator: 'eq', value: 'digital' },
          description: 'Canal de venta es "digital"',
        });
      } else if (hasPresencial) {
        list.push({
          filter: { field: 'tipo_venta', operator: 'eq', value: 'presencial' },
          description: 'Canal de venta es "presencial"',
        });
      }
    }

    // Comparación de categorías / prendas
    const garmentMap: Record<string, string> = {
      vestido: 'Vestidos',
      vestidos: 'Vestidos',
      abrigo: 'Abrigos',
      abrigos: 'Abrigos',
      pantalon: 'Pantalones',
      pantalones: 'Pantalones',
      camisa: 'Camisas',
      camisas: 'Camisas',
      blusa: 'Blusas',
      blusas: 'Blusas',
      falda: 'Faldas',
      faldas: 'Faldas',
    };
    const matchedGarments = Array.from(
      new Set(
        Object.keys(garmentMap)
          .filter((k) => new RegExp(`\\b${k}\\b`).test(text))
          .map((k) => garmentMap[k]),
      ),
    );
    if (matchedGarments.length > 1) {
      list.push({
        filter: { field: entity === 'inventario_sucursal' ? 'producto' : 'categoria', operator: 'in', value: matchedGarments.join(', ') },
        description: `Categorías comparadas en (${matchedGarments.join(', ')})`,
      });
    }

    // Género
    if (/\b(femenino|mujer|damas|dama)\b/.test(text)) {
      const field = entity === 'cliente' ? 'sexo' : 'genero';
      list.push({
        filter: { field, operator: 'contains', value: 'Femenino' },
        description: `${field} contiene "Femenino"`,
      });
    }
    if (/\b(masculino|hombre|caballeros|varon)\b/.test(text)) {
      const field = entity === 'cliente' ? 'sexo' : 'genero';
      list.push({
        filter: { field, operator: 'contains', value: 'Masculino' },
        description: `${field} contiene "Masculino"`,
      });
    }

    return list;
  }

  private detectNumericFilters(
    text: string,
    entity: string,
  ): Array<{ filter: QbeFilterDto; description: string }> {
    const list: Array<{ filter: QbeFilterDto; description: string }> = [];

    // Determinar campo numérico de contexto
    let numericField = 'precio_base';
    if (entity === 'inventario_sucursal') numericField = 'stock_disponible';
    if (entity === 'venta') numericField = 'total';
    if (entity === 'cliente') numericField = 'puntos_fidelidad';
    if (entity === 'movimiento_inventario') numericField = 'cantidad';

    // Si se menciona explícitamente "stock" o "unidades", forzar stock_disponible
    if (/\b(stock|unidades|existencias)\b/.test(text)) {
      numericField = 'stock_disponible';
    }
    // Si se menciona explícitamente "puntos"
    if (/\b(puntos|puntos de fidelidad)\b/.test(text)) {
      numericField = 'puntos_fidelidad';
    }
    // Si se menciona "precio" o "costo"
    if (/\b(precio|costo|valor)\b/.test(text)) {
      numericField = entity === 'venta' ? 'total' : 'precio_base';
    }

    // Caso 1: "bajo stock" o "stock critico"
    if (/\b(bajo stock|stock bajo|stock critico|pocas unidades)\b/.test(text)) {
      list.push({
        filter: { field: 'stock_disponible', operator: 'lt', value: 15 },
        description: 'Stock disponible menor a 15',
      });
    }

    // Caso 2: "entre X e Y" / "entre X y Y"
    const betweenMatch = text.match(/entre\s+(\d+(?:\.\d+)?)\s+(?:y|e)\s+(\d+(?:\.\d+)?)/);
    if (betweenMatch) {
      const v1 = parseFloat(betweenMatch[1]);
      const v2 = parseFloat(betweenMatch[2]);
      list.push({
        filter: { field: numericField, operator: 'between', value: v1, value2: v2 },
        description: `${numericField} entre ${v1} y ${v2}`,
      });
      return list;
    }

    // Caso 3: "mayor a / mas de / superior a / arriba de X"
    const gtMatch = text.match(/(?:mayor|mas|superior|arriba)\s+(?:a|que|de)\s+(\d+(?:\.\d+)?)/);
    if (gtMatch) {
      const v = parseFloat(gtMatch[1]);
      list.push({
        filter: { field: numericField, operator: 'gt', value: v },
        description: `${numericField} mayor a ${v}`,
      });
    }

    // Caso 4: "menor a / menos de / inferior a / debajo de X"
    const ltMatch = text.match(/(?:menor|menos|inferior|debajo)\s+(?:a|que|de)\s+(\d+(?:\.\d+)?)/);
    if (ltMatch) {
      const v = parseFloat(ltMatch[1]);
      list.push({
        filter: { field: numericField, operator: 'lt', value: v },
        description: `${numericField} menor a ${v}`,
      });
    }

    return list;
  }

  private detectDateFilters(
    text: string,
    rule: KeywordRule,
  ): Array<{ filter: QbeFilterDto; description: string }> {
    const list: Array<{ filter: QbeFilterDto; description: string }> = [];
    const dateField = rule.dateField || 'fecha';
    const now = new Date();

    if (/\b(hoy|el dia de hoy|actual)\b/.test(text)) {
      const todayStr = now.toISOString().split('T')[0];
      list.push({
        filter: { field: dateField, operator: 'gte', value: todayStr },
        description: `${dateField} desde hoy (${todayStr})`,
      });
    } else if (/\b(este mes|del mes|mes actual)\b/.test(text)) {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      list.push({
        filter: { field: dateField, operator: 'gte', value: firstDay },
        description: `${dateField} desde inicio de mes (${firstDay})`,
      });
    } else if (/\b(este ano|este anio|del ano|del anio|ano actual)\b/.test(text)) {
      const firstDayYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      list.push({
        filter: { field: dateField, operator: 'gte', value: firstDayYear },
        description: `${dateField} desde inicio de año (${firstDayYear})`,
      });
    } else if (/\b(ultimos|ultimas)\s+(\d+)\s+dias\b/.test(text)) {
      const match = text.match(/\b(ultimos|ultimas)\s+(\d+)\s+dias\b/);
      if (match) {
        const days = parseInt(match[2], 10);
        const past = new Date();
        past.setDate(now.getDate() - days);
        const pastStr = past.toISOString().split('T')[0];
        list.push({
          filter: { field: dateField, operator: 'gte', value: pastStr },
          description: `${dateField} de los últimos ${days} días`,
        });
      }
    } else if (/\b(esta semana|semana actual)\b/.test(text)) {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      const pastStr = past.toISOString().split('T')[0];
      list.push({
        filter: { field: dateField, operator: 'gte', value: pastStr },
        description: `${dateField} de los últimos 7 días`,
      });
    }

    return list;
  }

  private detectLimit(text: string): number | null {
    const match = text.match(/\b(?:top|primeros|primeras|mejores|limite)\s+(\d+)\b/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > 0 && n <= 1000) return n;
    }
    return null;
  }

  private detectOrderBy(
    text: string,
    rule: KeywordRule,
    groupByField?: string,
  ): { field: string; direction: 'asc' | 'desc' } | undefined {
    let direction: 'asc' | 'desc' = 'desc';

    if (/\b(mas caros|mas caras|mayor precio|mas vendidos|mayor total|mas recientes|ultimos|mayor stock)\b/.test(text)) {
      direction = 'desc';
    } else if (/\b(mas baratos|mas baratas|menor precio|mas economicos|mas antiguos|primeros|menor stock)\b/.test(text)) {
      direction = 'asc';
    }

    // Campo a ordenar
    let field = groupByField || rule.primarySortField || 'id_' + rule.entity;
    if (/\b(precio|caro|barato|economico)\b/.test(text)) {
      field = rule.entity === 'venta' ? 'total' : 'precio_base';
    } else if (/\b(stock|existencias|unidades)\b/.test(text)) {
      field = 'stock_disponible';
    } else if (/\b(fecha|reciente|antiguo)\b/.test(text)) {
      field = rule.dateField || 'fecha';
    } else if (/\b(puntos)\b/.test(text)) {
      field = 'puntos_fidelidad';
    }

    return { field, direction };
  }

  private buildExplanation(
    entity: string,
    groupBy: string[] | undefined,
    aggregations: QbeAggregationDto[],
    filters: QbeFilterDto[],
    orderBy: { field: string; direction: 'asc' | 'desc' } | undefined,
    limit: number,
  ): string {
    const entityNames: Record<string, string> = {
      venta: 'Ventas y Facturación',
      producto: 'Catálogo de Prendas y Productos',
      inventario_sucursal: 'Inventario por Sucursal',
      cliente: 'Clientes y Fidelización',
      reserva: 'Reservas de Prendas',
      movimiento_inventario: 'Movimientos de Stock (Kardex)',
    };

    const fieldLabels: Record<string, string> = {
      sucursal: 'Sucursal',
      categoria: 'Categoría',
      estado: 'Estado',
      tipo_venta: 'Canal de Venta',
      tipo_movimiento: 'Tipo de Movimiento',
      genero: 'Género',
      sexo: 'Sexo',
      temporada: 'Temporada',
      producto: 'Prenda',
      total: 'Total',
      precio_base: 'Precio Base',
      stock_disponible: 'Stock Disponible',
      puntos_fidelidad: 'Puntos Fidelidad',
    };

    let exp = `Consulta interpretada para ${entityNames[entity] || entity}`;

    if (groupBy && groupBy.length > 0) {
      exp += ` agrupada por "${groupBy.map((g) => fieldLabels[g] || g).join(', ')}"`;
    }

    if (aggregations.length > 0) {
      const aggTexts = aggregations.map(
        (a) => `${a.func === 'SUM' ? 'Suma' : a.func === 'AVG' ? 'Promedio' : a.func === 'COUNT' ? 'Conteo' : a.func} de ${fieldLabels[a.field] || a.field}`,
      );
      exp += ` con cálculo de ${aggTexts.join(' y ')}`;
    }

    if (filters.length > 0) {
      const filterTexts = filters.map((f) => `${f.field} (${f.operator}: ${f.value})`);
      exp += `. Filtros aplicados: ${filterTexts.join('; ')}`;
    }

    if (orderBy) {
      exp += `. Ordenado por ${orderBy.field} (${orderBy.direction.toUpperCase()})`;
    }

    if (limit && limit < 100) {
      exp += ` (Límite: ${limit} registros)`;
    }

    exp += '.';
    return exp;
  }
}
