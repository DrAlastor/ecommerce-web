/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
import React from 'react';
import type { CatalogProduct } from '../../../../types/catalog.types';
import type { Product } from '../../../../../../types/shop.types';
import { ProductCard } from '../ProductCard/ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { CatalogEmptyState } from './CatalogEmptyState';

interface ProductGridProps {
  products: CatalogProduct[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onResetFilters: () => void;
  toShopProduct: (cp: CatalogProduct) => Product;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  errorMessage,
  onRetry,
  onResetFilters,
  toShopProduct,
}) => {
  // Error state
  if (errorMessage) {
    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: '#FEF2F2',
          borderRadius: '12px',
          border: '1px solid #F87171',
          textAlign: 'center',
          marginBottom: '2rem',
        }}
      >
        <p style={{ color: '#B91C1C', fontWeight: 600, marginBottom: '1rem' }}>
          {errorMessage}
        </p>
        <button
          className="reset-filters-btn"
          onClick={onRetry}
          style={{ backgroundColor: '#B91C1C', color: '#FFF' }}
        >
          Reintentar consulta
        </button>
      </div>
    );
  }

  // Loading skeletons
  if (isLoading) {
    return (
      <div className="products-grid-catalog">
        {Array.from({ length: 8 }).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return <CatalogEmptyState onResetFilters={onResetFilters} />;
  }

  // Regular grid
  return (
    <div className="products-grid-catalog">
      {products.map((product) => (
        <ProductCard
          key={product.id_producto}
          product={product}
          toShopProduct={toShopProduct}
        />
      ))}
    </div>
  );
};
