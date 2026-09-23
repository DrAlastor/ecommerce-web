/**
 * @caso-de-uso CU14 — Consultar sucursales
 * @subsistema Sucursales e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> listado de sucursales -> controlador de consulta -> servicio de sucursales -> Ciudad/Sucursal/Disponibilidad.
 */
import React from 'react';
import { Store, MapPin, Search, X } from 'lucide-react';
import type { PublicBranch, PublicCity } from '../types/branchesPublic.types';

interface BranchesControlsProps {
  cities: PublicCity[];
  branches: PublicBranch[];
  selectedCityId: number | null;
  onSelectCity: (cityId: number | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const BranchesControls: React.FC<BranchesControlsProps> = React.memo(({
  cities,
  branches,
  selectedCityId,
  onSelectCity,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="branches-controls-bar">
      {/* Selector horizontal de Ciudades */}
      <div className="city-pills-container">
        <button
          className={`city-pill ${selectedCityId === null ? 'active' : ''}`}
          onClick={() => onSelectCity(null)}
          type="button"
        >
          <Store size={15} />
          <span>Todas las ciudades ({branches.length})</span>
        </button>
        {cities.map((city) => {
          const countInCity = branches.filter((b) => b.id_ciudad === city.id_ciudad).length;
          return (
            <button
              key={city.id_ciudad}
              className={`city-pill ${selectedCityId === city.id_ciudad ? 'active' : ''}`}
              onClick={() => onSelectCity(city.id_ciudad)}
              type="button"
            >
              <MapPin size={15} />
              <span>{city.nombre}</span>
              <span className="city-pill-count">{countInCity}</span>
            </button>
          );
        })}
      </div>

      {/* Buscador */}
      <div className="branches-search-box">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, zona o ciudad..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="branches-search-input"
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => onSearchChange('')}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

BranchesControls.displayName = 'BranchesControls';
