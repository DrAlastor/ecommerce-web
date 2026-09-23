/**
 * @caso-de-uso CU06 — Gestionar empleados
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> formulario de empleados -> controlador de empleados -> servicio de empleados -> Usuario/Empleado/Rol/Sucursal.
 */
import React from 'react';
import type { BranchItem, EmployeeRoleItem } from '../services/empleados.service';
import { Search } from 'lucide-react';

interface EmployeeFilterToolbarProps {
  searchTerm: string;
  selectedRole: number | '';
  selectedBranch: number | '';
  selectedStatus: 'activo' | 'inactivo' | '';
  roles: EmployeeRoleItem[];
  branches: BranchItem[];
  onSearchChange: (val: string) => void;
  onRoleChange: (val: number | '') => void;
  onBranchChange: (val: number | '') => void;
  onStatusChange: (val: 'activo' | 'inactivo' | '') => void;
  onClearFilters: () => void;
}

export const EmployeeFilterToolbar: React.FC<EmployeeFilterToolbarProps> = ({
  searchTerm,
  selectedRole,
  selectedBranch,
  selectedStatus,
  roles,
  branches,
  onSearchChange,
  onRoleChange,
  onBranchChange,
  onStatusChange,
  onClearFilters,
}) => {
  const hasActiveFilters =
    searchTerm || selectedRole !== '' || selectedBranch !== '' || selectedStatus !== '';

  return (
    <div className="employees-filters-card">
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por código, nombre, CI o correo..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-select-group">
        <select
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Todos los Roles</option>
          {roles.map((r) => (
            <option key={r.id_rol} value={r.id_rol}>
              {r.nombre}
            </option>
          ))}
        </select>

        <select
          value={selectedBranch}
          onChange={(e) => onBranchChange(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Todas las Sucursales</option>
          {branches.map((b) => (
            <option key={b.id_sucursal} value={b.id_sucursal}>
              {b.nombre} ({b.ciudad || 'Bolivia'})
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) =>
            onStatusChange(e.target.value as 'activo' | 'inactivo' | '')
          }
        >
          <option value="">Todos los Estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn-clear-filters"
            onClick={onClearFilters}
            title="Limpiar filtros"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};
