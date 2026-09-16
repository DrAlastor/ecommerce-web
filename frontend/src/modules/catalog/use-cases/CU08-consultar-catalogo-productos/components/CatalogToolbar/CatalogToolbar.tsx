import React from 'react';

interface CatalogToolbarProps {
  sortBy: string;
  onSortChange: (newSort: string) => void;
  totalProducts: number;
}

export const CatalogToolbar: React.FC<CatalogToolbarProps> = ({
  sortBy,
  onSortChange,
  totalProducts,
}) => {
  return (
    <div className="catalog-toolbar">
      <div className="sort-by">
        <span className="sort-label">Ordenar por</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="sort-select"
        >
          <option value="recientes">Novedades / Recientes</option>
          <option value="precio_asc">Precio: Menor a Mayor</option>
          <option value="precio_desc">Precio: Mayor a Menor</option>
          <option value="nombre_asc">Nombre: A - Z</option>
          <option value="nombre_desc">Nombre: Z - A</option>
        </select>
      </div>

      <div className="toolbar-tags">
        <span style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 500 }}>
          {totalProducts} {totalProducts === 1 ? 'prenda encontrada' : 'prendas encontradas'}
        </span>
      </div>
    </div>
  );
};
