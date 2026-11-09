/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="product-card-skeleton">
      <div className="skeleton-img skeleton-pulse" />
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-pulse" />
        <div className="skeleton-line short skeleton-pulse" />
        <div className="skeleton-line half skeleton-pulse" />
      </div>
    </div>
  );
};
