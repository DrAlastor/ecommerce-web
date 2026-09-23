/**
 * @caso-de-uso CU19 — Gestionar reserva en sucursal
 * @subsistema Reservas
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Encargado o Cajero -> bandeja de reservas -> controlador de atención -> servicio de reservas -> Reserva/DetalleReserva/Inventario/Bitácora.
 */
import React from 'react';
import { Store, Search, RefreshCw } from 'lucide-react';
import type { StaffBranch } from '../types/branch-reservations.types';

interface BranchReservationsFiltersProps {
  branches: StaffBranch[];
  selectedBranchId: number | 'todas';
  onBranchChange: (val: number | 'todas') => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const BranchReservationsFilters: React.FC<BranchReservationsFiltersProps> = ({
  branches,
  selectedBranchId,
  onBranchChange,
  selectedStatus,
  onStatusChange,
  searchTerm,
  onSearchChange,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="branch-res-filters-container">
      <div className="filters-top-row">
        {/* Selector de Sucursal */}
        {branches.length > 1 ? (
          <div className="branch-select-group">
            <Store size={18} className="select-icon" />
            <select
              value={selectedBranchId}
              onChange={(e) =>
                onBranchChange(e.target.value === 'todas' ? 'todas' : Number(e.target.value))
              }
              className="branch-select"
            >
              <option value="todas">Todas mis sucursales asignadas</option>
              {branches.map((b) => (
                <option key={b.id_sucursal} value={b.id_sucursal}>
                  {b.nombre} ({b.ciudad?.nombre || 'Sucursal'})
                </option>
              ))}
            </select>
          </div>
        ) : branches.length === 1 ? (
          <div className="single-branch-indicator">
            <Store size={18} />
            <span>
              Sucursal: <strong>{branches[0].nombre}</strong> ({branches[0].ciudad?.nombre})
            </span>
          </div>
        ) : null}

        {/* Buscador */}
        <div className="search-bar-group">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por código de reserva, nombre o CI del cliente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Botón Refrescar */}
        <button
          type="button"
          className="btn-filter-refresh"
          onClick={onRefresh}
          disabled={isLoading}
          title="Actualizar listado"
        >
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Pestañas Rápidas de Estado */}
      <div className="filters-status-pills">
        <button
          type="button"
          className={`status-pill ${selectedStatus === 'activas' ? 'active' : ''}`}
          onClick={() => onStatusChange('activas')}
        >
          Activas en Tienda
        </button>
        <button
          type="button"
          className={`status-pill ${selectedStatus === 'Pendiente' ? 'active' : ''}`}
          onClick={() => onStatusChange('Pendiente')}
        >
          Pendientes
        </button>
        <button
          type="button"
          className={`status-pill ${selectedStatus === 'Preparada' ? 'active' : ''}`}
          onClick={() => onStatusChange('Preparada')}
        >
          Preparadas
        </button>
        <button
          type="button"
          className={`status-pill ${selectedStatus === 'Atendida' ? 'active' : ''}`}
          onClick={() => onStatusChange('Atendida')}
        >
          Atendidas
        </button>
        <button
          type="button"
          className={`status-pill ${selectedStatus === 'historico' ? 'active' : ''}`}
          onClick={() => onStatusChange('historico')}
        >
          Histórico
        </button>
        <button
          type="button"
          className={`status-pill ${selectedStatus === 'todos' ? 'active' : ''}`}
          onClick={() => onStatusChange('todos')}
        >
          Todas
        </button>
      </div>
    </div>
  );
};
