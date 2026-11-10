import React, { useState, useEffect } from 'react';
import { appearanceService } from '../modules/users-security/use-cases/CU08-personalizar-apariencia/services/appearance.service';
import type { AppearanceData } from '../modules/users-security/use-cases/CU08-personalizar-apariencia/services/appearance.service';
import { CatalogApi } from '../modules/catalog/services/catalog.api';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { CartDrawer } from '../components/shop/CartDrawer';
import { WishlistDrawer } from '../components/shop/WishlistDrawer';
import { useShop } from '../context/ShopContext';
import { CATEGORIES, FEATURED_COLLECTIONS, PRODUCTS } from '../data/mockProducts';
import type { Product } from '../types/shop.types';
import './HomePage.css';


interface TenantTheme {
  name: string;
  badge: string;
  headline: string;
  subheadline: string;
  description: string;
  heroImage: string;
  accentColor: string;
  trust1: { icon: string; title: string; desc: string };
  trust2: { icon: string; title: string; desc: string };
  trust3: { icon: string; title: string; desc: string };
  lookbookTitle: string;
}

const TENANTS_THEME: Record<string, TenantTheme> = {
  'aura-sport': {
    name: 'Aura Athletics & Sportswear',
    badge: 'HIGH PERFORMANCE 2026',
    headline: 'Supera Tus Límites',
    subheadline: 'Alto Rendimiento',
    description: 'Descubre prendas de compresión Seamless, calzado técnico de running y accesorios diseñados para optimizar cada entrenamiento.',
    heroImage: 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg',
    accentColor: '#00F2FE',
    trust1: { icon: '⚡', title: 'Envío Atleta', desc: 'En compras más de 300 Bs' },
    trust2: { icon: '🛡️', title: 'Garantía Pro', desc: '30 días de prueba activa' },
    trust3: { icon: '💳', title: 'Pago Seguro', desc: 'QR, Tarjeta & Bancos' },
    lookbookTitle: 'Aura Speed Series Lookbook',
  },
  'urbanly': {
    name: 'Urbanly Fashion Store',
    badge: 'AESTHETIC & STREETWEAR 2026',
    headline: 'AESTHETIC T-SHIRTS &',
    subheadline: 'OVERSIZED ESSENTIALS',
    description: 'Streetwear contemporáneo para hombre y mujer: siluetas holgadas, hoodies boxy-fit de 500 GSM, pantalones cargo y estética neutral tones.',
    heroImage: 'https://fashionstorestorages.blob.core.windows.net/portada/portada_uno.png',
    accentColor: '#4D5645',
    trust1: { icon: '📦', title: 'Drop Nacional', desc: 'Despacho rápido express' },
    trust2: { icon: '⚡', title: '500 GSM Heavy', desc: 'Calidad superior de algodón' },
    trust3: { icon: '🛡️', title: 'Pago Seguro', desc: 'QR, Tarjeta & Bancos' },
    lookbookTitle: 'Urbanly Streetwear Lookbook',
  },
  'dressly': {
    name: 'Dressly Fashion Store',
    badge: 'NUEVA COLECCIÓN 2026',
    headline: 'Eleva Tu',
    subheadline: 'Estilo Cotidiano',
    description: 'Descubre prendas atemporales diseñadas para el máximo confort y la más pura elegancia. Confeccionadas pensando en ti.',
    heroImage: 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg',
    accentColor: '#C4956A',
    trust1: { icon: '🚚', title: 'Envío Gratis', desc: 'En compras más de 350 Bs' },
    trust2: { icon: '🔄', title: 'Devolución Fácil', desc: '30 días sin costo' },
    trust3: { icon: '🛡️', title: 'Pago 100% Seguro', desc: 'QR, Tarjeta & Bancos' },
    lookbookTitle: 'Dressly Elegance Lookbook',
  },
};

export const HomePage: React.FC = () => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,

    toastMessage,
    setIsCartOpen,
    selectedCategory,
  } = useShop();

  const [activeSlide, setActiveSlide] = useState(1);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [showLookbookModal, setShowLookbookModal] = useState(false);
  const navigate = useNavigate();
  const { tenant } = useParams<{ tenant?: string }>();
  const rawTenant = tenant || localStorage.getItem('tenantKey') || 'urbanly';
  const resolvedTenant = rawTenant === 'subversive-urban' || rawTenant === 'subversive'
    ? 'urbanly' 
    : (rawTenant === 'aura' ? 'aura-sport' : rawTenant);
  const activeTenantKey = (resolvedTenant && TENANTS_THEME[resolvedTenant]) ? resolvedTenant : 'urbanly';
  const currentTheme = TENANTS_THEME[activeTenantKey];

  const [appearance, setAppearance] = useState<AppearanceData | null>(null);
  const [dynamicProducts, setDynamicProducts] = useState<Product[]>([]);

  useEffect(() => {
    localStorage.setItem('tenantKey', activeTenantKey);
    appearanceService.getPublicAppearance(activeTenantKey).then((data) => {
      if (data) {
        setAppearance(data);
        if (data.primary_color) {
          document.documentElement.style.setProperty('--color-primary', data.primary_color);
        }
        if (data.secondary_color) {
          document.documentElement.style.setProperty('--color-secondary', data.secondary_color);
        }
        if (data.accent_color) {
          document.documentElement.style.setProperty('--color-accent', data.accent_color);
        }
        if (data.font_family) {
          document.documentElement.style.setProperty('--font-display', data.font_family);
        }
        if (data.storefront_bg_color) {
          document.documentElement.style.setProperty('--storefront-hero-bg', data.storefront_bg_color);
        }
      }
    }).catch((err) => console.warn('Usando tema predeterminado para vitrina:', err));

    CatalogApi.getProducts({ limit: 10 })
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          const mapped: Product[] = res.data.map((cp) => ({
            id: cp.id_producto,
            name: cp.nombre,
            category: cp.categoria?.nombre || 'General',
            categorySlug: cp.categoria?.nombre?.toLowerCase().replace(/\s+/g, '-') || 'general',
            price: cp.precio_final,
            originalPrice: cp.tiene_descuento ? cp.precio_base : undefined,
            rating: 4.9,
            reviewsCount: 16,
            image: cp.imagen_principal || 'https://fashionstorestorages.blob.core.windows.net/productos/hoodie_boxy.png',
            isNew: true,
            isSale: cp.tiene_descuento,
            description: cp.descripcion || '',
            sizes: cp.tallas_disponibles.map((t) => t.codigo),
            colors: cp.colores_disponibles.map((c) => c.nombre),
          }));
          setDynamicProducts(mapped);
        }
      })
      .catch((err) => console.warn('Usando mock fallback para homepage:', err));
  }, [activeTenantKey]);

  // Filtrar productos para la portada (de API con fallback a mock)
  const homeProducts = dynamicProducts.length > 0 ? dynamicProducts : PRODUCTS.slice(0, 10);

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
      <section
        id="hero-section"
        className="hero-section"
        style={{ backgroundColor: appearance?.storefront_bg_color || undefined }}
      >
        <div className="hero-grid">
          {/* Left Hero Content */}
          <div className="hero-content">
            <span
              className="hero-subtitle-tag"
              style={{ color: appearance?.secondary_color || undefined }}
            >
              {appearance?.badge || currentTheme.badge}
            </span>
            <h1
              className="hero-headline"
              style={{
                fontFamily: appearance?.font_family || undefined,
                color: appearance?.primary_color || undefined,
              }}
            >
              {appearance?.hero_headline || currentTheme.headline} <br />
              {appearance?.hero_subheadline || currentTheme.subheadline}
            </h1>
            <p className="hero-description">
              {appearance?.hero_description || currentTheme.description}
            </p>

            <div className="hero-actions">
              <button
                className="hero-cta-btn"
                style={{ backgroundColor: appearance?.primary_color || undefined }}
                onClick={() => navigate(`/store/${activeTenantKey}/catalog`)}
              >
                <span>{appearance?.cta_primary_text || 'Comprar Ahora'}</span>
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
                <span>{appearance?.cta_secondary_text || 'Ver Lookbook'}</span>
              </button>
            </div>

            {/* Hero Trust Micro-Badges */}
            <div className="hero-trust-row">
              <div className="trust-item">
                <span className="trust-icon">{currentTheme.trust1.icon}</span>
                <div>
                  <strong>{appearance?.trust1_title || currentTheme.trust1.title}</strong>
                  <p>{appearance?.trust1_desc || currentTheme.trust1.desc}</p>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-icon">{currentTheme.trust2.icon}</span>
                <div>
                  <strong>{appearance?.trust2_title || currentTheme.trust2.title}</strong>
                  <p>{appearance?.trust2_desc || currentTheme.trust2.desc}</p>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-icon">{currentTheme.trust3.icon}</span>
                <div>
                  <strong>{appearance?.trust3_title || currentTheme.trust3.title}</strong>
                  <p>{appearance?.trust3_desc || currentTheme.trust3.desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Editorial Image */}
          <div className="hero-image-wrapper">
            <div className="hero-image-container">
              <img
                src={
                  activeSlide === 2
                    ? (appearance?.hero_banner_secondary_url || 'https://fashionstorestorages.blob.core.windows.net/portada/portada_unodos.png')
                    : (appearance?.hero_banner_url || currentTheme.heroImage)
                }
                alt={currentTheme.name}
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
                    navigate(`/store/${activeTenantKey}/catalog?category=${cat.slug}`);
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
              onClick={() => navigate(`/store/${activeTenantKey}/catalog`)}
            >
              Ver Todas las Categorías →
            </button>
          </div>

          <div className="collections-quad-grid">
            {FEATURED_COLLECTIONS.map((col) => (
              <div
                key={col.id}
                className="collection-card"
                onClick={() => navigate(`/store/${activeTenantKey}/catalog?category=${col.categorySlug}`)}
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
                  onClick={() => navigate(activeTenantKey === 'urbanly' ? `/store/${activeTenantKey}/catalog?category=Streetwear` : `/store/${activeTenantKey}/catalog?category=blazers`)}
                >
                  {activeTenantKey === 'urbanly' ? 'Ver Colección Heavyweight →' : 'Ver Colección Lino →'}
                </button>
              </div>
              <div className="promo-img-side">
                <img
                  src={
                    appearance?.promo1_image_url ||
                    (activeTenantKey === 'urbanly' ? 'https://fashionstorestorages.blob.core.windows.net/portada/portada_dos.png' : 'https://fashionstorestorages.blob.core.windows.net/productos/linen-collection.jpg')
                  }
                  alt="Colección Destacada"
                />
              </div>
            </div>

            {/* Promo 2: Fresh Styles */}
            <div className="promo-banner-card promo-fresh">
              <div className="promo-text-side">
                <span className="promo-tag">
                  {activeTenantKey === 'urbanly' ? 'STREETWEAR & HEAVYWEIGHT' : 'MARROQUINERÍA & ACCESORIOS'}
                </span>
                <h3 className="promo-title">
                  {activeTenantKey === 'urbanly' ? 'Cargos & Outerwear Industrial' : 'Bolsos en Moca & Negro Profundo'}
                </h3>
                <button
                  className="promo-action-btn"
                  onClick={() => navigate(activeTenantKey === 'urbanly' ? `/store/${activeTenantKey}/catalog?category=Pantalones` : `/store/${activeTenantKey}/catalog?category=bolsos`)}
                >
                  {activeTenantKey === 'urbanly' ? 'Ver Streetwear →' : 'Ver Accesorios →'}
                </button>
              </div>
              <div className="promo-img-side">
                <img
                  src={
                    appearance?.promo2_image_url ||
                    (activeTenantKey === 'urbanly' ? 'https://fashionstorestorages.blob.core.windows.net/portada/portada_tres.png' : 'https://fashionstorestorages.blob.core.windows.net/productos/accessories.jpg')
                  }
                  alt="Accesorios y Prendas Destacadas"
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
              onClick={() => navigate(`/store/${activeTenantKey}/catalog`)}
            >
              Ver Todo el Catálogo →
            </button>
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {homeProducts.map((product) => {
                const isFavorited = isInWishlist(product.id);
                return (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => navigate(`/store/${activeTenantKey}/product/${product.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
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
                src={
                  appearance?.newsletter_banner_url ||
                  (activeTenantKey === 'urbanly' ? 'https://fashionstorestorages.blob.core.windows.net/portada/portada_cuatro.png' : 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg')
                }
                alt="Style Club"
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
              <span className="footer-brand-name">{activeTenantKey === 'urbanly' ? 'URBANLY' : (activeTenantKey === 'aura-sport' ? 'AURA SPORT' : 'DRESSLY')}</span>
              <span className="footer-brand-tagline">{appearance?.tagline || (activeTenantKey === 'urbanly' ? 'AESTHETIC STREETWEAR' : (activeTenantKey === 'aura-sport' ? 'ATHLETICS & GEAR' : 'FASHION STORE'))}</span>
              <p className="footer-brand-desc">
                {appearance?.hero_description || currentTheme.description}
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
              <h5>{activeTenantKey === 'urbanly' ? 'STREETWEAR ARCHIVE' : (activeTenantKey === 'aura-sport' ? 'COLECCIÓN ATLETA' : 'TIENDA OFICIAL')}</h5>
              <ul>
                <li><Link to={`/store/${activeTenantKey}/catalog`} onClick={() => window.scrollTo(0, 0)}>Todas las Prendas</Link></li>
                <li><Link to={`/store/${activeTenantKey}/catalog?category=${activeTenantKey === 'urbanly' ? 'Hoodies' : 'blazers'}`} onClick={() => window.scrollTo(0, 0)}>{activeTenantKey === 'urbanly' ? 'Hoodies & Sudaderas' : 'Blazers & Trajes'}</Link></li>
                <li><Link to={`/store/${activeTenantKey}/catalog?category=${activeTenantKey === 'urbanly' ? 'Pantalones' : 'vestidos'}`} onClick={() => window.scrollTo(0, 0)}>{activeTenantKey === 'urbanly' ? 'Cargos & Parachutes' : 'Vestidos de Gala'}</Link></li>
                <li><Link to={`/store/${activeTenantKey}/catalog?category=${activeTenantKey === 'urbanly' ? 'Poleras' : 'bolsos'}`} onClick={() => window.scrollTo(0, 0)}>{activeTenantKey === 'urbanly' ? 'Poleras Oversize' : 'Bolsos & Marroquinería'}</Link></li>
                <li><Link to={`/store/${activeTenantKey}/catalog?sale=true`} onClick={() => window.scrollTo(0, 0)}>Rebajas Especiales</Link></li>
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
                <li><Link to={`/store/${activeTenantKey}/sucursales`}>Nuestras Sucursales</Link></li>
                <li><a href="#press">Prensa & Moda</a></li>
                <li><a href="#careers">Trabaja con Nosotros</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>© {new Date().getFullYear()} {currentTheme.name}. Todos los derechos reservados.</p>
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
              <h3>{currentTheme.lookbookTitle || 'Lookbook 2026'}</h3>
              <button className="lookbook-close" onClick={() => setShowLookbookModal(false)}>✕</button>
            </div>
            <div className="lookbook-gallery">
              <img src={appearance?.hero_banner_url || currentTheme.heroImage} alt="Look Principal" />
              <img src={appearance?.promo1_image_url || 'https://fashionstorestorages.blob.core.windows.net/portada/portada_dos.png'} alt="Colección Destacada" />
              <img src={appearance?.promo2_image_url || 'https://fashionstorestorages.blob.core.windows.net/portada/portada_tres.png'} alt="Drop de Temporada" />
            </div>
            <div className="lookbook-footer">
              <button
                className="lookbook-shop-btn"
                onClick={() => {
                  setShowLookbookModal(false);
                  navigate(`/store/${activeTenantKey}/catalog`);
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
