/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Entity/DTO — Frontend web
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import React from 'react';

export type TabType = 'dashboard' | 'reports' | 'qbe' | 'voz' | 'ml';

export interface RoleDashboardData {
  role: 'admin' | 'manager' | 'cashier' | 'customer';
  roleName: string;
  userName: string;
  branchName?: string;
  admin?: {
    kpis: {
      totalIngresosNetos: number;
      margenBrutoEstimado: number;
      ticketPromedioNacional: number;
      inventarioValorizado: number;
    };
    charts: {
      evolucionIngresos: { fecha: string; total: number; ventas: number }[];
      rankingSucursales: { sucursal: string; total: number; porcentaje: number }[];
      topCategorias: { categoria: string; total: number; unidades: number }[];
    };
    executiveAlerts: {
      tipo: 'stock' | 'devoluciones' | 'rendimiento';
      mensaje: string;
      sucursal?: string;
    }[];
  };
  manager?: {
    kpis: {
      ventasHoy: number;
      transaccionesHoy: number;
      reservasPendientes: number;
      quiebresStock: number;
    };
    charts: {
      ventasPorVendedor: { vendedor: string; total: number; transacciones: number }[];
      ventasPorHoras: { hora: string; transacciones: number; total: number }[];
    };
    tables: {
      reservasHoy: {
        id_reserva: number;
        codigo: string;
        cliente: string;
        telefono: string;
        prendas: string;
        total: number;
        estado: string;
        fecha_limite: string;
      }[];
      stockCriticoLocal: {
        id_inventario: number;
        producto: string;
        variante: string;
        stock_disponible: number;
        stock_minimo: number;
        sucursalSugerida?: string;
      }[];
    };
  };
  cashier?: {
    kpis: {
      totalCobradoTurno: number;
      efectivoGaveta: number;
      cobrosDigitales: number;
      comprobantesEmitidos: number;
    };
    charts: {
      metodosPagoTurno: { metodo: string; total: number; cantidad: number }[];
    };
    tables: {
      ultimosCobros: {
        id_venta: number;
        codigo: string;
        hora: string;
        cliente: string;
        monto: number;
        metodo: string;
        estado: string;
      }[];
      reservasListasParaCobro: {
        id_reserva: number;
        cliente: string;
        codigo: string;
        total: number;
        prendas: string;
      }[];
    };
  };
  customer?: {
    kpis: {
      pedidosActivos: number;
      reservasListasRetiro: number;
      puntosFidelidad: number;
      cuponesDisponibles: number;
    };
    tables: {
      misPedidosRecientes: {
        id_venta: number;
        codigo: string;
        fecha: string;
        total: number;
        estado: string;
        trackingStep: number;
      }[];
      misReservasActivas: {
        id_reserva: number;
        codigo: string;
        sucursal: string;
        direccion: string;
        fecha_limite: string;
        total: number;
        estado: string;
        qrCodeValue: string;
      }[];
      cupones: {
        id_promocion: number;
        nombre: string;
        descuento: string;
        tipo: string;
      }[];
    };
  };
}

export interface DashboardMetrics {
  periodo: string;
  sucursalNombre: string;
  roleDashboard?: RoleDashboardData;
  kpis: {
    totalVentas: number;
    totalIngresos: number;
    totalDescuentos: number;
    totalUnidadesVendidas: number;
    ticketPromedio: number;
    totalReservas: number;
    reservasPendientes: number;
    productosBajoStock: number;
    productosAgotados: number;
    totalDevoluciones: number;
    sucursalesActivas: number;
  };
  charts: {
    ventasPorPeriodo: { fecha: string; total: number; ventas: number }[];
    ventasPorCanal: { canal: string; total: number; cantidad: number }[];
    ventasPorSucursal: { sucursal: string; total: number; cantidad: number }[];
    productosMasVendidos: { nombre: string; unidades: number; total: number }[];
  };
  criticalInventory: {
    id_inventario: number;
    producto: string;
    sku: string;
    variante: string;
    sucursal: string;
    stock_disponible: number;
    stock_minimo: number;
    estado: string;
  }[];
  recentActivity: {
    id_venta: number;
    codigo: string;
    fecha: string;
    tipo: string;
    total: number;
    estado: string;
  }[];
  authorizedBranches: {
    id_sucursal: number;
    nombre: string;
    ciudad?: { nombre: string };
  }[];
  isAdmin: boolean;
}

export interface ReportColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date';
}

export interface ReportIndicator {
  label: string;
  value: string | number;
  suffix?: string;
  description?: string;
}

export interface ReportData {
  title: string;
  code: string;
  periodo: string;
  sucursalNombre: string;
  generatedBy: string;
  generatedAt: string;
  indicators: ReportIndicator[];
  columns: ReportColumn[];
  rows: Record<string, any>[];
  chartData?: any;
}

export interface ReportFilters {
  tipo_reporte: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  id_sucursal?: number | string;
  categoria_id?: number | string;
  tipo_venta?: string;
  estado?: string;
}

export interface ReportMeta {
  id: string;
  name: string;
  category: 'financiero' | 'comercial' | 'inventario' | 'clientes';
  description: string;
  icon: React.ReactNode;
  code?: string;
}

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

export interface QbeMetadata {
  entities: QbeEntityMeta[];
  operators: Record<string, { id: string; label: string }[]>;
  aggregationFunctions: { id: string; label: string }[];
}

export interface QbeFilter {
  field: string;
  operator: string;
  value: any;
  value2?: any;
}

export interface QbeAggregation {
  field: string;
  func: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  alias?: string;
}

export type QbeChartType =
  | 'bar_vertical'
  | 'bar_horizontal'
  | 'peak_area'
  | 'line_temporal'
  | 'donut_percentage'
  | 'pie'
  | 'bar';

export interface QbeChartSeriesMeta {
  key: string;
  label: string;
  color?: string;
}

export interface QbeChartSpec {
  chartType: QbeChartType;
  title: string;
  subtitle?: string;
  xAxisKey: string;
  xAxisLabel: string;
  yAxisKey: string;
  yAxisLabel: string;
  unit?: string;
  aiInsight?: string;
  series?: QbeChartSeriesMeta[];
}

export interface QbeQueryPayload {
  entity: string;
  fields?: string[];
  filters?: QbeFilter[];
  groupBy?: string[];
  aggregations?: QbeAggregation[];
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  page?: number;
  filterLogic?: 'AND' | 'OR';
  prompt?: string;
  chartType?: QbeChartType;
  chartSpec?: QbeChartSpec;
  chartImage?: string;
}

export interface QbeQueryResult {
  title: string;
  entity: string;
  entityName: string;
  generatedAt: string;
  generatedBy: string;
  totalCount: number;
  page: number;
  limit: number;
  columns: { key: string; label: string; type: string }[];
  rows: Record<string, any>[];
  allRowsCount: number;
  indicators: ReportIndicator[];
  chartSuggestion: 'bar' | 'pie' | 'line';
  chartSpec?: QbeChartSpec;
  chartData: {
    name: string;
    total: number;
    count?: number;
    percentage?: number;
    formattedTotal?: string;
    [key: string]: any;
  }[];
}

export interface InterpretedQbeResponse {
  interpreted: boolean;
  explanation: string;
  suggestedPayload: QbeQueryPayload;
  chartSpec?: QbeChartSpec;
  detectedKeywords: {
    entityFound: string;
    metricsFound: string[];
    filtersFound: string[];
    groupByFound?: string[];
  };
}

export interface AiReportAnalysis {
  executiveSummary: string;
  keyInsights: string[];
  alerts: string[];
  recommendations: string[];
  generatedAt: string;
  engine: 'gemini-3.5-flash' | 'local-heuristic';
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  keyMetrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  queryResult?: {
    entity: string;
    entityName: string;
    totalCount: number;
    columns: { key: string; label: string }[];
    rows: Record<string, any>[];
  };
  suggestedAction?: {
    type: 'run_qbe' | 'navigate_report' | 'export';
    label: string;
    payload?: QbeQueryPayload;
    reportId?: string;
  };
}

export interface AiChatResponse {
  reply: string;
  suggestedAction?: {
    type: 'run_qbe' | 'navigate_report' | 'export';
    label: string;
    payload?: QbeQueryPayload;
    reportId?: string;
  };
  keyMetrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  queryResult?: {
    entity: string;
    entityName: string;
    totalCount: number;
    columns: { key: string; label: string }[];
    rows: Record<string, any>[];
  };
  engine: 'gemini-3.5-flash' | 'local-heuristic';
}

export interface ExecutiveVerdict {
  status: 'OPTIMO' | 'BUENO' | 'ALERTA_OPERATIVA' | 'CRITICO';
  statusLabel: string;
  verdictTitle: string;
  summary: string;
  scorePercent: number;
  highlightMetric: {
    label: string;
    value: string;
    description: string;
  };
  keyDecisions: string[];
}

export interface DemandPredictionResult {
  executiveVerdict: ExecutiveVerdict;
  historicalWeeks: {
    weekLabel: string;
    actualUnits: number;
    actualRevenue: number;
  }[];
  forecastWeeks: {
    weekLabel: string;
    predictedUnits: number;
    confidenceLower: number;
    confidenceUpper: number;
    predictedRevenue: number;
  }[];
  modelMetrics: {
    modelType: string;
    epochsTrained: number;
    mseLoss: number;
    rmse: number;
    r2Score: number;
    trainingSamples: number;
  };
  replenishmentAlerts: {
    id_producto: number;
    productoNombre: string;
    sku: string;
    sucursalNombre: string;
    stockActual: number;
    stockMinimo: number;
    demandaDiariaEstimada: number;
    diasCobertura: number;
    urgencia: 'CRITICO' | 'RECOMENDADO' | 'OPTIMO' | 'SOBRESTOCK';
    unidadesSugeridasReorden: number;
  }[];
}

export interface RfmClusterResult {
  executiveVerdict: ExecutiveVerdict;
  summary: {
    totalClientsAnalyzed: number;
    silhouetteScore: number;
    inertia: number;
  };
  clusters: {
    clusterId: number;
    label: string;
    description: string;
    color: string;
    clientCount: number;
    percentage: number;
    centroid: {
      recencyDays: number;
      frequencyCount: number;
      monetaryTotal: number;
    };
    strategicAction: string;
  }[];
  clientSegments: {
    id_cliente: number;
    nombreCompleto: string;
    email: string;
    telefono: string;
    recencyDays: number;
    frequencyCount: number;
    monetaryTotal: number;
    clusterId: number;
    clusterLabel: string;
    puntosFidelidad: number;
  }[];
  churnRiskClients: {
    id_cliente: number;
    nombreCompleto: string;
    email: string;
    telefono: string;
    diasSinCompra: number;
    gastoHistorico: number;
    comprasTotales: number;
    accionRecomendada: string;
  }[];
}

export interface MonteCarloScenarioResult {
  executiveVerdict: ExecutiveVerdict;
  parameters: {
    horizonDays: number;
    growthRatePercent: number;
    simulationsCount: number;
    dailyLambdaTransactions: number;
    averageTicketMean: number;
    averageTicketStdDev: number;
  };
  scenarios: {
    conservativeP10: {
      label: string;
      totalRevenue: number;
      grossMarginEstimated: number;
      projectedTransactions: number;
      description: string;
      strategicAdvice: string;
    };
    baseP50: {
      label: string;
      totalRevenue: number;
      grossMarginEstimated: number;
      projectedTransactions: number;
      description: string;
      strategicAdvice: string;
    };
    optimisticP90: {
      label: string;
      totalRevenue: number;
      grossMarginEstimated: number;
      projectedTransactions: number;
      description: string;
      strategicAdvice: string;
    };
  };
  densityCurvePoints: {
    revenue: number;
    density: number;
    isP10?: boolean;
    isP50?: boolean;
    isP90?: boolean;
  }[];
}


