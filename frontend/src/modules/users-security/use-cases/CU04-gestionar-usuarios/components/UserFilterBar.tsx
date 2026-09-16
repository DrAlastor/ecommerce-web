import React from 'react';

interface UserFilterBarProps {
  onSearch: (val: string) => void;
  onFilterRole: (val: string) => void;
  onFilterStatus: (val: string) => void;
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  onSearch,
  onFilterRole,
  onFilterStatus,
}) => {
  return (
    <div className="filters-bar">
      <input 
        type="text" 
        placeholder="Buscar por email, nombre o CI..." 
        onChange={(e) => onSearch(e.target.value)}
        className="search-input"
      />
      <select onChange={(e) => onFilterRole(e.target.value)} className="filter-select">
        <option value="">Todos los Roles</option>
        <option value="1">Administrador</option>
        <option value="2">Encargado de Sucursal</option>
        <option value="3">Cajero</option>
        <option value="4">Cliente</option>
      </select>
      <select onChange={(e) => onFilterStatus(e.target.value)} className="filter-select">
        <option value="">Todos los Estados</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
      </select>
    </div>
  );
};
