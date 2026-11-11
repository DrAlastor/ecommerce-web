import React from 'react';
import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react';
import type { TenantMonitoringItem } from '../../../types/saas.types';

interface NoisyNeighborBannerProps {
  tenantsWithAlerts: TenantMonitoringItem[];
  onIsolateTenant: (tenantKey: string) => void;
  onResetPool: (tenantKey: string) => void;
}

export const NoisyNeighborBanner: React.FC<NoisyNeighborBannerProps> = ({
  tenantsWithAlerts,
  onIsolateTenant,
  onResetPool,
}) => {
  if (tenantsWithAlerts.length === 0) return null;

  return (
    <div className="noisy-neighbor-container">
      <div className="noisy-header">
        <div className="noisy-title-wrap">
          <ShieldAlert size={20} className="text-amber" />
          <h4 className="noisy-title">Detección de Noisy Neighbor & Alertas de Infraestructura</h4>
        </div>
        <span className="noisy-badge">{tenantsWithAlerts.length} Eventos Detectados</span>
      </div>

      <div className="noisy-alerts-list">
        {tenantsWithAlerts.map((tenant) => (
          <div key={tenant.tenantKey} className="noisy-alert-item">
            <div className="noisy-alert-left">
              <span className="tenant-name-badge">{tenant.companyName} ({tenant.database.databaseName})</span>
              <p className="noisy-reason">{tenant.alert?.reason || 'Consumo anómalo de recursos detectado.'}</p>
            </div>

            <div className="noisy-actions">
              <button
                type="button"
                className="btn-noisy-action reset"
                onClick={() => onResetPool(tenant.tenantKey)}
                title="Reiniciar pool de conexiones Prisma"
              >
                <Zap size={13} />
                <span>Reiniciar Pool</span>
              </button>
              <button
                type="button"
                className="btn-noisy-action pause"
                onClick={() => onIsolateTenant(tenant.tenantKey)}
                title="Suspender temporalmente acceso para proteger el clúster"
              >
                <AlertTriangle size={13} />
                <span>{tenant.status === 'ACTIVO' ? 'Aislar / Suspender' : 'Reactivar'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

