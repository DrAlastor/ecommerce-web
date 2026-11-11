import React, { useState } from 'react';
import { Sliders, X, Check, Database, Server } from 'lucide-react';
import type { TenantMonitoringItem } from '../../../types/saas.types';

interface OperationalActionsModalProps {
  tenant: TenantMonitoringItem | null;
  onClose: () => void;
  onSaveQuota: (tenantKey: string, quotaMb: number, maxConns: number) => Promise<void>;
}

export const OperationalActionsModal: React.FC<OperationalActionsModalProps> = ({
  tenant,
  onClose,
  onSaveQuota,
}) => {
  if (!tenant) return null;

  const [quotaMb, setQuotaMb] = useState(tenant.database.maxQuotaMb);
  const [maxConns, setMaxConns] = useState(tenant.database.maxConnections);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveQuota(tenant.tenantKey, Number(quotaMb), Number(maxConns));
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop-saas">
      <div className="modal-content-saas">
        <div className="modal-header-saas">
          <div className="modal-title-wrap">
            <Sliders size={20} className="text-indigo" />
            <h3 className="modal-title">Ajuste de Cuota & Capacidad de Infraestructura</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-saas">
          <div className="modal-info-box">
            <span className="info-company">{tenant.companyName}</span>
            <span className="info-meta">
              Base física: <code>{tenant.database.databaseName}</code> · Plan: {tenant.planName}
            </span>
          </div>

          <div className="form-group-saas">
            <label className="form-label-saas">
              <Database size={15} />
              <span>Límite de Almacenamiento Máximo en Disco (MB):</span>
            </label>
            <input
              type="number"
              min="100"
              max="50000"
              step="100"
              value={quotaMb}
              onChange={(e) => setQuotaMb(Number(e.target.value))}
              className="form-input-saas"
              required
            />
            <span className="form-help">
              Uso actual en disco: {tenant.database.sizeMb} MB ({((tenant.database.sizeMb / quotaMb) * 100).toFixed(1)}% del nuevo límite).
            </span>
          </div>

          <div className="form-group-saas">
            <label className="form-label-saas">
              <Server size={15} />
              <span>Conexiones Simultáneas Máximas en Pool:</span>
            </label>
            <input
              type="number"
              min="10"
              max="200"
              step="5"
              value={maxConns}
              onChange={(e) => setMaxConns(Number(e.target.value))}
              className="form-input-saas"
              required
            />
            <span className="form-help">
              Conexiones activas actuales en pool: {tenant.database.activeConnections}.
            </span>
          </div>

          <div className="modal-actions-saas">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-modal-save" disabled={isSaving}>
              <Check size={16} />
              <span>{isSaving ? 'Guardando...' : 'Aplicar Nueva Cuota'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

