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
  minPrice: string;
  maxPrice: string;
  showMobileFilters: boolean;
  onCloseMobile: () => void;
  onSelectCategory: (category: string) => void;
  onSelectGender: (gender: string) => void;
  onToggleSale: (sale: boolean) => void;
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
  minPrice,
  maxPrice,
  showMobileFilters,
  onCloseMobile,
  onSelectCategory,
  onSelectGender,
  onToggleSale,
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
        {/* Categorías */}
        {filterMeta && (
          <CategoryFilter
            categories={filterMeta.categorias}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
        )}

        {/* Género */}
        <GenderFilter
          selectedGender={selectedGender}
          onSelectGender={onSelectGender}
        />

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
