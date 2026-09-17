import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../../../../context/ShopContext';
import { useAuth } from '../../../../users-security/shared/components/AuthContext';
import { Navbar } from '../../../../../components/layout/Navbar';
import { CartDrawer } from '../../../../../components/shop/CartDrawer';
import { WishlistDrawer } from '../../../../../components/shop/WishlistDrawer';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import './CartPage.css';

export const CartPage: React.FC = () => {
  const {
    cart,
    cartTotal,
    cartItemCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    isCartLoading,
    backendCart,
  } = useShop();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const freeShippingThreshold = 350.0;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);
  const progressPercent = Math.min(100, (cartTotal / freeShippingThreshold) * 100);
  const shippingCost = cartTotal >= freeShippingThreshold || cartTotal === 0 ? 0 : 25.0;
  const totalConEnvio = cartTotal + shippingCost;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      if (
        confirm(
          'Para procesar tu compra y comprobante digital, te sugerimos iniciar sesión. ¿Deseas ingresar ahora?',
        )
      ) {
        navigate('/login');
        return;
      }
    }
    // Navegación hacia CU21 - Checkout Digital
    navigate('/checkout');
  };

  return (
    <div className="cart-page-wrapper">
      <Navbar />
      <CartDrawer />
      <WishlistDrawer />

      <main className="cart-page-main">
        <div className="cart-page-container">
          {/* Breadcrumb / Título */}
          <div className="cart-page-header">
            <div>
              <h1 className="cart-page-title">Mi Bolsa de Compras</h1>
              <p className="cart-page-subtitle">
                Revisa y organiza los artículos seleccionados antes de confirmar tu pedido.
              </p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                className="btn-clear-cart"
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas vaciar toda tu bolsa de compras?')) {
                    clearCart();
                  }
                }}
                disabled={isCartLoading}
              >
                <Trash2 size={16} />
                <span>Vaciar bolsa</span>
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            /* Estado Vacío */
            <div className="cart-empty-card">
              <div className="cart-empty-icon-wrap">
                <ShoppingBag size={54} />
              </div>
              <h2>Tu bolsa está actualmente vacía</h2>
              <p>
                Explora las colecciones exclusivas de FashionStore y agrega tus prendas favoritas
                eligiendo tu talla y color preferido.
              </p>
              <button
                type="button"
                className="btn-go-shopping"
                onClick={() => navigate('/catalog')}
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            /* Layout Principal del Carrito */
            <div className="cart-layout-grid">
              {/* Columna Izquierda: Tabla y Lista de Productos */}
              <div className="cart-items-section">
                {/* Barra de Progreso de Envío Gratis */}
                <div className="cart-free-shipping-card">
                  <div className="shipping-card-header">
                    <Truck size={20} className="shipping-icon" />
                    <div>
                      {remainingForFreeShipping > 0 ? (
                        <p className="shipping-text">
                          Agrega <strong>{remainingForFreeShipping.toFixed(2)} Bs</strong> más para
                          obtener <strong>ENVÍO GRATIS</strong> a nivel nacional.
                        </p>
                      ) : (
                        <p className="shipping-text success">
                          🎉 ¡Genial! Tu pedido califica para <strong>ENVÍO GRATIS</strong> a
                          domicilio.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shipping-progress-track">
                    <div
                      className="shipping-progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Lista de Artículos */}
                <div className="cart-table-card">
                  <div className="cart-table-header">
                    <span>Producto / Variante</span>
                    <span className="text-center">Precio</span>
                    <span className="text-center">Cantidad</span>
                    <span className="text-right">Subtotal</span>
                  </div>

                  <div className="cart-table-body">
                    {cart.map((item) => {
                      const itemKey = item.variantId
                        ? `var-${item.variantId}`
                        : `${item.product.id}-${item.selectedSize}-${item.selectedColor}`;

                      const hasStockLimit =
                        item.stock_disponible !== undefined &&
                        item.quantity >= item.stock_disponible;

                      return (
                        <div key={itemKey} className="cart-table-row">
                          {/* Producto + Imagen + Talla/Color */}
                          <div className="cart-row-product">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="cart-row-image"
                            />
                            <div className="cart-row-info">
                              <h3
                                className="cart-row-title"
                                onClick={() => navigate(`/product/${item.product.id}`)}
                              >
                                {item.product.name}
                              </h3>
                              <div className="cart-row-variant-tags">
                                {item.selectedSize && (
                                  <span className="tag-pill">Talla: {item.selectedSize}</span>
                                )}
                                {item.selectedColor && (
                                  <span className="tag-pill">Color: {item.selectedColor}</span>
                                )}
                                {item.sku && (
                                  <span className="tag-pill sku-pill">SKU: {item.sku}</span>
                                )}
                              </div>

                              {item.stock_disponible !== undefined && (
                                <div className="stock-warning-line">
                                  {item.stock_disponible > 0 ? (
                                    <span className="stock-ok">
                                      Disponibles: {item.stock_disponible} unid.
                                    </span>
                                  ) : (
                                    <span className="stock-empty">
                                      <AlertTriangle size={13} /> Agotado en sucursales
                                    </span>
                                  )}
                                </div>
                              )}

                              <button
                                type="button"
                                className="btn-remove-row-mobile"
                                onClick={() => removeFromCart(item.product.id, item.variantId)}
                              >
                                <Trash2 size={14} />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          </div>

                          {/* Precio Unitario */}
                          <div className="cart-row-price text-center">
                            {item.product.originalPrice &&
                              item.product.originalPrice > item.product.price && (
                                <div className="orig-price">
                                  {item.product.originalPrice.toFixed(2)} Bs
                                </div>
                              )}
                            <div className="current-price">
                              {item.product.price.toFixed(2)} Bs
                            </div>
                          </div>

                          {/* Selector de Cantidad */}
                          <div className="cart-row-qty text-center">
                            <div className="cart-qty-ctrl">
                              <button
                                type="button"
                                className="btn-qty-action"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1,
                                    item.variantId,
                                  )
                                }
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="qty-number">{item.quantity}</span>
                              <button
                                type="button"
                                className="btn-qty-action"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1,
                                    item.variantId,
                                  )
                                }
                                disabled={hasStockLimit}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            {hasStockLimit && (
                              <span className="max-qty-note">Límite alcanzado</span>
                            )}
                          </div>

                          {/* Subtotal + Botón Eliminar Desktop */}
                          <div className="cart-row-subtotal text-right">
                            <span className="subtotal-val">
                              {(item.product.price * item.quantity).toFixed(2)} Bs
                            </span>
                            <button
                              type="button"
                              className="btn-remove-row-desktop"
                              onClick={() => removeFromCart(item.product.id, item.variantId)}
                              title="Eliminar de la bolsa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reglas e Información del Carrito */}
                <div className="cart-guarantee-grid">
                  <div className="guarantee-item">
                    <ShieldCheck size={22} className="guarantee-icon" />
                    <div>
                      <h4>Validación en Backend</h4>
                      <p>
                        Precios y promociones verificados en tiempo real antes de procesar el pago.
                      </p>
                    </div>
                  </div>
                  <div className="guarantee-item">
                    <RotateCcw size={22} className="guarantee-icon" />
                    <div>
                      <h4>Inventario Seguro</h4>
                      <p>
                        El carrito no retiene stock; la salida se confirma al finalizar la compra.
                      </p>
                    </div>
                  </div>
                  <div className="guarantee-item">
                    <Truck size={22} className="guarantee-icon" />
                    <div>
                      <h4>Envío Rápido y Seguro</h4>
                      <p>Despacho directo desde nuestras sucursales a nivel nacional.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Resumen de Pedido */}
              <div className="cart-summary-section">
                <div className="cart-summary-card">
                  <h3 className="summary-title">Resumen de Compra</h3>

                  <div className="summary-lines">
                    <div className="summary-line">
                      <span>Artículos ({cartItemCount})</span>
                      <span>{cartTotal.toFixed(2)} Bs</span>
                    </div>

                    {backendCart && backendCart.ahorro_total > 0 && (
                      <div className="summary-line savings-line">
                        <span>Ahorro en Promociones</span>
                        <span>-{backendCart.ahorro_total.toFixed(2)} Bs</span>
                      </div>
                    )}

                    <div className="summary-line">
                      <span>Costo de Envío</span>
                      <span>{shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)} Bs`}</span>
                    </div>

                    <div className="summary-divider" />

                    <div className="summary-line total-highlight">
                      <span>Total a Pagar</span>
                      <span className="total-digits">{totalConEnvio.toFixed(2)} Bs</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-proceed-checkout"
                    onClick={handleCheckout}
                    disabled={isCartLoading || cart.length === 0}
                  >
                    <span>Continuar Compra</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    className="btn-keep-shopping"
                    onClick={() => navigate('/catalog')}
                  >
                    Seguir Comprando
                  </button>

                  <div className="payment-security-badges">
                    <p className="badges-label">Medios de Pago Soportados:</p>
                    <div className="badge-logos">
                      <span className="pay-chip">Stripe</span>
                      <span className="pay-chip">QR Simple</span>
                      <span className="pay-chip">Transferencia</span>
                      <span className="pay-chip">POS Sucursal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
