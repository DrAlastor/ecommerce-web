import { IsOptional, IsString } from 'class-validator';

export class SaasDashboardFilterDto {
  @IsOptional()
  @IsString()
  timeRange?: '30d' | '90d' | '12m' | 'all';

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

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
  period: string; // e.g., 'Sem 1', 'Sem 2', 'Ene', 'Feb'
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
  churnRiskScore: number; // 0 - 100
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

