/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
import React from 'react';
import type { CatalogCategoryMeta } from '../../../../types/catalog.types';

interface CategoryFilterProps {
  categories: CatalogCategoryMeta[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="filter-group">
      <h4 className="filter-title">Categoría</h4>
      <ul className="filter-list">
        <li>
          <label className="radio-label">
            <input
              type="radio"
              name="category"
              checked={selectedCategory === 'all'}
              onChange={() => onSelectCategory('all')}
            />
            <span className="radio-text">Todas las categorías</span>
          </label>
        </li>
        {categories.map((cat) => (
          <li key={cat.id_categoria}>
            <label className="radio-label">
              <input
                type="radio"
                name="category"
                checked={selectedCategory.toLowerCase() === cat.nombre.toLowerCase()}
                onChange={() => onSelectCategory(cat.nombre)}
              />
              <span className="radio-text">
                {cat.nombre} ({cat.total_productos})
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
