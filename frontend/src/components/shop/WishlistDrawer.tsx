import React from 'react';
import { useShop } from '../../context/ShopContext';
import { PRODUCTS } from '../../data/mockProducts';
import './WishlistDrawer.css';

export const WishlistDrawer: React.FC = () => {
  const {
    wishlist,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    addToCart,
    setIsCartOpen,
  } = useShop();

  if (!isWishlistOpen) return null;

  const wishlistProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  const handleMoveToCart = (product: typeof PRODUCTS[0]) => {
    addToCart(product, 1);
    toggleWishlist(product.id);
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  return (
    <div className="wishlist-drawer-overlay" onClick={() => setIsWishlistOpen(false)}>
      <div className="wishlist-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="wishlist-header">
          <div className="wishlist-title">
            <h3>Lista de Deseos</h3>
            <span className="wishlist-count">({wishlist.length} {wishlist.length === 1 ? 'artículo' : 'artículos'})</span>
          </div>
          <button
            className="wishlist-close-btn"
            onClick={() => setIsWishlistOpen(false)}
            aria-label="Cerrar favoritos"
          >
            ✕
          </button>
        </div>

        <div className="wishlist-body">
          {wishlistProducts.length === 0 ? (
            <div className="wishlist-empty-state">
              <div className="empty-heart-icon">🤍</div>
              <h4>Tu lista de deseos está vacía</h4>
              <p>Guarda tus piezas favoritas haciendo clic en el corazón de cada prenda.</p>
              <button
                className="explore-btn"
                onClick={() => {
                  setIsWishlistOpen(false);
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver Colección
              </button>
            </div>
          ) : (
            <div className="wishlist-items-grid">
              {wishlistProducts.map((product) => (
                <div key={product.id} className="wishlist-item-card">
                  <div className="wishlist-item-media">
                    <img src={product.image} alt={product.name} />
                    <button
                      className="wishlist-remove-icon"
                      onClick={() => toggleWishlist(product.id)}
                      title="Quitar de favoritos"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="wishlist-item-info">
                    <span className="wishlist-item-category">{product.category}</span>
                    <h5 className="wishlist-item-name">{product.name}</h5>
                    <div className="wishlist-item-price-row">
                      <span className="wishlist-item-price">{product.price.toFixed(2)} Bs</span>
                      {product.originalPrice && (
                        <span className="wishlist-item-old-price">{product.originalPrice.toFixed(2)} Bs</span>
                      )}
                    </div>
                    <button
                      className="wishlist-add-cart-btn"
                      onClick={() => handleMoveToCart(product)}
                    >
                      Mover al Carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
