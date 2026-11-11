import React from 'react';
import {
  Server,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import type { ClusterMonitoringOverview } from '../../../types/saas.types';

interface ClusterHealthHeaderProps {
  overview: ClusterMonitoringOverview;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ClusterHealthHeader: React.FC<ClusterHealthHeaderProps> = ({
  overview,
  onRefresh,
  isRefreshing,
}) => {
  const isHealthy = overview.clusterStatus === 'healthy';
  const isWarning = overview.clusterStatus === 'degraded';

  return (
    <div className="cluster-health-container">
      <div className="cluster-health-top">
        <div className="cluster-status-summary">
          <div
            className={`cluster-status-badge ${
              isHealthy ? 'healthy' : isWarning ? 'warning' : 'critical'
            }`}
          >
            {isHealthy ? (
              <CheckCircle2 size={18} />
            ) : isWarning ? (
              <Activity size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
            <span>
              ESTADO DEL CLÚSTER:{' '}
              {isHealthy ? '100% OPERATIVO' : isWarning ? 'RENDIMIENTO DEGRADADO' : 'ALERTA CRÍTICA'}
            </span>
          </div>
          <span className="cluster-subtitle">
            Azure PostgreSQL Flexible Server · Región Chile Central · Multi-Database Isolation
          </span>
        </div>

        <button
          type="button"
          className="btn-refresh-telemetry"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
          <span>{isRefreshing ? 'Consultando...' : 'Escanear Clúster'}</span>
        </button>
      </div>

      <div className="cluster-metrics-grid">
        <div className="cluster-metric-box">
          <div className="box-icon blue">
            <Server size={20} />
          </div>
          <div className="box-content">
            <span className="box-label">Inquilinos Monitoreados</span>
            <span className="box-val">{overview.totalTenants}</span>
            <span className="box-sub">
              {overview.healthyCount} Óptimos · {overview.warningCount} Advertencia · {overview.offlineCount} Pausa
            </span>
          </div>
        </div>

        <div className="cluster-metric-box">
          <div className="box-icon emerald">
            <Activity size={20} />
          </div>
          <div className="box-content">
            <span className="box-label">Latencia Media de Base de Datos</span>
            <span className="box-val">{overview.avgLatencyMs} ms</span>
            <span className="box-sub">Respuesta round-trip instantánea</span>
          </div>
        </div>

        <div className="cluster-metric-box">
          <div className="box-icon purple">
            <Database size={20} />
          </div>
          <div className="box-content">
            <span className="box-label">Conexiones Activas en Pool</span>
            <span className="box-val">{overview.totalActiveConnections} activas</span>
            <span className="box-sub">Pool dinámico en PrismaService</span>
          </div>
        </div>

        <div className="cluster-metric-box">
          <div className="box-icon amber">
            <HardDrive size={20} />
          </div>
          <div className="box-content">
            <span className="box-label">Almacenamiento Físico BD</span>
            <span className="box-val">{overview.totalDatabaseStorageMb} MB</span>
            <span className="box-sub">Total en esquemas dedicados</span>
          </div>
        </div>
      </div>
    </div>
  );
};

