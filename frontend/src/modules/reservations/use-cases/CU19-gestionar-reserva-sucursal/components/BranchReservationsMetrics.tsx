import React from 'react';
import { Clock, PackageCheck, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import type { BranchReservationsMetrics } from '../types/branch-reservations.types';

interface BranchReservationsMetricsProps {
  metrics: BranchReservationsMetrics;
  selectedStatus: string;
  onStatusClick: (status: string) => void;
}

export const BranchReservationsMetricsCards: React.FC<BranchReservationsMetricsProps> = ({
  metrics,
  selectedStatus,
  onStatusClick,
}) => {
  return (
    <div className="branch-res-metrics-grid">
      <div
        className={`branch-metric-card pending ${selectedStatus === 'Pendiente' ? 'active' : ''}`}
        onClick={() => onStatusClick('Pendiente')}
      >
        <div className="metric-icon-wrap pending">
          <Clock size={20} />
        </div>
        <div className="metric-data">
          <span className="metric-val">{metrics.pendientes}</span>
          <span className="metric-title">Por Preparar</span>
        </div>
      </div>

      <div
        className={`branch-metric-card prepared ${selectedStatus === 'Preparada' ? 'active' : ''}`}
        onClick={() => onStatusClick('Preparada')}
      >
        <div className="metric-icon-wrap prepared">
          <PackageCheck size={20} />
        </div>
        <div className="metric-data">
          <span className="metric-val">{metrics.preparadas}</span>
          <span className="metric-title">Preparadas en Tienda</span>
        </div>
      </div>

      <div
        className={`branch-metric-card attended ${selectedStatus === 'Atendida' ? 'active' : ''}`}
        onClick={() => onStatusClick('Atendida')}
      >
        <div className="metric-icon-wrap attended">
          <UserCheck size={20} />
        </div>
        <div className="metric-data">
          <span className="metric-val">{metrics.atendidas}</span>
          <span className="metric-title">En Probador / Atendidas</span>
        </div>
      </div>

      <div
        className={`branch-metric-card completed ${selectedStatus === 'Completada' ? 'active' : ''}`}
        onClick={() => onStatusClick('Completada')}
      >
        <div className="metric-icon-wrap completed">
          <CheckCircle2 size={20} />
        </div>
        <div className="metric-data">
          <span className="metric-val">{metrics.completadas}</span>
          <span className="metric-title">Completadas (Venta)</span>
        </div>
      </div>

      <div
        className={`branch-metric-card cancelled ${selectedStatus === 'Cancelada' ? 'active' : ''}`}
        onClick={() => onStatusClick('Cancelada')}
      >
        <div className="metric-icon-wrap cancelled">
          <XCircle size={20} />
        </div>
        <div className="metric-data">
          <span className="metric-val">{metrics.canceladas}</span>
          <span className="metric-title">Canceladas / Liberadas</span>
        </div>
      </div>
    </div>
  );
};
