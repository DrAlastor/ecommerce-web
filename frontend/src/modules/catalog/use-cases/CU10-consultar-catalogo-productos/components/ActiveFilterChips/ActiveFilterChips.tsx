import React from 'react';

interface ActiveFilterChipsProps {
  selectedCategory: string;
  selectedGender: string;
  selectedColors: string[];
  selectedSizes: string[];
  onlySale: boolean;
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  onRemoveCategory: () => void;
  onRemoveGender: () => void;
  onRemoveColor: (color: string) => void;
  onRemoveSize: (size: string) => void;
  onRemoveSale: () => void;
  onRemoveSearch: () => void;
  onRemovePrice: () => void;
  onResetAll: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  selectedCategory,
  selectedGender,
  selectedColors,
  selectedSizes,
  onlySale,
  searchQuery,
  minPrice,
  maxPrice,
  onRemoveCategory,
  onRemoveGender,
  onRemoveColor,
  onRemoveSize,
  onRemoveSale,
  onRemoveSearch,
  onRemovePrice,
  onResetAll,
}) => {
  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedGender !== 'all' ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    onlySale ||
    searchQuery ||
    minPrice ||
    maxPrice;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="active-filter-chips">
      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Filtros activos:</span>

      {searchQuery && (
        <span className="filter-chip">
          Búsqueda: "{searchQuery}"
          <button className="filter-chip-remove" onClick={onRemoveSearch}>
            ✕
          </button>
        </span>
      )}

      {selectedCategory !== 'all' && (
        <span className="filter-chip">
          Categoría: {selectedCategory}
          <button className="filter-chip-remove" onClick={onRemoveCategory}>
            ✕
          </button>
        </span>
      )}

      {selectedGender !== 'all' && (
        <span className="filter-chip">
          Género: {selectedGender}
          <button className="filter-chip-remove" onClick={onRemoveGender}>
            ✕
          </button>
        </span>
      )}

      {onlySale && (
        <span className="filter-chip" style={{ background: '#FEE2E2', color: '#DC2626' }}>
          🏷️ En Oferta
          <button className="filter-chip-remove" onClick={onRemoveSale}>
            ✕
          </button>
        </span>
      )}

      {selectedColors.map((col) => (
        <span key={col} className="filter-chip">
          Color: {col}
          <button className="filter-chip-remove" onClick={() => onRemoveColor(col)}>
            ✕
          </button>
        </span>
      ))}

      {selectedSizes.map((s) => (
        <span key={s} className="filter-chip">
          Talla: {s}
          <button className="filter-chip-remove" onClick={() => onRemoveSize(s)}>
            ✕
          </button>
        </span>
      ))}

      {(minPrice || maxPrice) && (
        <span className="filter-chip">
          Precio: {minPrice || '0'} - {maxPrice || '∞'} Bs
          <button className="filter-chip-remove" onClick={onRemovePrice}>
            ✕
          </button>
        </span>
      )}

      <button
        onClick={onResetAll}
        style={{
          background: 'none',
          border: 'none',
          color: '#DC2626',
          fontSize: '0.8rem',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Limpiar todo
      </button>
    </div>
  );
};
