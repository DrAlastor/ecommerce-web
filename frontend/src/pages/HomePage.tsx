import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { CartDrawer } from '../components/shop/CartDrawer';
import { WishlistDrawer } from '../components/shop/WishlistDrawer';
import { useShop } from '../context/ShopContext';
import { CATEGORIES, FEATURED_COLLECTIONS, PRODUCTS } from '../data/mockProducts';
import type { Product } from '../types/shop.types';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    searchQuery,
    selectedCategory,
    setSelectedCategory,
    toastMessage,
    setIsCartOpen,
  } = useShop();

  const [activeSlide, setActiveSlide] = useState(1);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [showLookbookModal, setShowLookbookModal] = useState(false);

  // Filtrar productos por categoría y por búsqueda
  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'sale' ? product.isSale : product.categorySlug === selectedCategory);

    const matchesSearch =
      searchQuery.trim() === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <div className="home-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="toast-notification">
          <span className="toast-icon">✨</span>
          <span className="toast-text">{toastMessage}</span>
          <button
            className="toast-view-cart"
            onClick={() => setIsCartOpen(true)}
          >
            Ver bolsa
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar />

      {/* Slide-over Drawers */}
      <CartDrawer />
      <WishlistDrawer />

      {/* HERO SECTION */}
      <section id="hero-section" className="hero-section">
        <div className="hero-grid">
          {/* Left Hero Content */}
          <div className="hero-content">
            <span className="hero-subtitle-tag">NUEVA COLECCIÓN 2026</span>
            <h1 className="hero-headline">
              Eleva Tu <br />
              Estilo Cotidiano
            </h1>
            <p className="hero-description">
              Descubre prendas atemporales diseñadas para el máximo confort y la más pura elegancia. Confeccionadas pensando en ti.
            </p>

            <div className="hero-actions">
              <button
                className="hero-cta-btn"
                onClick={() => {
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Comprar Ahora</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <button
                className="hero-lookbook-btn"
                onClick={() => setShowLookbookModal(true)}
              >
                <div className="play-icon-circle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
                <span>Ver Lookbook</span>
              </button>
            </div>

            {/* Hero Trust Micro-Badges */}
            <div className="hero-trust-row">
              <div className="trust-item">
                <span className="trust-icon">🚚</span>
                <div>
                  <strong>Envío Gratis</strong>
                  <p>En compras más de 350 Bs</p>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🔄</span>
                <div>
                  <strong>Devolución Fácil</strong>
                  <p>30 días sin costo</p>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🛡️</span>
                <div>
                  <strong>Pago 100% Seguro</strong>
                  <p>QR, Tarjeta & Bancos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Editorial Image */}
          <div className="hero-image-wrapper">
            <div className="hero-image-container">
              <img
                src="https://fashionstorestorage.blob.core.windows.net/productos/hero-model.jpg"
                alt="Dressly Colección Exclusiva de Lino Femenino"
                className="hero-main-img"
              />
              <div className="hero-slide-indicators">
                <button
                  className={`slide-dot ${activeSlide === 1 ? 'active' : ''}`}
                  onClick={() => setActiveSlide(1)}
                >
                  01
                </button>
                <button
                  className={`slide-dot ${activeSlide === 2 ? 'active' : ''}`}
                  onClick={() => setActiveSlide(2)}
                >
                  02
                </button>
                <button
                  className={`slide-dot ${activeSlide === 3 ? 'active' : ''}`}
                  onClick={() => setActiveSlide(3)}
                >
                  03
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CIRCULAR CATEGORY PILLS ("Shop by Category") */}
      <section className="circular-categories-section">
        <div className="section-container">
          <div className="circular-categories-row">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  className={`category-circle-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    const el = document.getElementById('products-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <div className="circle-image-wrapper">
                    {cat.slug === 'sale' ? (
                      <div className="circle-sale-badge">SALE</div>
                    ) : (
                      <img src={cat.image} alt={cat.name} />
                    )}
                  </div>
                  <span className="circle-category-name">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED EDITORIAL COLLECTIONS ("Find Your Perfect Style") */}
      <section id="category-showcase" className="featured-collections-section">
        <div className="section-container">
          <div className="section-header-row">
            <div>
              <span className="section-sub-label">COMPRA POR CATEGORÍA</span>
              <h2 className="section-main-title">Encuentra Tu Estilo Perfecto</h2>
            </div>
            <button
              className="view-all-link-btn"
              onClick={() => {
                setSelectedCategory('all');
                const el = document.getElementById('products-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Ver Todas las Categorías →
            </button>
          </div>

          <div className="collections-quad-grid">
            {FEATURED_COLLECTIONS.map((col) => (
              <div
                key={col.id}
                className="collection-card"
                onClick={() => {
                  setSelectedCategory(col.categorySlug);
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <img src={col.image} alt={col.title} className="collection-card-img" />
                <div className="collection-card-overlay">
                  <div className="collection-card-content">
                    <h3 className="collection-card-title">{col.title}</h3>
                    <p className="collection-card-subtitle">{col.subtitle}</p>
                    <span className="collection-explore-link">
                      {col.actionText} →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT PROMO BANNERS */}
      <section className="promo-split-section">
        <div className="section-container">
          <div className="promo-split-grid">
            {/* Promo 1: Spring Sale */}
            <div className="promo-banner-card promo-spring">
              <div className="promo-text-side">
                <span className="promo-tag">COLECCIÓN ATEMPORAL</span>
                <h3 className="promo-title">Lino Natural & Tonos Tierra</h3>
                <button
                  className="promo-action-btn"
                  onClick={() => {
                    setSelectedCategory('blazers');
                    const el = document.getElementById('products-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Ver Colección Lino →
                </button>
              </div>
              <div className="promo-img-side">
                <img
                  src="https://fashionstorestorage.blob.core.windows.net/productos/linen-collection.jpg"
                  alt="Colección Lino Natural Femenino"
                />
              </div>
            </div>

            {/* Promo 2: Fresh Styles */}
            <div className="promo-banner-card promo-fresh">
              <div className="promo-text-side">
                <span className="promo-tag">MARROQUINERÍA & ACCESORIOS</span>
                <h3 className="promo-title">Bolsos en Moca & Negro Profundo</h3>
                <button
                  className="promo-action-btn"
                  onClick={() => {
                    setSelectedCategory('bolsos');
                    const el = document.getElementById('products-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Ver Accesorios →
                </button>
              </div>
              <div className="promo-img-side">
                <img
                  src="https://fashionstorestorage.blob.core.windows.net/productos/accessories.jpg"
                  alt="Bolsos y Accesorios de Lujo"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT CATALOG ("Our Most Loved Picks") */}
      <section id="products-section" className="products-showcase-section">
        <div className="section-container">
          <div className="section-header-row">
            <div>
              <span className="section-sub-label">LOS MÁS VENDIDOS</span>
              <h2 className="section-main-title">Nuestros Favoritos de Temporada</h2>
            </div>
            <button
              className="view-all-link-btn"
              onClick={() => setSelectedCategory('all')}
            >
              Ver Todo el Catálogo ({PRODUCTS.length}) →
            </button>
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="catalog-filters-bar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`catalog-filter-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search query notification */}
          {searchQuery && (
            <div className="search-active-notice">
              Mostrando resultados para: <strong>"{searchQuery}"</strong> (
              {filteredProducts.length} encontrados)
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="no-products-found">
              <p>No se encontraron productos que coincidan con los filtros seleccionados.</p>
              <button
                className="reset-filters-btn"
                onClick={() => setSelectedCategory('all')}
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => {
                const isFavorited = isInWishlist(product.id);
                return (
                  <div key={product.id} className="product-card">
                    {/* Media container */}
                    <div className="product-card-media">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="product-card-img"
                      />

                      {/* Badges */}
                      <div className="product-badges-corner">
                        {product.isNew && <span className="badge-pill badge-new">NUEVO</span>}
                        {product.isSale && <span className="badge-pill badge-sale">OFERTA</span>}
                      </div>

                      {/* Wishlist Heart Button */}
                      <button
                        className={`product-wishlist-toggle ${isFavorited ? 'favorited' : ''}`}
                        onClick={() => toggleWishlist(product.id)}
                        aria-label="Guardar en favoritos"
                        title="Guardar en favoritos"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorited ? '#DC2626' : 'none'} stroke={isFavorited ? '#DC2626' : '#1A1A1A'} strokeWidth="1.8">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>

                      {/* Quick Add Overlay */}
                      <button
                        className="quick-add-btn"
                        onClick={(e) => handleQuickAdd(product, e)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        <span>Añadir a la Bolsa</span>
                      </button>
                    </div>

                    {/* Info */}
                    <div className="product-card-info">
                      <h4 className="product-title">{product.name}</h4>

                      <div className="product-price-row">
                        <span className="product-price">{product.price.toFixed(2)} Bs</span>
                        {product.originalPrice && (
                          <span className="product-old-price">{product.originalPrice.toFixed(2)} Bs</span>
                        )}
                      </div>

                      {/* Ratings */}
                      <div className="product-rating-row">
                        <div className="star-icons">
                          {'★'.repeat(Math.floor(product.rating))}
                        </div>
                        <span className="reviews-count">({product.reviewsCount})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* TRUST / VALUES BANNER */}
      <section className="trust-banner-section">
        <div className="section-container">
          <div className="trust-grid">
            <div className="trust-card">
              <span className="trust-card-icon">🚚</span>
              <h4>Envío Gratuito</h4>
              <p>En compras superiores a 350 Bs a cualquier ciudad de Bolivia.</p>
            </div>
            <div className="trust-card">
              <span className="trust-card-icon">📦</span>
              <h4>Devoluciones Fáciles</h4>
              <p>30 días de periodo de cambio sin costo adicional.</p>
            </div>
            <div className="trust-card">
              <span className="trust-card-icon">🛡️</span>
              <h4>Pagos 100% Seguros</h4>
              <p>Transferencia, QR Simple y tarjetas bancarias habilitadas.</p>
            </div>
            <div className="trust-card">
              <span className="trust-card-icon">🎧</span>
              <h4>Soporte Exclusivo</h4>
              <p>Asesoría personalizada en tallas y estilismo femenino.</p>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER / STYLE LIST */}
      <section className="newsletter-section">
        <div className="section-container">
          <div className="newsletter-card">
            <div className="newsletter-image-side">
              <img
                src="https://fashionstorestorage.blob.core.windows.net/productos/hero-model.jpg"
                alt="Dressly Style Club"
              />
            </div>
            <div className="newsletter-form-side">
              <span className="newsletter-tag">OBTÉN 10% DE DESCUENTO EN TU PRIMER PEDIDO</span>
              <h3 className="newsletter-title">Únete a Nuestro Style List</h3>
              <p className="newsletter-desc">
                Suscríbete para recibir lanzamientos exclusivos, colecciones cápsula de temporada e inspiración de moda femenina.
              </p>

              {newsletterSubscribed ? (
                <div className="newsletter-success">
                  🎉 ¡Gracias por unirte! Usa el código <strong>DRESSLY10</strong> al pagar para tu 10% de descuento.
                </div>
              ) : (
                <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                  <input
                    type="email"
                    required
                    placeholder="Introduce tu correo electrónico"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="newsletter-input"
                  />
                  <button type="submit" className="newsletter-submit-btn">
                    Suscribirse
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="section-container">
          <div className="footer-top-grid">
            {/* Col 1: Brand */}
            <div className="footer-brand-col">
              <span className="footer-brand-name">DRESSLY</span>
              <span className="footer-brand-tagline">FASHION STORE</span>
              <p className="footer-brand-desc">
                Moda femenina atemporal confeccionada en lino, seda y piel. Estilo sofisticado y minimalista diseñado para la mujer contemporánea.
              </p>
              <div className="footer-social-icons">
                <span className="social-icon">📸</span>
                <span className="social-icon">📘</span>
                <span className="social-icon">📌</span>
                <span className="social-icon">🎵</span>
              </div>
            </div>

            {/* Col 2: Tienda */}
            <div className="footer-links-col">
              <h5>TIENDA FEMENINA</h5>
              <ul>
                <li><a href="#products-section" onClick={() => setSelectedCategory('all')}>Todas las Prendas</a></li>
                <li><a href="#products-section" onClick={() => setSelectedCategory('blazers')}>Blazers & Trajes</a></li>
                <li><a href="#products-section" onClick={() => setSelectedCategory('vestidos')}>Vestidos de Gala & Lino</a></li>
                <li><a href="#products-section" onClick={() => setSelectedCategory('bolsos')}>Bolsos & Marroquinería</a></li>
                <li><a href="#products-section" onClick={() => setSelectedCategory('sale')}>Rebajas Especiales</a></li>
              </ul>
            </div>

            {/* Col 3: Atención al cliente */}
            <div className="footer-links-col">
              <h5>ATENCIÓN AL CLIENTE</h5>
              <ul>
                <li><a href="#contact">Contáctanos</a></li>
                <li><a href="#shipping">Envíos y Entregas</a></li>
                <li><a href="#returns">Cambios y Devoluciones</a></li>
                <li><a href="#size-guide">Guía de Tallas</a></li>
                <li><a href="#faq">Preguntas Frecuentes</a></li>
              </ul>
            </div>

            {/* Col 4: Sobre nosotros */}
            <div className="footer-links-col">
              <h5>SOBRE NOSOTROS</h5>
              <ul>
                <li><a href="#story">Nuestra Historia</a></li>
                <li><a href="#sustainability">Sostenibilidad</a></li>
                <li><a href="#stores">Nuestras Sucursales</a></li>
                <li><a href="#press">Prensa & Moda</a></li>
                <li><a href="#careers">Trabaja con Nosotros</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>© {new Date().getFullYear()} Dressly Fashion Store. Todos los derechos reservados.</p>
            <div className="footer-legal-links">
              <a href="#privacy">Política de Privacidad</a>
              <span>•</span>
              <a href="#terms">Términos de Servicio</a>
              <span>•</span>
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* LOOKBOOK MODAL */}
      {showLookbookModal && (
        <div className="lookbook-modal-overlay" onClick={() => setShowLookbookModal(false)}>
          <div className="lookbook-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lookbook-modal-header">
              <h3>Lookbook Primavera / Verano 2026</h3>
              <button className="lookbook-close" onClick={() => setShowLookbookModal(false)}>✕</button>
            </div>
            <div className="lookbook-gallery">
              <img src="https://fashionstorestorage.blob.core.windows.net/productos/hero-model.jpg" alt="Look Sastrería & Lino" />
              <img src="https://fashionstorestorage.blob.core.windows.net/productos/linen-collection.jpg" alt="Colección Lino Natural" />
              <img src="https://fashionstorestorage.blob.core.windows.net/productos/accessories.jpg" alt="Marroquinería & Accesorios" />
            </div>
            <div className="lookbook-footer">
              <button
                className="lookbook-shop-btn"
                onClick={() => {
                  setShowLookbookModal(false);
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Comprar Estos Looks →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
