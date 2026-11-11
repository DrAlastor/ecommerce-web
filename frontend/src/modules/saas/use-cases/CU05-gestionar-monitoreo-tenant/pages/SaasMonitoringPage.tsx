import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saasService } from '../../../services/saas.service';
import type { ClusterMonitoringOverview, TenantMonitoringItem } from '../../../types/saas.types';
import { ClusterHealthHeader } from '../components/ClusterHealthHeader';
import { NoisyNeighborBanner } from '../components/NoisyNeighborBanner';
import { TenantTelemetryCard } from '../components/TenantTelemetryCard';
import { OperationalActionsModal } from '../components/OperationalActionsModal';
import {
  Server,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import './SaasMonitoring.css';

export const SaasMonitoringPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedTenant = searchParams.get('tenant');

  const [overview, setOverview] = useState<ClusterMonitoringOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notificación operativa flotante
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Modal de ajuste de cuota
  const [selectedTenantForQuota, setSelectedTenantForQuota] = useState<TenantMonitoringItem | null>(null);

  const fetchOverview = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const data = await saasService.getMonitoringOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error al obtener telemetría del clúster.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const showToast = (type: 'success' | 'warning' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Acciones operativas
  const handlePing = async (tenantKey: string) => {
    try {
      const res = await saasService.pingTenant(tenantKey);
      if (res.success) {
        showToast('success', `Ping exitoso con ${tenantKey}_db. Latencia: ${res.latencyMs} ms.`);
      } else {
        showToast('error', res.message);
      }
      fetchOverview(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || err.message);
    }
  };

  const handleResetPool = async (tenantKey: string) => {
    try {
      const res = await saasService.resetTenantPool(tenantKey);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
      fetchOverview(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || err.message);
    }
  };

  const handlePurgeCache = async (tenantKey: string) => {
    try {
      const res = await saasService.purgeTenantCache(tenantKey);
      showToast('success', res.message);
      fetchOverview(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || err.message);
    }
  };

  const handleToggleStatus = async (tenantKey: string) => {
    try {
      const res = await saasService.toggleTenantStatus(tenantKey, 'Acción operativa de Super Admin');
      showToast('warning', res.message);
      fetchOverview(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || err.message);
    }
  };

  const handleSaveQuota = async (tenantKey: string, quotaMb: number, maxConns: number) => {
    try {
      const res = await saasService.updateTenantQuota(tenantKey, quotaMb, maxConns);
      showToast('success', res.message);
      fetchOverview(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || err.message);
    }
  };

  if (loading && !overview) {
    return (
      <div className="saas-loading-state">
        <div className="saas-spinner" />
        <div className="loading-text">
          <Server size={24} className="pulse-icon text-blue" />
          <span>Consultando pools de conexión en Azure PostgreSQL y métricas de telemetría...</span>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="saas-error-state">
        <AlertTriangle size={40} className="text-amber" />
        <h3>Fallo en Telemetría de Infraestructura</h3>
        <p>{error || 'No se pudo conectar a los agentes de monitoreo.'}</p>
        <button type="button" className="btn-retry" onClick={() => fetchOverview()}>
          Reintentar Telemetría
        </button>
      </div>
    );
  }

  // Filtrar o ordenar si hay un tenant destacado por query param
  const tenantsWithAlerts = overview.tenants.filter((t) => t.alert?.isNoisy);

  return (
    <div className="saas-monitoring-container">
      {/* Toast Flotante */}
      {toastMessage && (
        <div className={`saas-floating-toast ${toastMessage.type}`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : toastMessage.type === 'warning' ? (
            <AlertTriangle size={18} />
          ) : (
            <Info size={18} />
          )}
          <span>{toastMessage.text}</span>
          <button type="button" className="toast-close" onClick={() => setToastMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="saas-page-header">
        <div className="header-left">
          <button
            type="button"
            className="btn-back-dashboard"
            onClick={() => navigate('/saas-admin/dashboard')}
          >
            <ArrowLeft size={16} />
            <span>Volver a Dashboard SaaS</span>
          </button>
          <h1 className="saas-page-title">Supervisión & Monitoreo Técnico de Tenants</h1>
          <p className="saas-page-subtitle">
            Monitoreo en tiempo real de bases de datos físicas, pools de conexión Prisma, cuotas de almacenamiento y prevención de Noisy Neighbors.
          </p>
        </div>
      </div>

      {/* Resumen de Salud del Clúster */}
      <ClusterHealthHeader
        overview={overview}
        onRefresh={() => fetchOverview(true)}
        isRefreshing={isRefreshing}
      />

      {/* Banner de Alertas Noisy Neighbor */}
      <NoisyNeighborBanner
        tenantsWithAlerts={tenantsWithAlerts}
        onIsolateTenant={handleToggleStatus}
        onResetPool={handleResetPool}
      />

      {/* Grilla de Tarjetas de Telemetría por Inquilino */}
      <div className="telemetry-tenants-grid">
        {overview.tenants.map((tenant) => {
          const isHighlighted = highlightedTenant === tenant.tenantKey;
          return (
            <div
              key={tenant.tenantKey}
              className={`telemetry-item-wrapper ${isHighlighted ? 'highlighted-ring' : ''}`}
            >
              <TenantTelemetryCard
                tenant={tenant}
                onPing={handlePing}
                onResetPool={handleResetPool}
                onPurgeCache={handlePurgeCache}
                onToggleStatus={handleToggleStatus}
                onOpenQuotaModal={setSelectedTenantForQuota}
              />
            </div>
          );
        })}
      </div>

      {/* Modal de Ajuste de Cuota Operativa */}
      {selectedTenantForQuota && (
        <OperationalActionsModal
          tenant={selectedTenantForQuota}
          onClose={() => setSelectedTenantForQuota(null)}
          onSaveQuota={handleSaveQuota}
        />
      )}
    </div>
  );
};

