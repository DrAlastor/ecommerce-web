/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
import React from 'react';
import type { CatalogSize } from '../../../../types/catalog.types';

interface SizeFilterProps {
  sizes: CatalogSize[];
  selectedSizes: string[];
  onToggleSize: (sizeCode: string) => void;
}

export const SizeFilter: React.FC<SizeFilterProps> = ({
  sizes,
  selectedSizes,
  onToggleSize,
}) => {
  if (sizes.length === 0) return null;

  return (
    <div className="filter-group">
      <h4 className="filter-title">Talla</h4>
      <div className="size-grid">
        {sizes.map((t) => {
          const isSelected = selectedSizes.includes(t.codigo);
          return (
            <label
              key={t.id_talla}
              className={`checkbox-label size-label ${isSelected ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSize(t.codigo)}
              />
              <span className="checkbox-text">{t.codigo}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
