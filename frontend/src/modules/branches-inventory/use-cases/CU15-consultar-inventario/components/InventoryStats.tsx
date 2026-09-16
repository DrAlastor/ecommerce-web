import React from 'react';
import { Package, Clock, AlertTriangle, XCircle } from 'lucide-react';
import type { InventoryStats as StatsType } from '../types/inventory.types';

interface InventoryStatsProps {
  stats: StatsType;
  loading: boolean;
}

export const InventoryStats: React.FC<InventoryStatsProps> = React.memo(({ stats, loading }) => {
  return (
    <div className="inventory-stats-grid">
      {/* 1. Total Stock Disponible */}
      <div className="inv-stat-card">
        <div className="inv-stat-icon available">
          <Package size={22} />
        </div>
        <div className="inv-stat-info">
          <span className="inv-stat-label">Stock Disponible (Venta/Reserva)</span>
          <h3 className="inv-stat-value">
            {loading ? '...' : stats.total_disponible.toLocaleString()}
          </h3>
          <span className="inv-stat-hint">Unidades libres en sucursales</span>
        </div>
      </div>

      {/* 2. Total Stock Reservado */}
      <div className="inv-stat-card">
        <div className="inv-stat-icon reserved">
          <Clock size={22} />
        </div>
        <div className="inv-stat-info">
          <span className="inv-stat-label">Stock Reservado</span>
          <h3 className="inv-stat-value">
            {loading ? '...' : stats.total_reservado.toLocaleString()}
          </h3>
          <span className="inv-stat-hint">Comprometido en reservas activas</span>
        </div>
      </div>

      {/* 3. Items Bajo Stock */}
      <div className="inv-stat-card">
        <div className="inv-stat-icon warning">
          <AlertTriangle size={22} />
        </div>
        <div className="inv-stat-info">
          <span className="inv-stat-label">Bajo Stock (≤ Mínimo)</span>
          <h3 className="inv-stat-value">
            {loading ? '...' : stats.items_bajo_stock}
          </h3>
          <span className="inv-stat-hint">Requiere orden de reposición</span>
        </div>
      </div>

      {/* 4. Variantes Agotadas */}
      <div className="inv-stat-card">
        <div className="inv-stat-icon danger">
          <XCircle size={22} />
        </div>
        <div className="inv-stat-info">
          <span className="inv-stat-label">Variantes Agotadas</span>
          <h3 className="inv-stat-value">
            {loading ? '...' : stats.items_agotados}
          </h3>
          <span className="inv-stat-hint">0 unidades en estantería</span>
        </div>
      </div>
    </div>
  );
});

InventoryStats.displayName = 'InventoryStats';
