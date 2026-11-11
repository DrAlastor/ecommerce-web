export interface ExecutiveKpiCard {
  title: string;
  value: string | number;
  numericValue: number;
  previousValue: number;
  trendPercentage: number;
  trendDirection: 'up' | 'down' | 'neutral';
  subtitle: string;
  badge?: string;
}

export interface RevenueTimeSeriesPoint {
  period: string;
  actualRevenue: number | null;
  predictedRevenue: number;
  lowerConfidence: number;
  upperConfidence: number;
  actualOrders: number;
}

export interface PlanDistributionPoint {
  planId: string;
  planName: string;
  tenantCount: number;
  monthlyRevenue: number;
  percentage: number;
  color: string;
}

export interface TenantPerformancePoint {
  tenantKey: string;
  companyName: string;
  planName: string;
  status: 'ACTIVO' | 'PRUEBA' | 'SUSPENDIDO';
  totalRevenue: number;
  totalOrders: number;
  productCount: number;
  customerCount: number;
  lastActivityDate: string;
  churnRiskScore: number;
  churnRiskLevel: 'Bajo' | 'Moderado' | 'Crítico';
  cluster: string;
}

export interface TenantCluster {
  clusterId: string;
  clusterName: string;
  description: string;
  badgeColor: string;
  tenantCount: number;
  averageMrr: number;
  tenants: Array<{
    tenantKey: string;
    companyName: string;
    planName: string;
    mrr: number;
    orders: number;
    churnRiskScore: number;
    churnRiskLevel: 'Bajo' | 'Moderado' | 'Crítico';
    recommendedAction: string;
  }>;
}

export interface MlPredictionModel {
  algorithm: string;
  rSquared: number;
  slope: number;
  intercept: number;
  projectedGrowthRate: number;
  confidenceLevel: string;
  interpretation: string;
  forecastPoints: RevenueTimeSeriesPoint[];
}

export interface GeographicDistributionPoint {
  region: string;
  country: string;
  tenantCount: number;
  totalRevenue: number;
}

export interface SaasDashboardMetricsResponse {
  summary: {
    totalTenants: ExecutiveKpiCard;
    mrr: ExecutiveKpiCard;
    arr: ExecutiveKpiCard;
    gmvConsolidated: ExecutiveKpiCard;
    retentionRate: ExecutiveKpiCard;
    churnRate: ExecutiveKpiCard;
  };
  timeSeries: RevenueTimeSeriesPoint[];
  mlModel: MlPredictionModel;
  plansDistribution: PlanDistributionPoint[];
  clusters: TenantCluster[];
  tenantsRanking: TenantPerformancePoint[];
  geographicDistribution: GeographicDistributionPoint[];
  lastUpdated: string;
}

export type TenantHealthStatus = 'healthy' | 'warning' | 'critical' | 'offline';

export interface DatabaseTelemetry {
  databaseName: string;
  sizeBytes: number;
  sizeMb: number;
  maxQuotaMb: number;
  quotaUsagePercentage: number;
  activeConnections: number;
  maxConnections: number;
  connectionUsagePercentage: number;
  latencyMs: number;
  tablesCount: number;
}

export interface StorageTelemetry {
  containerName: string;
  blobsCount: number;
  storageUsedMb: number;
  quotaMb: number;
  storageUsagePercentage: number;
}

export interface HttpTelemetry {
  requestsPerMinute: number;
  avgResponseTimeMs: number;
  errorRate4xxPercentage: number;
  errorRate5xxPercentage: number;
  totalRequests24h: number;
}

export interface NoisyNeighborAlert {
  isNoisy: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt?: string;
}

export interface TenantMonitoringItem {
  tenantKey: string;
  companyName: string;
  planName: string;
  status: 'ACTIVO' | 'PRUEBA' | 'SUSPENDIDO';
  health: TenantHealthStatus;
  database: DatabaseTelemetry;
  storage: StorageTelemetry;
  http: HttpTelemetry;
  alert?: NoisyNeighborAlert;
  lastSeen: string;
}

export interface ClusterMonitoringOverview {
  clusterStatus: 'healthy' | 'degraded' | 'critical';
  totalTenants: number;
  activeTenants: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  avgLatencyMs: number;
  totalActiveConnections: number;
  totalDatabaseStorageMb: number;
  activeAlertsCount: number;
  tenants: TenantMonitoringItem[];
  lastPolled: string;
}

export interface OperationalResult {
  success: boolean;
  action: string;
  tenantKey: string;
  timestamp: string;
  message: string;
  latencyMs?: number;
  details?: Record<string, any>;
}

export interface EnrichedTenantDetails {
  codigo_empresa: string;
  nombre_comercial: string;
  razon_social: string;
  nit: string;
  email: string;
  telefono: string;
  ciudad_nombre: string;
  direccion: string;
  pais: string;
  estado: 'ACTIVO' | 'PRUEBA' | 'SUSPENDIDO';
  planId: string;
  planName: string;
  monthlyFeeUSD: number;
  databaseName: string;
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
  lastModified: string;
}

export interface UpdateTenantDataPayload {
  nombre_comercial: string;
  razon_social: string;
  nit?: string;
  email: string;
  telefono?: string;
  ciudad_nombre?: string;
  direccion?: string;
  planId?: string;
  planName?: string;
  estado?: 'ACTIVO' | 'PRUEBA' | 'SUSPENDIDO';
  adminPassword?: string;
}

export interface SaasBitacoraItem {
  id: number | string;
  accion: string;
  fecha_hora: string;
  entidad_afectada: string;
  ip?: string | null;
  usuario_id: number;
  usuario_email: string;
  tenantKey: string;
  tenantName: string;
}

export interface SaasBackupItem {
  id: string;
  tenantKey: string;
  tenantName: string;
  databaseName: string;
  nombre_archivo: string;
  tamano_bytes: number;
  tamano_formateado: string;
  tipo_backup: 'COMPLETO' | 'BAJO_DEMANDA' | 'AUTOMATICO';
  estado: 'DISPONIBLE' | 'RESTAURADO' | 'FALLIDO';
  checksum_sha256: string;
  fecha_creacion: string;
  solicitado_por: string;
  total_tablas: number;
  total_registros: number;
}

export interface SaasSuperAdminUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rolGlobal: 'SUPER_ADMIN';
  activo: boolean;
}

export interface SaasPlanItem {
  id: number;
  codigo: string;
  nombre: string;
  tipo_plan: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual: number;
  moneda: string;
  duracion_prueba_dias: number;
  requiere_pago: boolean;
  limite_usuarios: number;
  limite_sucursales: number;
  limite_almacenes: number;
  limite_productos: number;
  permite_offline: boolean;
  permite_ia_reportes: boolean;
  permite_ml_analytics: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
  activo: boolean;
}

export interface CreatePlanPayload {
  codigo: string;
  nombre: string;
  tipo_plan: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual: number;
  moneda?: string;
  duracion_prueba_dias?: number;
  requiere_pago?: boolean;
  limite_usuarios?: number;
  limite_sucursales?: number;
  limite_almacenes?: number;
  limite_productos?: number;
  permite_offline?: boolean;
  permite_ia_reportes?: boolean;
  permite_ml_analytics?: boolean;
  activo?: boolean;
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

