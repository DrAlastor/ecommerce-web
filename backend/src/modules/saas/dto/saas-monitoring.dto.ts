import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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

export class UpdateTenantQuotaDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(50)
  quotaStorageMb!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(5)
  maxConnections!: number;
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

