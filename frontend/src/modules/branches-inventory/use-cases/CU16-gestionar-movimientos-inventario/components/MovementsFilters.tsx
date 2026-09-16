import React from 'react';
import {
  Calendar,
  Filter,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { MovementBranch, MovementQueryParams } from '../types/movements.types';

interface MovementsFiltersProps {
  filters: MovementQueryParams;
  sucursales: MovementBranch[];
  onFilterChange: (newFilters: Partial<MovementQueryParams>) => void;
  onReset: () => void;
}

export const MovementsFilters: React.FC<MovementsFiltersProps> = ({
  filters,
  sucursales,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="movements-filters-card">
      <div className="filters-header">
        <div className="filters-header-title">
          <Filter size={18} />
          <span>Filtros de Trazabilidad</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="filters-reset-btn"
          title="Limpiar filtros"
        >
          <RotateCcw size={14} />
          <span>Limpiar</span>
        </button>
      </div>

      <div className="filters-grid">
        {/* Buscador de texto */}
        <div className="filter-group filter-search">
          <label htmlFor="search-movements">Búsqueda rápida</label>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              id="search-movements"
              type="text"
              placeholder="Producto, SKU, motivo o responsable..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value })}
            />
          </div>
        </div>

        {/* Filtro por Sucursal */}
        <div className="filter-group">
          <label htmlFor="filter-sucursal">Sucursal</label>
          <select
            id="filter-sucursal"
            value={filters.id_sucursal || ''}
            onChange={(e) =>
              onFilterChange({
                id_sucursal: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          >
            <option value="">Todas las sucursales permitidas</option>
            {sucursales.map((s) => (
              <option key={s.id_sucursal} value={s.id_sucursal}>
                {s.nombre} {s.ciudad ? `(${s.ciudad})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Tipo de Movimiento */}
        <div className="filter-group">
          <label htmlFor="filter-tipo">Tipo de Movimiento</label>
          <select
            id="filter-tipo"
            value={filters.tipo_movimiento || 'todos'}
            onChange={(e) => onFilterChange({ tipo_movimiento: e.target.value })}
          >
            <option value="todos">Todos los tipos</option>
            <option value="entrada">Entrada (Reposición / Compra)</option>
            <option value="salida">Salida (Baja / Retiro)</option>
            <option value="salida_venta">Salida por Venta</option>
            <option value="ajuste">Ajuste de Stock</option>
            <option value="devolucion">Devolución de Prenda</option>
            <option value="reserva">Bloqueo por Reserva</option>
          </select>
        </div>

        {/* Fecha Desde */}
        <div className="filter-group filter-date">
          <label htmlFor="filter-fecha-desde">
            <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
            Desde
          </label>
          <input
            id="filter-fecha-desde"
            type="date"
            value={filters.fecha_desde || ''}
            onChange={(e) => onFilterChange({ fecha_desde: e.target.value })}
          />
        </div>

        {/* Fecha Hasta */}
        <div className="filter-group filter-date">
          <label htmlFor="filter-fecha-hasta">
            <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
            Hasta
          </label>
          <input
            id="filter-fecha-hasta"
            type="date"
            value={filters.fecha_hasta || ''}
            onChange={(e) => onFilterChange({ fecha_hasta: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};
