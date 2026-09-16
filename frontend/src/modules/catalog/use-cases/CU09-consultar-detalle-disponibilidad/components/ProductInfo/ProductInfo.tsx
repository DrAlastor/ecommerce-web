import React from 'react';
import type { ProductDetail } from '../../types/product-detail.types';
import { Sparkles, Tag } from 'lucide-react';

interface ProductInfoProps {
  product: ProductDetail;
  currentPrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  discountPercent: number;
  selectedSku?: string;
  onNavigateHome: () => void;
  onNavigateCatalog: () => void;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  currentPrice,
  originalPrice,
  hasDiscount,
  discountPercent,
  selectedSku,
  onNavigateHome,
  onNavigateCatalog,
}) => {
  return (
    <div className="product-info-section">
      {/* Breadcrumbs */}
      <nav className="product-breadcrumbs" aria-label="Breadcrumb">
        <span onClick={onNavigateHome} className="breadcrumb-link">Inicio</span>
        <span className="separator">/</span>
        <span onClick={onNavigateCatalog} className="breadcrumb-link">Catálogo</span>
        <span className="separator">/</span>
        <span className="breadcrumb-link">{product.categoria.nombre}</span>
        {product.coleccion && (
          <>
            <span className="separator">/</span>
            <span className="breadcrumb-link">{product.coleccion.nombre}</span>
          </>
        )}
      </nav>

      {/* Badges de Categoría y Temporada */}
      <div className="product-meta-pills">
        <span className="meta-pill category-pill">
          {product.categoria.nombre}
        </span>
        {product.genero && (
          <span className="meta-pill gender-pill">
            {product.genero}
          </span>
        )}
        {product.coleccion?.temporada && (
          <span className="meta-pill season-pill">
            <Sparkles size={13} /> {product.coleccion.temporada.nombre}
          </span>
        )}
      </div>

      {/* Título Principal */}
      <h1 className="product-detail-title">{product.nombre}</h1>

      {/* SKU y Referencia */}
      {selectedSku && (
        <div className="product-sku-reference">
          <span>SKU: <strong>{selectedSku}</strong></span>
        </div>
      )}

      {/* Bloque de Precio */}
      <div className="product-pricing-box">
        <div className="price-main-line">
          <span className="current-price-val">Bs {currentPrice.toFixed(2)}</span>
          {hasDiscount && (
            <>
              <span className="original-price-val">Bs {originalPrice.toFixed(2)}</span>
              <span className="discount-pill-tag">-{discountPercent}% OFF</span>
            </>
          )}
        </div>

        {product.promocion && (
          <div className="active-promotion-banner">
            <Tag size={15} />
            <span>
              Promoción activa: <strong>{product.promocion.nombre}</strong> aplicada automáticamente.
            </span>
          </div>
        )}
      </div>

      {/* Descripción corta */}
      {product.descripcion && (
        <p className="product-description-excerpt">
          {product.descripcion}
        </p>
      )}
    </div>
  );
};
