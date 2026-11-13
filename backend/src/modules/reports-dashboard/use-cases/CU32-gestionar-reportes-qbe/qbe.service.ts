import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { ReportExporterService, ReportIndicator, ReportPayload } from '../../shared/services/report-exporter.service.js';
import { ReportsDashboardService } from '../CU29-consultar-dashboard-reportes/reports-dashboard.service.js';
import {
  ExecuteQbeQueryDto,
  ExportQbeQueryDto,
  InterpretedQbeResponse,
  QbeAggregationDto,
  QbeChartSpecDto,
  QbeChartType,
  QbeFilterDto,
} from './qbe.dto.js';
import { ExportFormat } from '../../dto/query-reports.dto.js';
import { QbeNlpService } from './qbe-nlp.service.js';

export interface QbeFieldMeta {
  id: string;
  label: string;
  type: 'string' | 'number' | 'currency' | 'date' | 'enum';
  options?: string[];
  aggregatable?: boolean;
  sortable?: boolean;
}

export interface QbeEntityMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: QbeFieldMeta[];
}

@Injectable()
export class QbeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsDashboardService,
    private readonly exporterService: ReportExporterService,
    private readonly nlpService: QbeNlpService,
  ) {}

  /**
   * Interpreta una consulta en lenguaje natural y genera el payload estructurado QBE
   */
  interpretNaturalQuery(prompt: string): InterpretedQbeResponse {
    return this.nlpService.interpretPrompt(prompt);
  }

  /**
   * Catálogo de entidades y atributos disponibles para consultas visuales QBE
   */
  private readonly entitiesMetadata: QbeEntityMeta[] = [
    {
      id: 'venta',
      name: 'Ventas y Facturación',
      category: 'comercial',
      description: 'Órdenes comerciales, tickets de venta digital y POS presencial con totales y estados.',
      fields: [
        { id: 'id_venta', label: 'ID Venta', type: 'number', sortable: true },
        { id: 'codigo_factura', label: 'Código Factura / Ticket', type: 'string', sortable: true },
        { id: 'fecha_venta', label: 'Fecha de Venta', type: 'date', sortable: true },
        { id: 'tipo_venta', label: 'Canal de Venta', type: 'enum', options: ['digital', 'presencial'], sortable: true },
        { id: 'subtotal', label: 'Subtotal (Bs.)', type: 'currency', aggregatable: true, sortable: true },
        { id: 'descuento', label: 'Descuento (Bs.)', type: 'currency', aggregatable: true, sortable: true },
        { id: 'total', label: 'Total Neto (Bs.)', type: 'currency', aggregatable: true, sortable: true },
        { id: 'estado', label: 'Estado Venta', type: 'enum', options: ['completada', 'pendiente', 'cancelada'], sortable: true },
        { id: 'sucursal', label: 'Sucursal', type: 'string', sortable: true },
        { id: 'cliente', label: 'Cliente', type: 'string', sortable: true },
        { id: 'metodo_pago', label: 'Método de Pago', type: 'string', sortable: true },
      ],
    },
    {
      id: 'producto',
      name: 'Catálogo de Prendas y Productos',
      category: 'catalogo',
      description: 'Prendas registradas en catálogo con precios base, categorías, temporadas y géneros.',
      fields: [
        { id: 'id_producto', label: 'ID Prenda', type: 'number', sortable: true },
        { id: 'nombre', label: 'Nombre de Prenda', type: 'string', sortable: true },
        { id: 'sku', label: 'SKU Prenda', type: 'string', sortable: true },
        { id: 'precio_base', label: 'Precio Base (Bs.)', type: 'currency', aggregatable: true, sortable: true },
        { id: 'genero', label: 'Género', type: 'string', sortable: true },
        { id: 'categoria', label: 'Categoría', type: 'string', sortable: true },
        { id: 'temporada', label: 'Temporada', type: 'string', sortable: true },
        { id: 'estado', label: 'Estado Catálogo', type: 'enum', options: ['activo', 'inactivo'], sortable: true },
      ],
    },
    {
      id: 'inventario_sucursal',
      name: 'Inventario por Sucursal',
      category: 'inventario',
      description: 'Existencias físicas de variantes, stock disponible, reservado y stock de seguridad.',
      fields: [
        { id: 'id_inventario', label: 'ID Inventario', type: 'number', sortable: true },
        { id: 'sucursal', label: 'Sucursal', type: 'string', sortable: true },
        { id: 'producto', label: 'Prenda', type: 'string', sortable: true },
        { id: 'sku_variante', label: 'SKU Variante', type: 'string', sortable: true },
        { id: 'talla', label: 'Talla', type: 'string', sortable: true },
        { id: 'color', label: 'Color', type: 'string', sortable: true },
        { id: 'stock_disponible', label: 'Stock Disponible', type: 'number', aggregatable: true, sortable: true },
        { id: 'stock_reservado', label: 'Stock Reservado', type: 'number', aggregatable: true, sortable: true },
        { id: 'stock_minimo', label: 'Stock Mínimo', type: 'number', aggregatable: true, sortable: true },
        { id: 'valor_estimado', label: 'Valor Estimado (Bs.)', type: 'currency', aggregatable: true, sortable: true },
      ],
    },
    {
      id: 'cliente',
      name: 'Clientes Registrados',
      category: 'clientes',
      description: 'Padrón de compradores con datos de fidelización, compras e histórico.',
      fields: [
        { id: 'id_cliente', label: 'ID Cliente', type: 'number', sortable: true },
        { id: 'nombre_completo', label: 'Nombre Completo', type: 'string', sortable: true },
        { id: 'ci', label: 'Cédula de Identidad', type: 'string', sortable: true },
        { id: 'email', label: 'Correo Electrónico', type: 'string', sortable: true },
        { id: 'sexo', label: 'Sexo / Género', type: 'string', sortable: true },
        { id: 'puntos_fidelidad', label: 'Puntos Fidelidad', type: 'number', aggregatable: true, sortable: true },
      ],
    },
    {
      id: 'reserva',
      name: 'Reservas de Sucursal',
      category: 'reservas',
      description: 'Apartados físicos y virtuales de prendas en tiendas con código y estados.',
      fields: [
        { id: 'id_reserva', label: 'ID Reserva', type: 'number', sortable: true },
        { id: 'codigo', label: 'Código Reserva', type: 'string', sortable: true },
        { id: 'fecha_reserva', label: 'Fecha Creación', type: 'date', sortable: true },
        { id: 'estado', label: 'Estado', type: 'enum', options: ['pendiente', 'confirmada', 'cancelada', 'completada'], sortable: true },
        { id: 'sucursal', label: 'Sucursal', type: 'string', sortable: true },
        { id: 'cliente', label: 'Cliente', type: 'string', sortable: true },
      ],
    },
    {
      id: 'movimiento_inventario',
      name: 'Movimientos de Stock (Kardex)',
      category: 'inventario',
      description: 'Historial de entradas, salidas y traspasos entre sucursales.',
      fields: [
        { id: 'id_movimiento', label: 'ID Movimiento', type: 'number', sortable: true },
        { id: 'tipo_movimiento', label: 'Tipo Movimiento', type: 'enum', options: ['entrada', 'salida', 'ajuste', 'transferencia'], sortable: true },
        { id: 'cantidad', label: 'Cantidad', type: 'number', aggregatable: true, sortable: true },
        { id: 'motivo', label: 'Motivo / Detalle', type: 'string', sortable: true },
        { id: 'fecha', label: 'Fecha Movimiento', type: 'date', sortable: true },
        { id: 'sucursal', label: 'Sucursal', type: 'string', sortable: true },
      ],
    },
  ];

  /**
   * Obtiene los metadatos completos para el constructor visual QBE
   */
  getMetadata() {
    return {
      entities: this.entitiesMetadata,
      operators: {
        string: [
          { id: 'contains', label: 'Contiene' },
          { id: 'eq', label: 'Es igual a' },
          { id: 'neq', label: 'Es diferente de' },
          { id: 'startsWith', label: 'Empieza con' },
        ],
        number: [
          { id: 'eq', label: '=' },
          { id: 'neq', label: '≠' },
          { id: 'gt', label: '>' },
          { id: 'gte', label: '≥' },
          { id: 'lt', label: '<' },
          { id: 'lte', label: '≤' },
          { id: 'between', label: 'Entre rango' },
        ],
        currency: [
          { id: 'eq', label: '=' },
          { id: 'neq', label: '≠' },
          { id: 'gt', label: '>' },
          { id: 'gte', label: '≥' },
          { id: 'lt', label: '<' },
          { id: 'lte', label: '≤' },
          { id: 'between', label: 'Entre rango' },
        ],
        date: [
          { id: 'eq', label: 'En fecha exacta' },
          { id: 'gte', label: 'Desde fecha' },
          { id: 'lte', label: 'Hasta fecha' },
          { id: 'between', label: 'Entre fechas' },
        ],
        enum: [
          { id: 'eq', label: 'Es' },
          { id: 'neq', label: 'No es' },
        ],
      },
      aggregationFunctions: [
        { id: 'COUNT', label: 'Conteo (COUNT)' },
        { id: 'SUM', label: 'Suma Total (SUM)' },
        { id: 'AVG', label: 'Promedio (AVG)' },
        { id: 'MAX', label: 'Máximo (MAX)' },
        { id: 'MIN', label: 'Mínimo (MIN)' },
      ],
    };
  }

  /**
   * Ejecuta la consulta visual dinámica QBE con validación y prevención de inyección
   */
  async authorizedScope(user: any) { return this.reportsService.getAuthorizedBranches(user); }

  async executeQuery(dto: ExecuteQbeQueryDto, user: any) {
    const entityMeta = this.entitiesMetadata.find((e) => e.id === dto.entity);
    if (!entityMeta) {
      throw new BadRequestException(`Entidad '${dto.entity}' no reconocida en el catálogo QBE.`);
    }

    const auth = await this.reportsService.getAuthorizedBranches(user);
    const branchScope = auth.isGlobal ? null : auth.branchIds;

    // Obtener datos crudos según la entidad
    let rawRecords: Record<string, any>[] = [];

    switch (dto.entity) {
      case 'venta':
        rawRecords = await this.fetchVentas(branchScope);
        break;
      case 'producto':
        rawRecords = await this.fetchProductos();
        break;
      case 'inventario_sucursal':
        rawRecords = await this.fetchInventario(branchScope);
        break;
      case 'cliente':
        rawRecords = await this.fetchClientes();
        break;
      case 'reserva':
        rawRecords = await this.fetchReservas(branchScope);
        break;
      case 'movimiento_inventario':
        rawRecords = await this.fetchMovimientos(branchScope);
        break;
      default:
        throw new BadRequestException(`Entidad '${dto.entity}' no soportada.`);
    }

    // 1. Aplicar filtros dinámicos en memoria de forma segura (soporta lógica AND y OR)
    let filteredRecords = rawRecords;
    if (dto.filters && dto.filters.length > 0) {
      const activeFilters = dto.filters.filter(
        (f) => f.value !== '' && f.value !== undefined && f.value !== null,
      );
      if (activeFilters.length > 0) {
        const logic = (dto.filterLogic || 'AND').toUpperCase();
        filteredRecords = filteredRecords.filter((rec) => {
          if (logic === 'OR') {
            return activeFilters.some((filter) => this.matchesFilter(rec, filter));
          }
          return activeFilters.every((filter) => this.matchesFilter(rec, filter));
        });
      }
    }

    const totalFiltered = filteredRecords.length;

    // 2. Procesar Agrupación / Agregación si fue solicitada
    let finalRows: Record<string, any>[] = [];
    let finalColumns: { key: string; label: string; type: string }[] = [];
    let chartData: any[] = [];
    let chartSuggestion: 'bar' | 'pie' | 'line' =
      dto.chartType === 'pie' || dto.chartType === 'donut_percentage'
        ? 'pie'
        : dto.chartType === 'line' || dto.chartType === 'peak_area'
          ? 'line'
          : 'bar';

    if (dto.groupBy && dto.groupBy.length > 0 && dto.aggregations && dto.aggregations.length > 0) {
      const grouped = this.applyGrouping(filteredRecords, dto.groupBy, dto.aggregations, entityMeta);
      finalRows = grouped.rows;
      finalColumns = grouped.columns;
      chartData = grouped.chartData;
      chartSuggestion = dto.groupBy.length === 1 && finalRows.length <= 8 ? 'pie' : 'bar';
    } else {
      // Proyección estándar de columnas seleccionadas
      const selectedFields =
        dto.fields && dto.fields.length > 0
          ? dto.fields
          : entityMeta.fields.map((f) => f.id);

      finalColumns = selectedFields
        .map((fId) => {
          const fm = entityMeta.fields.find((f) => f.id === fId);
          return fm ? { key: fm.id, label: fm.label, type: fm.type } : null;
        })
        .filter(Boolean) as any[];

      // Ordenamiento
      if (dto.orderBy?.field) {
        const { field, direction } = dto.orderBy;
        filteredRecords.sort((a, b) => {
          const valA = a[field] ?? '';
          const valB = b[field] ?? '';
          if (typeof valA === 'number' && typeof valB === 'number') {
            return direction === 'asc' ? valA - valB : valB - valA;
          }
          return direction === 'asc'
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        });
      }

      // Proyectar sólo campos deseados
      finalRows = filteredRecords.map((rec) => {
        const item: Record<string, any> = {};
        for (const col of finalColumns) {
          item[col.key] = rec[col.key];
        }
        return item;
      });

      // Generar chartData automático: busca la primera columna categórica y la primera columna numérica
      chartData = this.buildAutoChartData(finalRows, finalColumns);
    }

    // Paginación si se especifica: para exportaciones permitimos hasta 10000 registros completos
    const isExport = Boolean(dto.limit && dto.limit > 1000);
    const limit = isExport ? Math.min(dto.limit || 10000, 10000) : Math.min(dto.limit || 100, 1000);
    const page = Math.max(dto.page || 1, 1);
    const paginatedRows = isExport ? finalRows.slice(0, limit) : finalRows.slice((page - 1) * limit, page * limit);

    // Indicadores clave para el encabezado del reporte
    const isGrouped = Boolean(dto.groupBy && dto.groupBy.length > 0 && dto.aggregations && dto.aggregations.length > 0);
    const indicators: ReportIndicator[] = [
      { label: isGrouped ? 'Registros Procesados' : 'Registros Encontrados', value: totalFiltered },
      { label: isGrouped ? 'Filas Consolidadas' : 'Columnas Visualizadas', value: isGrouped ? finalRows.length : finalColumns.length },
    ];

    // Si hay una columna monetaria o numérica relevante, sumarla en los indicadores
    const primaryNumCol = finalColumns.find((c) => c.type === 'currency' || c.type === 'number');
    if (primaryNumCol && finalRows.length > 0) {
      const sum = finalRows.reduce((acc, curr) => acc + (Number(curr[primaryNumCol.key]) || 0), 0);
      indicators.push({
        label: `Total acumulado (${primaryNumCol.label})`,
        value: sum,
        suffix: primaryNumCol.type === 'currency' ? 'Bs.' : undefined,
      });
    }

    const totalSum = chartData.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 1;
    const avgSum = chartData.length > 0 ? totalSum / chartData.length : 0;
    const enrichedChartData = chartData.map((item) => {
      const val = Number(item.total) || 0;
      const pct = Math.round((val / totalSum) * 100);
      const deltaVsAvg = Math.round((val - avgSum) * 100) / 100;
      return {
        ...item,
        total: val,
        percentage: pct,
        formattedTotal: val.toLocaleString('es-BO'),
        deltaVsAvg,
      };
    });

    const effectiveChartSpec =
      dto.chartSpec ||
      this.inferChartSpec(entityMeta, finalColumns, enrichedChartData, chartSuggestion);

    return {
      title: `Consulta Dinámica QBE: ${entityMeta.name}`,
      entity: entityMeta.id,
      entityName: entityMeta.name,
      generatedAt: new Date().toLocaleString('es-BO'),
      generatedBy: user.email,
      totalCount: totalFiltered,
      page,
      limit,
      columns: finalColumns,
      rows: paginatedRows,
      allRowsCount: finalRows.length,
      indicators,
      chartSuggestion,
      chartData: enrichedChartData,
      chartSpec: effectiveChartSpec,
    };
  }

  private inferChartSpec(
    entityMeta: QbeEntityMeta,
    columns: { key: string; label: string; type: string }[],
    chartData: any[],
    chartSuggestion: 'bar' | 'pie' | 'line',
  ): QbeChartSpecDto {
    const primaryNum = columns.find((c) => c.type === 'currency' || c.type === 'number');
    const primaryLabel = columns.find((c) => c.type === 'string' || c.type === 'enum') || columns[0];
    const isCurrency = primaryNum?.type === 'currency' || entityMeta.id === 'venta';

    let chartType: QbeChartType = 'bar_vertical';
    if (chartSuggestion === 'pie' || (chartData.length <= 7 && chartData.length > 1)) {
      chartType = 'donut_percentage';
    } else if (chartSuggestion === 'line' || columns.some((c) => c.type === 'date')) {
      chartType = 'peak_area';
    }

    const title = `Distribución de ${primaryNum?.label || 'Registros'} por ${primaryLabel?.label || 'Categoría'}`;

    return {
      chartType,
      title,
      subtitle: `Entidad: ${entityMeta.name} — ${chartData.length} segmentos analizados`,
      xAxisKey: primaryLabel?.key || 'name',
      xAxisLabel: primaryLabel?.label || 'Concepto',
      yAxisKey: primaryNum?.key || 'total',
      yAxisLabel: isCurrency ? 'Total Acumulado (Bs.)' : 'Cantidad',
      unit: isCurrency ? 'Bs.' : 'unidades',
      aiInsight:
        chartData.length > 0
          ? `El segmento con mayor volumen es "${chartData[0]?.name}" con ${chartData[0]?.formattedTotal || chartData[0]?.total} ${isCurrency ? 'Bs.' : 'unidades'} (${chartData[0]?.percentage || 0}% del total).`
          : 'Sin datos suficientes para generar conclusiones.',
    };
  }

  /**
   * Exporta la consulta QBE a PDF, CSV o Excel
   */
  async exportQuery(dto: ExportQbeQueryDto, user: any): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    // Para exportar se toman todos los registros completos (hasta 10000 filas sin recortes)
    const execResult = await this.executeQuery({ ...dto, limit: 10000, page: 1 }, user);

    const effectiveChartSpec = dto.chartSpec || execResult.chartSpec;
    const effectiveChartType = dto.chartType || dto.chartSpec?.chartType || execResult.chartSpec?.chartType || 'bar_vertical';

    const reportPayload: ReportPayload = {
      title: execResult.title,
      code: `QBE-${dto.entity.toUpperCase().slice(0, 3)}`,
      periodo: dto.prompt ? `Consulta: "${dto.prompt.slice(0, 65)}"` : 'Consulta Dinámica Personalizada',
      sucursalNombre: 'Alcance Autorizado',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators: execResult.indicators,
      columns: execResult.columns as any,
      rows: execResult.rows,
      chartData: execResult.chartData,
      chartSpec: effectiveChartSpec,
      chartType: effectiveChartType,
      chartImage: dto.chartImage,
      aiInsight: effectiveChartSpec?.aiInsight || execResult.chartSpec?.aiInsight,
    };

    const formato = dto.format || ExportFormat.EXCEL;
    const cleanDate = new Date().toISOString().split('T')[0];
    const baseName = `QBE_${dto.entity}_${cleanDate}`;

    if (formato === ExportFormat.CSV) {
      const buffer = await this.exporterService.exportToCsv(reportPayload);
      return { buffer, fileName: `${baseName}.csv`, mimeType: 'text/csv; charset=utf-8' };
    }

    if (formato === ExportFormat.PDF) {
      const buffer = await this.exporterService.exportToPdf(reportPayload);
      return { buffer, fileName: `${baseName}.pdf`, mimeType: 'application/pdf' };
    }

    // Default: Excel
    const buffer = await this.exporterService.exportToExcel(reportPayload);
    return {
      buffer,
      fileName: `${baseName}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  // ==========================================================================
  // EXTRACTORES DE DATOS TIPADOS
  // ==========================================================================

  private async fetchVentas(branchScope: number[] | null): Promise<Record<string, any>[]> {
    const where: any = {};
    if (branchScope && branchScope.length > 0) {
      where.OR = [
        {
          empleado: {
            empleado_sucursal: {
              some: { id_sucursal: { in: branchScope } },
            },
          },
        },
        { id_empleado: null },
      ];
    }

    const ventas = await this.prisma.venta.findMany({
      where,
      include: {
        empleado: {
          include: {
            empleado_sucursal: {
              include: { sucursal: { select: { nombre: true } } },
            },
          },
        },
        cliente: { select: { nombre: true, apellido: true } },
        pago: { select: { metodo_pago: true } },
      },
      orderBy: { fecha_venta: 'desc' },
      take: 10000,
    });

    return ventas.map((v) => {
      const sucursalName =
        v.empleado?.empleado_sucursal[0]?.sucursal?.nombre ||
        (v.tipo_venta === 'digital' ? 'Tienda Online' : 'Sucursal Central');

      return {
        id_venta: v.id_venta,
        codigo_factura: v.codigo_factura || `FAC-${v.id_venta}`,
        fecha_venta: v.fecha_venta.toISOString().split('T')[0],
        tipo_venta: v.tipo_venta,
        subtotal: Number(v.subtotal || 0),
        descuento: Number(v.descuento || 0),
        total: Number(v.total || 0),
        estado: v.estado,
        sucursal: sucursalName,
        cliente: v.cliente ? `${v.cliente.nombre} ${v.cliente.apellido}` : 'Consumidor Final',
        metodo_pago: v.pago[0]?.metodo_pago || 'No especificado',
      };
    });
  }

  private async fetchProductos(): Promise<Record<string, any>[]> {
    const productos = await this.prisma.producto.findMany({
      include: {
        categoria: { select: { nombre: true } },
        coleccion: {
          include: {
            temporada: { select: { nombre: true } },
          },
        },
        producto_variante: { select: { sku: true }, take: 1 },
      },
      orderBy: { nombre: 'asc' },
      take: 10000,
    });

    return productos.map((p) => ({
      id_producto: p.id_producto,
      nombre: p.nombre,
      sku: p.producto_variante[0]?.sku || `PRD-${p.id_producto}`,
      precio_base: Number(p.precio_base || 0),
      genero: p.genero || 'Unisex',
      categoria: p.categoria?.nombre || 'General',
      temporada: p.coleccion?.temporada?.nombre || 'Atemporal',
      estado: p.estado,
    }));
  }

  private async fetchInventario(branchScope: number[] | null): Promise<Record<string, any>[]> {
    const where: any = {};
    if (branchScope && branchScope.length > 0) {
      where.id_sucursal = { in: branchScope };
    }

    const inv = await this.prisma.inventario_sucursal.findMany({
      where,
      include: {
        sucursal: { select: { nombre: true } },
        producto_variante: {
          include: {
            producto: { select: { nombre: true, precio_base: true } },
            talla: { select: { codigo: true } },
            color: { select: { nombre: true } },
          },
        },
      },
      take: 10000,
    });

    return inv.map((i) => {
      const precio = Number(i.producto_variante.producto.precio_base || 0) + Number(i.producto_variante.precio_adicional || 0);
      const stock = i.stock_disponible;
      return {
        id_inventario: i.id_inventario_sucursal,
        sucursal: i.sucursal?.nombre || 'Sucursal',
        producto: i.producto_variante.producto.nombre,
        sku_variante: i.producto_variante.sku,
        talla: i.producto_variante.talla?.codigo || '-',
        color: i.producto_variante.color?.nombre || '-',
        stock_disponible: stock,
        stock_reservado: i.stock_reservado,
        stock_minimo: i.stock_minimo,
        valor_estimado: stock * precio,
      };
    });
  }

  private async fetchClientes(): Promise<Record<string, any>[]> {
    const clientes = await this.prisma.cliente.findMany({
      include: {
        usuario: { select: { email: true } },
      },
      take: 10000,
    });

    return clientes.map((c) => ({
      id_cliente: c.id_cliente,
      nombre_completo: `${c.nombre} ${c.apellido}`.trim(),
      ci: c.ci || 'Sin CI',
      email: c.usuario?.email || 'Sin correo',
      sexo: c.sexo || '-',
      puntos_fidelidad: c.puntos_fidelidad || 0,
    }));
  }

  private async fetchReservas(branchScope: number[] | null): Promise<Record<string, any>[]> {
    const where: any = {};
    if (branchScope && branchScope.length > 0) {
      where.id_sucursal = { in: branchScope };
    }

    const reservas = await this.prisma.reserva.findMany({
      where,
      include: {
        sucursal: { select: { nombre: true } },
        cliente: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha_reserva: 'desc' },
      take: 10000,
    });

    return reservas.map((r) => ({
      id_reserva: r.id_reserva,
      codigo: r.codigo,
      fecha_reserva: r.fecha_reserva.toISOString().split('T')[0],
      estado: r.estado,
      sucursal: r.sucursal?.nombre || 'Sucursal',
      cliente: r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : 'Cliente',
    }));
  }

  private async fetchMovimientos(branchScope: number[] | null): Promise<Record<string, any>[]> {
    const where: any = {};
    if (branchScope && branchScope.length > 0) {
      where.id_sucursal = { in: branchScope };
    }

    const movs = await this.prisma.movimiento_inventario.findMany({
      where,
      include: {
        sucursal: { select: { nombre: true } },
      },
      orderBy: { fecha: 'desc' },
      take: 10000,
    });

    return movs.map((m) => ({
      id_movimiento: m.id_movimiento_inventario,
      tipo_movimiento: m.tipo_movimiento,
      cantidad: m.cantidad,
      motivo: m.motivo || 'Operación ordinaria',
      fecha: m.fecha.toISOString().split('T')[0],
      sucursal: m.sucursal?.nombre || 'Sucursal',
    }));
  }

  // ==========================================================================
  // EVALUADOR SEGURO DE FILTROS Y COMPARACIONES
  // ==========================================================================

  private matchesFilter(record: Record<string, any>, filter: QbeFilterDto): boolean {
    const rawVal = record[filter.field];
    const targetVal = filter.value;

    if (rawVal === undefined || rawVal === null) {
      return false;
    }

    const normalize = (val: any) =>
      String(val ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const isDate = typeof rawVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawVal);

    switch (filter.operator) {
      case 'eq':
        return normalize(rawVal) === normalize(targetVal);
      case 'neq':
        return normalize(rawVal) !== normalize(targetVal);
      case 'contains':
        return normalize(rawVal).includes(normalize(targetVal));
      case 'startsWith':
        return normalize(rawVal).startsWith(normalize(targetVal));
      case 'in': {
        const list = Array.isArray(targetVal)
          ? targetVal.map(normalize)
          : String(targetVal).split(',').map(normalize);
        return list.includes(normalize(rawVal));
      }
      case 'notIn': {
        const list = Array.isArray(targetVal)
          ? targetVal.map(normalize)
          : String(targetVal).split(',').map(normalize);
        return !list.includes(normalize(rawVal));
      }
      case 'gt':
        if (isDate) return String(rawVal) > String(targetVal);
        return Number(rawVal) > Number(targetVal);
      case 'gte':
        if (isDate) return String(rawVal) >= String(targetVal);
        return Number(rawVal) >= Number(targetVal);
      case 'lt':
        if (isDate) return String(rawVal) < String(targetVal);
        return Number(rawVal) < Number(targetVal);
      case 'lte':
        if (isDate) return String(rawVal) <= String(targetVal);
        return Number(rawVal) <= Number(targetVal);
      case 'between': {
        const v1 = Number(targetVal);
        const v2 = Number(filter.value2);
        const cur = Number(rawVal);
        if (!isNaN(v1) && !isNaN(v2) && !isNaN(cur)) {
          return cur >= v1 && cur <= v2;
        }
        return String(rawVal) >= String(targetVal) && String(rawVal) <= String(filter.value2);
      }
      default:
        return true;
    }
  }

  // ==========================================================================
  // AGRUPACIÓN Y AGREGACIÓN
  // ==========================================================================

  private applyGrouping(
    records: Record<string, any>[],
    groupBy: string[],
    aggregations: QbeAggregationDto[],
    entityMeta: QbeEntityMeta,
  ) {
    const groupMap = new Map<string, Record<string, any>[]>();

    for (const rec of records) {
      const keyParts = groupBy.map((f) => String(rec[f] ?? 'Sin asignar'));
      const key = keyParts.join(' — ');
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(rec);
    }

    // Armar columnas resultantes: campos agrupados + agregaciones
    const columns: { key: string; label: string; type: string }[] = [];

    for (const gField of groupBy) {
      const fm = entityMeta.fields.find((f) => f.id === gField);
      columns.push({
        key: gField,
        label: fm ? fm.label : gField,
        type: fm ? fm.type : 'string',
      });
    }

    for (const agg of aggregations) {
      const fm = entityMeta.fields.find((f) => f.id === agg.field);
      const aggKey = `${agg.func.toLowerCase()}_${agg.field}`;
      columns.push({
        key: aggKey,
        label: agg.alias || `${agg.func} de ${fm?.label || agg.field}`,
        type: agg.func === 'COUNT' ? 'number' : fm?.type || 'number',
      });
    }

    const rows: Record<string, any>[] = [];
    const chartData: any[] = [];

    for (const [key, groupRows] of groupMap.entries()) {
      const rowItem: Record<string, any> = {};

      // Población de columnas de agrupación
      const first = groupRows[0];
      for (const gField of groupBy) {
        rowItem[gField] = first[gField] ?? 'Sin asignar';
      }

      // Cálculo de funciones agregadas
      for (const agg of aggregations) {
        const aggKey = `${agg.func.toLowerCase()}_${agg.field}`;
        const values = groupRows.map((r) => Number(r[agg.field]) || 0);

        let result = 0;
        if (agg.func === 'COUNT') {
          result = groupRows.length;
        } else if (agg.func === 'SUM') {
          result = values.reduce((a, b) => a + b, 0);
        } else if (agg.func === 'AVG') {
          result = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        } else if (agg.func === 'MAX') {
          result = values.length ? Math.max(...values) : 0;
        } else if (agg.func === 'MIN') {
          result = values.length ? Math.min(...values) : 0;
        }

        rowItem[aggKey] = Number(result.toFixed(2));
      }

      rows.push(rowItem);

      // Dato para gráfico
      const primaryAggKey = `${aggregations[0].func.toLowerCase()}_${aggregations[0].field}`;
      chartData.push({
        name: key,
        total: rowItem[primaryAggKey] || 0,
        count: groupRows.length,
      });
    }

    return { rows, columns, chartData };
  }

  // ==========================================================================
  // GENERADOR DE GRÁFICO AUTOMÁTICO
  // ==========================================================================

  private buildAutoChartData(rows: Record<string, any>[], columns: { key: string; label: string; type: string }[]): any[] {
    if (rows.length === 0) return [];

    const labelCol = columns.find((c) => c.type === 'string' || c.type === 'enum' || c.type === 'date') || columns[0];
    const numCol = columns.find((c) => c.type === 'currency' || c.type === 'number');

    if (!labelCol) return [];

    // Agrupar los primeros 10 para visualización
    const aggMap = new Map<string, number>();
    for (const r of rows) {
      const key = String(r[labelCol.key] ?? 'Otros');
      const val = numCol ? Number(r[numCol.key]) || 0 : 1;
      aggMap.set(key, (aggMap.get(key) || 0) + val);
    }

    return Array.from(aggMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }
}
