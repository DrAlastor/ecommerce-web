/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../../../../../context/ShopContext';
import type { CatalogProduct } from '../../../../types/catalog.types';
import type { Product } from '../../../../../../types/shop.types';

interface ProductCardProps {
  product: CatalogProduct;
  toShopProduct: (p: CatalogProduct) => Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, toShopProduct }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist, addToCart } = useShop();
  const isFavorited = isInWishlist(product.id_producto);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(toShopProduct(product), 1);
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id_producto}`);
  };

  return (
    <div
      className="product-card"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="product-card-media">
        <img
          src={
            product.imagen_principal ||
            'https://fashionstorestorage.blob.core.windows.net/productos/chaleco_sastre.png'
          }
          alt={product.nombre}
          loading="lazy"
          className="product-card-img"
        />

        {/* Badges de Estado / Descuento / 3D */}
        <div className="product-badges-corner">
          {product.tiene_3d && (
            <span
              className="badge-pill badge-3d-live"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/virtual-fitting/${product.id_producto}`);
              }}
              title="Probar con webcam en 3D"
            >
              ✨ PROBAR 3D
            </span>
          )}
          {product.tiene_descuento && (
            <span className="badge-pill badge-discount-percent">
              -{product.descuento_porcentaje}%
            </span>
          )}
          {product.coleccion && (
            <span className="badge-pill badge-new">
              {product.coleccion.nombre}
            </span>
          )}
        </div>

        {/* Botón Favoritos */}
        <button
          type="button"
          className={`product-wishlist-toggle ${isFavorited ? 'favorited' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id_producto);
          }}
          aria-label="Añadir a lista de deseos"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isFavorited ? '#DC2626' : 'none'}
            stroke={isFavorited ? '#DC2626' : '#1A1A1A'}
            strokeWidth="1.8"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        {/* Botón Quick Add */}
        <button
          type="button"
          className="quick-add-btn"
          onClick={handleQuickAdd}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span>Añadir</span>
        </button>
      </div>

      <div className="product-card-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.categoria?.nombre || 'Moda'}
          </span>
          {product.genero && (
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
              {product.genero}
            </span>
          )}
        </div>

        <h4 className="product-title">{product.nombre}</h4>

        {/* Precios */}
        <div className="product-price-row">
          <span className="product-price">
            {product.precio_final.toFixed(2)} Bs
          </span>
          {product.tiene_descuento && (
            <span className="product-old-price">
              {product.precio_base.toFixed(2)} Bs
            </span>
          )}
        </div>

        {/* Tallas y Colores disponibles en la card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          {product.colores_disponibles.length > 0 && (
            <div className="card-color-dots">
              {product.colores_disponibles.slice(0, 4).map((c) => (
                <span
                  key={c.id_color}
                  className="color-dot"
                  style={{ backgroundColor: c.codigo_hex || '#999' }}
                  title={c.nombre}
                />
              ))}
              {product.colores_disponibles.length > 4 && (
                <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                  +{product.colores_disponibles.length - 4}
                </span>
              )}
            </div>
          )}

          {product.tallas_disponibles.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              {product.tallas_disponibles.map((t) => t.codigo).join(' · ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
