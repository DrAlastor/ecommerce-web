/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
import React from 'react';

interface PriceRangeFilterProps {
  minPrice: string;
  maxPrice: string;
  onChangeMinPrice: (val: string) => void;
  onChangeMaxPrice: (val: string) => void;
  onApplyPrice: () => void;
}

export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  minPrice,
  maxPrice,
  onChangeMinPrice,
  onChangeMaxPrice,
  onApplyPrice,
}) => {
  return (
    <div className="filter-group border-none">
      <h4 className="filter-title">Rango de Precio (Bs)</h4>
      <div className="price-inputs">
        <input
          type="number"
          placeholder="Mín."
          value={minPrice}
          onChange={(e) => onChangeMinPrice(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApplyPrice()}
        />
        <span>-</span>
        <input
          type="number"
          placeholder="Máx."
          value={maxPrice}
          onChange={(e) => onChangeMaxPrice(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApplyPrice()}
        />
      </div>
      <button
        type="button"
        style={{
          marginTop: '0.75rem',
          width: '100%',
          padding: '0.45rem',
          borderRadius: '6px',
          backgroundColor: '#1A1A1A',
          color: '#FFF',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          border: 'none',
        }}
        onClick={onApplyPrice}
      >
        Aplicar Precio
      </button>
    </div>
  );
};
