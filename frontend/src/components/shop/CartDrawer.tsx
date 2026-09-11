import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../modules/users-security/shared/components/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CartDrawer.css';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartItemCount,
  } = useShop();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const freeShippingThreshold = 350.0;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);
  const progressPercent = Math.min(100, (cartTotal / freeShippingThreshold) * 100);
  const shippingCost = cartTotal >= freeShippingThreshold || cartTotal === 0 ? 0 : 25.0;
  const finalTotal = Math.max(0, cartTotal - discount + shippingCost);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'DRESSLY10') {
      const disc = cartTotal * 0.1;
      setDiscount(disc);
      setPromoApplied(true);
    } else {
      alert('Cupón no válido. Prueba usando: DRESSLY10');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      if (confirm('Para procesar tu pedido te recomendamos iniciar sesión. ¿Deseas ir al login ahora?')) {
        setIsCartOpen(false);
        navigate('/login');
      }
    } else {
      alert('¡Redirigiendo a la pasarela de pago seguro...');
    }
  };

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title">
            <h3>Bolsa de Compras</h3>
            <span className="cart-items-count">({cartItemCount} {cartItemCount === 1 ? 'artículo' : 'artículos'})</span>
          </div>
          <button
            className="cart-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="free-shipping-tracker">
          {remainingForFreeShipping > 0 ? (
            <p className="tracker-text">
              Agrega <strong>{remainingForFreeShipping.toFixed(2)} Bs</strong> más para obtener <strong>ENVÍO GRATIS</strong> 🚚
            </p>
          ) : (
            <p className="tracker-text success">
              🎉 ¡Felicidades! Tienes <strong>ENVÍO GRATIS</strong> en este pedido a toda Bolivia.
            </p>
          )}
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Body */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-cart-icon">🛍️</div>
              <h4>Tu bolsa está vacía</h4>
              <p>Descubre las piezas exclusivas de la nueva temporada.</p>
              <button
                className="explore-btn"
                onClick={() => {
                  setIsCartOpen(false);
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.product.id} className="cart-item-row">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="cart-item-thumb"
                  />
                  <div className="cart-item-details">
                    <div className="cart-item-top">
                      <h4 className="cart-item-name">{item.product.name}</h4>
                      <button
                        className="cart-item-remove-btn"
                        onClick={() => removeFromCart(item.product.id)}
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="cart-item-variant">
                      {item.selectedSize ? `Talla: ${item.selectedSize}` : ''}
                      {item.selectedSize && item.selectedColor ? ' | ' : ''}
                      {item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                    </p>
                    <div className="cart-item-bottom">
                      <div className="quantity-counter">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="qty-btn"
                        >
                          -
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="qty-btn"
                        >
                          +
                        </button>
                      </div>
                      <span className="cart-item-price">
                        {(item.product.price * item.quantity).toFixed(2)} Bs
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Subtotals */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Promo Code Form */}
            <form className="promo-code-form" onSubmit={handleApplyPromo}>
              <input
                type="text"
                placeholder="Código de descuento (DRESSLY10)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={promoApplied}
                className="promo-input"
              />
              <button
                type="submit"
                disabled={promoApplied || !promoCode}
                className="promo-apply-btn"
              >
                {promoApplied ? 'Aplicado ✓' : 'Aplicar'}
              </button>
            </form>

            <div className="cart-summary-line">
              <span>Subtotal</span>
              <span>{cartTotal.toFixed(2)} Bs</span>
            </div>

            {promoApplied && (
              <div className="cart-summary-line discount-line">
                <span>Descuento (10%)</span>
                <span>-{discount.toFixed(2)} Bs</span>
              </div>
            )}

            <div className="cart-summary-line">
              <span>Envío</span>
              <span>{shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)} Bs`}</span>
            </div>

            <div className="cart-summary-line total-line">
              <span>Total Estimado</span>
              <span className="total-amount">{finalTotal.toFixed(2)} Bs</span>
            </div>

            <button className="checkout-btn" onClick={handleCheckout}>
              Proceder al Pago Seguro • {finalTotal.toFixed(2)} Bs
            </button>

            <p className="cart-security-note">
              🔒 Pagos seguros con QR Simple, Tarjeta y Transferencia Bancaria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
