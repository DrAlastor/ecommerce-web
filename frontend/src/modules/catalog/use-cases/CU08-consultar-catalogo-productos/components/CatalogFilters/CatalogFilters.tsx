import React from 'react';
import type { CatalogFilterMetadata } from '../../../../types/catalog.types';
import { CategoryFilter } from './CategoryFilter';
import { GenderFilter } from './GenderFilter';
import { SaleFilter } from './SaleFilter';
import { ColorFilter } from './ColorFilter';
import { SizeFilter } from './SizeFilter';
import { PriceRangeFilter } from './PriceRangeFilter';

interface CatalogFiltersProps {
  filterMeta: CatalogFilterMetadata | null;
  selectedCategory: string;
  selectedGender: string;
  selectedColors: string[];
  selectedSizes: string[];
  onlySale: boolean;
  only3D: boolean;
  minPrice: string;
  maxPrice: string;
  showMobileFilters: boolean;
  onCloseMobile: () => void;
  onSelectCategory: (category: string) => void;
  onSelectGender: (gender: string) => void;
  onToggleSale: (sale: boolean) => void;
  onToggle3D: (only3d: boolean) => void;
  onToggleColor: (colorName: string) => void;
  onToggleSize: (sizeCode: string) => void;
  onChangeMinPrice: (val: string) => void;
  onChangeMaxPrice: (val: string) => void;
  onApplyPrice: () => void;
  onResetFilters: () => void;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  filterMeta,
  selectedCategory,
  selectedGender,
  selectedColors,
  selectedSizes,
  onlySale,
  only3D,
  minPrice,
  maxPrice,
  showMobileFilters,
  onCloseMobile,
  onSelectCategory,
  onSelectGender,
  onToggleSale,
  onToggle3D,
  onToggleColor,
  onToggleSize,
  onChangeMinPrice,
  onChangeMaxPrice,
  onApplyPrice,
  onResetFilters,
}) => {
  return (
    <aside className={`catalog-sidebar ${showMobileFilters ? 'show-mobile' : ''}`}>
      <div className="sidebar-header">
        <h3>Filtros</h3>
        <button className="close-sidebar-btn" onClick={onCloseMobile}>
          ✕
        </button>
      </div>

      <div className="sidebar-scrollable">
        {/* 1. Filtro Destacado: Visualización 3D en Tiempo Real */}
        <div className="filter-group filter-group-3d-highlight">
          <h4 className="filter-title">Experiencia Virtual</h4>
          <label className="checkbox-label filter-3d-toggle-label">
            <input
              type="checkbox"
              checked={only3D}
              onChange={(e) => onToggle3D(e.target.checked)}
            />
            <span className="checkbox-custom checkbox-custom-3d" />
            <span className="checkbox-text filter-3d-text">
              <span className="badge-3d-gradient">3D</span>
              <span className="filter-3d-name">Visualización 3D</span>
              {filterMeta?.total_3d !== undefined && (
                <span className="filter-count-badge">({filterMeta.total_3d})</span>
              )}
            </span>
          </label>
        </div>

        {/* Categorías */}
        {filterMeta && (
          <CategoryFilter
            categories={filterMeta.categorias}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
        )}

        {/* Ofertas */}
        <SaleFilter
          onlySale={onlySale}
          onToggleSale={onToggleSale}
        />

        {/* Colores */}
        {filterMeta && (
          <ColorFilter
            colors={filterMeta.colores}
            selectedColors={selectedColors}
            onToggleColor={onToggleColor}
          />
        )}

        {/* Tallas */}
        {filterMeta && (
          <SizeFilter
            sizes={filterMeta.tallas}
            selectedSizes={selectedSizes}
            onToggleSize={onToggleSize}
          />
        )}

        {/* Rango de Precios */}
        <PriceRangeFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          onChangeMinPrice={onChangeMinPrice}
          onChangeMaxPrice={onChangeMaxPrice}
          onApplyPrice={onApplyPrice}
        />

        {/* Limpiar Filtros */}
        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="reset-filters-btn"
            style={{ width: '100%', padding: '0.6rem' }}
            onClick={onResetFilters}
          >
            Limpiar Todos los Filtros
          </button>
        </div>
      </div>
    </aside>
  );
};
