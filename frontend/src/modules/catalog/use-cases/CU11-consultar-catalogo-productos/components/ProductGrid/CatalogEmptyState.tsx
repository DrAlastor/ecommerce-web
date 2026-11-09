/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
import React from 'react';

interface CatalogEmptyStateProps {
  onResetFilters: () => void;
}

export const CatalogEmptyState: React.FC<CatalogEmptyStateProps> = ({ onResetFilters }) => {
  return (
    <div className="no-products-found">
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#1A1A1A' }}>
        No se encontraron prendas
      </h3>
      <p style={{ color: '#6B7280', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
        Intenta cambiar tus términos de búsqueda o relajar los filtros aplicados para
        encontrar más opciones.
      </p>
      <button className="reset-filters-btn" onClick={onResetFilters}>
        Restablecer todos los filtros
      </button>
    </div>
  );
};
