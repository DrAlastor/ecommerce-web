import React, { useState } from 'react';
import {
  Database,
  Server,
  Cloud,
  Activity,
  RefreshCw,
  Zap,
  Play,
  Pause,
  Sliders,
  Radio,
} from 'lucide-react';
import type { TenantMonitoringItem } from '../../../types/saas.types';

interface TenantTelemetryCardProps {
  tenant: TenantMonitoringItem;
  onPing: (tenantKey: string) => Promise<void>;
  onResetPool: (tenantKey: string) => Promise<void>;
  onPurgeCache: (tenantKey: string) => Promise<void>;
  onToggleStatus: (tenantKey: string) => Promise<void>;
  onOpenQuotaModal: (tenant: TenantMonitoringItem) => void;
}

export const TenantTelemetryCard: React.FC<TenantTelemetryCardProps> = ({
  tenant,
  onPing,
  onResetPool,
  onPurgeCache,
  onToggleStatus,
  onOpenQuotaModal,
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handlePing = async () => {
    setIsPinging(true);
    try {
      await onPing(tenant.tenantKey);
    } finally {
      setIsPinging(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onResetPool(tenant.tenantKey);
    } finally {
      setIsResetting(false);
    }
  };

  const handlePurge = async () => {
    setIsPurging(true);
    try {
      await onPurgeCache(tenant.tenantKey);
    } finally {
      setIsPurging(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggleStatus(tenant.tenantKey);
    } finally {
      setIsToggling(false);
    }
  };

  const healthClass =
    tenant.health === 'healthy'
      ? 'status-healthy'
      : tenant.health === 'warning'
      ? 'status-warning'
      : tenant.health === 'critical'
      ? 'status-critical'
      : 'status-offline';

  const healthText =
    tenant.health === 'healthy'
      ? 'Saludable'
      : tenant.health === 'warning'
      ? 'Advertencia'
      : tenant.health === 'critical'
      ? 'Crítico'
      : 'Pausa / Desconectado';

  const isSuspended = tenant.status === 'SUSPENDIDO';

  return (
    <div className={`tenant-telemetry-card ${healthClass} ${isSuspended ? 'is-suspended' : ''}`}>
      {/* Encabezado del Tenant */}
      <div className="telemetry-card-header">
        <div className="telemetry-header-info">
          <div className="company-title-row">
            <h3 className="telemetry-company-name">{tenant.companyName}</h3>
            <span className="telemetry-slug">/{tenant.tenantKey}</span>
          </div>
          <span className="telemetry-plan-tag">{tenant.planName}</span>
        </div>

        <div className="telemetry-status-pill-wrap">
          <span className={`telemetry-health-pill ${healthClass}`}>
            <span className="pulse-dot" />
            {healthText}
          </span>
          {isSuspended && <span className="suspended-badge">EN PAUSA</span>}
        </div>
      </div>

      {/* Bloque de Telemetría Técnica: Base de Datos Física */}
      <div className="telemetry-section-box">
        <div className="section-box-header">
          <div className="box-header-title">
            <Database size={15} className="text-blue" />
            <span>Base de Datos Física Dedicada:</span>
            <code className="db-code">{tenant.database.databaseName}</code>
          </div>
          <span className="live-ping-badge">
            <Radio size={12} className="spin-slow" />
            {tenant.database.latencyMs} ms
          </span>
        </div>

        {/* Barra de Consumo de Base de Datos */}
        <div className="telemetry-bar-group">
          <div className="bar-labels">
            <span>Uso de Cuota en Disco:</span>
            <strong>
              {tenant.database.sizeMb} MB / {tenant.database.maxQuotaMb} MB ({tenant.database.quotaUsagePercentage}%)
            </strong>
          </div>
          <div className="metric-progress-track">
            <div
              className={`metric-progress-fill ${
                tenant.database.quotaUsagePercentage > 85
                  ? 'fill-red'
                  : tenant.database.quotaUsagePercentage > 60
                  ? 'fill-yellow'
                  : 'fill-blue'
              }`}
              style={{ width: `${Math.min(100, tenant.database.quotaUsagePercentage)}%` }}
            />
          </div>
        </div>

        {/* Conexiones en Pool */}
        <div className="telemetry-bar-group">
          <div className="bar-labels">
            <span>Pool de Conexiones Prisma:</span>
            <strong>
              {tenant.database.activeConnections} / {tenant.database.maxConnections} activas ({tenant.database.connectionUsagePercentage}%)
            </strong>
          </div>
          <div className="metric-progress-track">
            <div
              className={`metric-progress-fill ${
                tenant.database.connectionUsagePercentage > 80 ? 'fill-red' : 'fill-emerald'
              }`}
              style={{ width: `${Math.min(100, tenant.database.connectionUsagePercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bloque de Almacenamiento & HTTP */}
      <div className="telemetry-subgrid">
        {/* Azure Blob Storage */}
        <div className="subgrid-card">
          <div className="subgrid-header">
            <Cloud size={14} className="text-sky" />
            <span>Azure Blob Storage</span>
          </div>
          <div className="subgrid-stats">
            <div className="sub-stat-row">
              <span className="sub-lbl">Contenedor:</span>
              <strong className="sub-val">{tenant.storage.containerName}</strong>
            </div>
            <div className="sub-stat-row">
              <span className="sub-lbl">Archivos Media:</span>
              <strong className="sub-val">{tenant.storage.blobsCount} blobs</strong>
            </div>
            <div className="sub-stat-row">
              <span className="sub-lbl">Consumo:</span>
              <strong className="sub-val">{tenant.storage.storageUsedMb} MB</strong>
            </div>
          </div>
        </div>

        {/* Tráfico & HTTP */}
        <div className="subgrid-card">
          <div className="subgrid-header">
            <Activity size={14} className="text-indigo" />
            <span>Tráfico HTTP & SLA</span>
          </div>
          <div className="subgrid-stats">
            <div className="sub-stat-row">
              <span className="sub-lbl">Peticiones / Min:</span>
              <strong className="sub-val">{tenant.http.requestsPerMinute} RPM</strong>
            </div>
            <div className="sub-stat-row">
              <span className="sub-lbl">Tiempo Respuesta:</span>
              <strong className="sub-val">{tenant.http.avgResponseTimeMs} ms</strong>
            </div>
            <div className="sub-stat-row">
              <span className="sub-lbl">Tasa Errores 5xx:</span>
              <strong className="sub-val text-emerald">{tenant.http.errorRate5xxPercentage}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Consola de Acciones Operativas en Vivo */}
      <div className="telemetry-actions-bar">
        <button
          type="button"
          className="btn-op-action ping"
          onClick={handlePing}
          disabled={isPinging}
          title="Medir latencia en vivo ejecutando SELECT 1"
        >
          <RefreshCw size={14} className={isPinging ? 'spin' : ''} />
          <span>{isPinging ? 'Pinging...' : 'Test Ping'}</span>
        </button>

        <button
          type="button"
          className="btn-op-action purge"
          onClick={handlePurge}
          disabled={isPurging}
          title="Purgar memoria caché de buffers del inquilino"
        >
          <Zap size={14} />
          <span>{isPurging ? 'Purgando...' : 'Purgar Caché'}</span>
        </button>

        <button
          type="button"
          className="btn-op-action reset"
          onClick={handleReset}
          disabled={isResetting}
          title="Reiniciar pool de conexiones Prisma hacia Azure PostgreSQL"
        >
          <Server size={14} />
          <span>{isResetting ? 'Reiniciando...' : 'Reset Pool'}</span>
        </button>

        <button
          type="button"
          className="btn-op-action quota"
          onClick={() => onOpenQuotaModal(tenant)}
          title="Ajustar límites de cuota de almacenamiento y conexiones"
        >
          <Sliders size={14} />
          <span>Ajustar Cuota</span>
        </button>

        <button
          type="button"
          className={`btn-op-action toggle ${isSuspended ? 'resume' : 'suspend'}`}
          onClick={handleToggle}
          disabled={isToggling}
          title={isSuspended ? 'Reactivar tienda y accesos' : 'Pausar tienda temporalmente por sobreconsumo o mantenimiento'}
        >
          {isSuspended ? <Play size={14} /> : <Pause size={14} />}
          <span>{isSuspended ? 'Reanudar' : 'Pausar'}</span>
        </button>
      </div>
    </div>
  );
};

