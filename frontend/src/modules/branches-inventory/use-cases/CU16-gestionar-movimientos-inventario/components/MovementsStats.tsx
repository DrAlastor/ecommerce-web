import React from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import type { MovementStats } from '../types/movements.types';

interface MovementsStatsProps {
  stats: MovementStats;
}

export const MovementsStats: React.FC<MovementsStatsProps> = ({ stats }) => {
  return (
    <div className="movements-stats-grid">
      <div className="movement-stat-card">
        <div className="stat-card-icon icon-total">
          <ArrowLeftRight size={22} />
        </div>
        <div className="stat-card-info">
          <span className="stat-card-label">Total Movimientos</span>
          <h3 className="stat-card-value">{stats.total_movimientos.toLocaleString()}</h3>
          <span className="stat-card-hint">Histórico en sucursales</span>
        </div>
      </div>

      <div className="movement-stat-card">
        <div className="stat-card-icon icon-in">
          <ArrowDownLeft size={22} />
        </div>
        <div className="stat-card-info">
          <span className="stat-card-label">Unidades Ingresadas</span>
          <h3 className="stat-card-value text-emerald">
            +{stats.unidades_ingresadas.toLocaleString()}
          </h3>
          <span className="stat-card-hint">Entradas y reposiciones</span>
        </div>
      </div>

      <div className="movement-stat-card">
        <div className="stat-card-icon icon-out">
          <ArrowUpRight size={22} />
        </div>
        <div className="stat-card-info">
          <span className="stat-card-label">Unidades Egresadas</span>
          <h3 className="stat-card-value text-rose">
            -{stats.unidades_egresadas.toLocaleString()}
          </h3>
          <span className="stat-card-hint">Salidas por venta y bajas</span>
        </div>
      </div>

      <div className="movement-stat-card">
        <div className="stat-card-icon icon-adjust">
          <RefreshCw size={22} />
        </div>
        <div className="stat-card-info">
          <span className="stat-card-label">Ajustes y Devoluciones</span>
          <h3 className="stat-card-value text-amber">
            {(stats.unidades_ajustes + stats.unidades_devoluciones).toLocaleString()}
          </h3>
          <span className="stat-card-hint">
            {stats.unidades_devoluciones} devoluciones / {stats.unidades_ajustes} ajustes
          </span>
        </div>
      </div>
    </div>
  );
};
