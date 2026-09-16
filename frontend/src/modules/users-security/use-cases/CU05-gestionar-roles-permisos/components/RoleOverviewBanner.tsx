import React from 'react';
import type { RoleDetail } from '../services/roles.service';
import { Shield, ShieldAlert, Lock, Edit3, Eye } from 'lucide-react';

interface RoleOverviewBannerProps {
  roleDetail: RoleDetail;
  isSuperAdmin: boolean;
  currentMetrics: {
    totalEnabled: number;
    lecturaCount: number;
    edicionCount: number;
    totalSystemFunctions: number;
  };
}

export const RoleOverviewBanner: React.FC<RoleOverviewBannerProps> = ({
  roleDetail,
  isSuperAdmin,
  currentMetrics,
}) => {
  return (
    <div className="role-overview-card">
      <div className="role-overview-header">
        <div>
          <div className="role-badge-chip">
            <Shield size={14} />
            <span>Configurando permisos</span>
          </div>
          <h2>{roleDetail.nombre}</h2>
        </div>
        {isSuperAdmin && (
          <div className="admin-protected-badge">
            <Lock size={15} />
            <span>Rol del Sistema Protegido</span>
          </div>
        )}
      </div>

      {/* Banner de protección del administrador */}
      {isSuperAdmin && (
        <div className="admin-security-callout">
          <ShieldAlert size={18} />
          <div>
            <strong>Aviso de Seguridad de Acceso:</strong> El rol de Administrador
            conserva privilegios de administración críticos obligatorios. La función
            "Gestionar roles" no puede ser deshabilitada ni degradada para prevenir bloqueos.
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas de Permisos */}
      <div className="role-metrics-row">
        <div className="metric-box total">
          <span className="metric-label">Funciones Activas</span>
          <span className="metric-number">
            {currentMetrics.totalEnabled}{' '}
            <small>/ {currentMetrics.totalSystemFunctions}</small>
          </span>
        </div>
        <div className="metric-box edit">
          <span className="metric-label">
            <Edit3 size={14} /> Nivel Edición
          </span>
          <span className="metric-number">{currentMetrics.edicionCount}</span>
        </div>
        <div className="metric-box read">
          <span className="metric-label">
            <Eye size={14} /> Nivel Lectura
          </span>
          <span className="metric-number">{currentMetrics.lecturaCount}</span>
        </div>
      </div>
    </div>
  );
};
