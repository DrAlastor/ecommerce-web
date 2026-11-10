import React, { useState, useEffect } from 'react';
import { appearanceService } from '../modules/users-security/use-cases/CU08-personalizar-apariencia/services/appearance.service';
import type { AppearanceData } from '../modules/users-security/use-cases/CU08-personalizar-apariencia/services/appearance.service';
import { CatalogApi } from '../modules/catalog/services/catalog.api';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { CartDrawer } from '../components/shop/CartDrawer';
import { WishlistDrawer } from '../components/shop/WishlistDrawer';
import { useShop } from '../context/ShopContext';
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
    badge: 'PRO SERIES 2026',
    headline: 'PERFORMANCE',
    subheadline: 'MEETS STYLE',
    description: 'Ropa técnica de alto impacto diseñada para maximizar tu rendimiento físico y estilo diario.',
    heroImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1600&auto=format&fit=crop',
    accentColor: '#00F2FE',
    trust1: { icon: '⚡', title: 'Envío Atleta', desc: 'En compras más de 300 Bs' },
    trust2: { icon: '🛡️', title: 'Garantía Pro', desc: '30 días de prueba activa' },
    trust3: { icon: '💳', title: 'Pago Seguro', desc: 'QR, Tarjeta & Bancos' },
    lookbookTitle: 'Aura Speed Series Lookbook',
  },
  'urbanly': {
    name: 'Urbanly Fashion Store',
    badge: 'NEUTRAL TONES DROP',
    headline: 'AESTHETIC T-SHIRTS &',
    subheadline: 'OVERSIZED ESSENTIALS',
    description: 'Siluetas holgadas, tonos tierra neutros y algodón pesado 500 GSM diseñados para el movimiento contemporáneo.',
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

interface TenantCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
}

const TENANT_CATEGORIES: Record<string, TenantCategory[]> = {
  'dressly': [
    { id: 'all', name: 'Todo', slug: 'all', image: 'https://fashionstorestorages.blob.core.windows.net/productos/conjunto_limono.png' },
    { id: 'vestidos', name: 'Vestidos', slug: 'vestidos', image: 'https://fashionstorestorages.blob.core.windows.net/productos/vestido_sleep.jpg' },
    { id: 'blazers', name: 'Blazers & Abrigos', slug: 'blazers', image: 'https://fashionstorestorages.blob.core.windows.net/productos/chaleco_sastre.png' },
    { id: 'tops', name: 'Tops & Blusas', slug: 'tops', image: 'https://fashionstorestorages.blob.core.windows.net/productos/top_punto.jpg' },
    { id: 'pantalones', name: 'Pantalones & Faldas', slug: 'pantalones', image: 'https://fashionstorestorages.blob.core.windows.net/productos/pantalon_palazo.png' },
    { id: 'bolsos', name: 'Bolsos & Carteras', slug: 'bolsos', image: 'https://fashionstorestorages.blob.core.windows.net/productos/bolso_tote.png' },
    { id: 'calzado', name: 'Calzado & Mocasines', slug: 'calzado', image: 'https://fashionstorestorages.blob.core.windows.net/productos/mocasines_italiano.png' },
    { id: 'accesorios', name: 'Accesorios & Joyería', slug: 'accesorios', image: 'https://fashionstorestorages.blob.core.windows.net/productos/cinturon_becerro.png' },
    { id: 'sale', name: 'Ofertas', slug: 'sale', image: 'https://fashionstorestorages.blob.core.windows.net/productos/vestido_noche.jpg' },
  ],
  'urbanly': [
    { id: 'all', name: 'Todo', slug: 'all', image: 'https://fashionstorestorages.blob.core.windows.net/productos/hoodie_boxy.png' },
    { id: 'hoodies', name: 'Hoodies Boxy 500GSM', slug: 'hoodies', image: 'https://fashionstorestorages.blob.core.windows.net/productos/hoodie_boxy.png' },
    { id: 'cargos', name: 'Pantalones Cargo', slug: 'cargos', image: 'https://fashionstorestorages.blob.core.windows.net/productos/pantalon_cargo.png' },
    { id: 'poleras', name: 'Poleras Oversize', slug: 'poleras', image: 'https://fashionstorestorages.blob.core.windows.net/productos/polera_oversize.png' },
    { id: 'chaquetas', name: 'Chaquetas MA-1', slug: 'chaquetas', image: 'https://fashionstorestorages.blob.core.windows.net/productos/chaqueta_bomberH.png' },
    { id: 'jeans', name: 'Jeans Wide-Leg', slug: 'jeans', image: 'https://fashionstorestorages.blob.core.windows.net/productos/jeans_wideleg.png' },
    { id: 'cropped', name: 'Hoodies Cropped', slug: 'cropped', image: 'https://fashionstorestorages.blob.core.windows.net/productos/hoodie_cropped.png' },
    { id: 'parachute', name: 'Parachute Pants', slug: 'parachute', image: 'https://fashionstorestorages.blob.core.windows.net/productos/pantalon_parachute.png' },
    { id: 'sale', name: 'Ofertas', slug: 'sale', image: 'https://fashionstorestorages.blob.core.windows.net/productos/polera_oversize_carbon.png' },
  ],
  'aura-sport': [
    { id: 'all', name: 'Todo', slug: 'all', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop' },
    { id: 'leggings', name: 'Leggings Seamless', slug: 'leggings', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400&auto=format&fit=crop' },
    { id: 'tops', name: 'Tops & Bra Deportivo', slug: 'tops', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=400&auto=format&fit=crop' },
    { id: 'calzado', name: 'Running Shoes Pro', slug: 'calzado', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop' },
    { id: 'shorts', name: 'Shorts de Compresión', slug: 'shorts', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop' },
    { id: 'cortavientos', name: 'Cortavientos Técnicos', slug: 'cortavientos', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop' },
    { id: 'sale', name: 'Ofertas', slug: 'sale', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop' },
  ],
};

interface FeaturedCollection {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  action: string;
  image: string;
  categorySlug: string;
}

const TENANT_FEATURED_COLLECTIONS: Record<string, FeaturedCollection[]> = {
  'dressly': [
    {
      id: 'col-1',
      title: 'Colección Lino & Sastrería',
      subtitle: 'Prendas atemporales en tonos arena, moca y marfil',
      tag: 'NUEVA TEMPORADA',
      action: 'EXPLORAR COLECCIÓN',
      image: 'https://fashionstorestorages.blob.core.windows.net/productos/linen-collection.jpg',
      categorySlug: 'Lino',
    },
    {
      id: 'col-2',
      title: 'Vestidos de Noche & Satén',
      subtitle: 'Siluetas fluidas en seda mocha y champagne',
      tag: 'GALA & CÓCTEL',
      action: 'VER VESTIDOS',
      image: 'https://fashionstorestorages.blob.core.windows.net/productos/vestido_sleep.jpg',
      categorySlug: 'Vestidos',
    },
    {
      id: 'col-3',
      title: 'Bolsos & Marroquinería',
      subtitle: 'Piel genuina en marrón moca y negro con herrajes dorados',
      tag: 'ACCESORIOS',
      action: 'VER BOLSOS',
      image: 'https://fashionstorestorages.blob.core.windows.net/productos/accessories.jpg',
      categorySlug: 'Accesorios',
    },
    {
      id: 'col-4',
      title: 'Pantalones & Siluetas Minimal',
      subtitle: 'Cortes limpios de tiro alto y caída fluida en crepé',
      tag: 'ESENCIALES',
      action: 'VER PANTALONES',
      image: 'https://fashionstorestorages.blob.core.windows.net/productos/pantalon_palazo.png',
      categorySlug: 'Pantalones',
    },
  ],
  'urbanly': [
    {
      id: 'col-1',
      title: 'Heavyweight 500 GSM Drop',
      subtitle: 'Hoodies y poleras de algodón pesado con corte boxy industrial',
      tag: 'STREETWEAR DROP',
      action: 'EXPLORAR HOODIES',
      image: 'https://fashionstorestorages.blob.core.windows.net/portada/portada_dos.png',
      categorySlug: 'Hoodies',
    },
    {
      id: 'col-2',
      title: 'Tactical Cargo Pants',
      subtitle: 'Pantalones cargo multi-bolsillos y parachute ajustables',
      tag: 'CARGO SYSTEM',
      action: 'VER CARGOS',
      image: 'https://fashionstorestorages.blob.core.windows.net/productos/pantalon_cargo.png',
      categorySlug: 'Pantalones',
    },
    {
      id: 'col-3',
      title: 'Vintage Acid Washed',
      subtitle: 'Poleras oversize con lavado vintage y estética neutral tones',
      tag: 'ESSENTIALS',
      action: 'VER POLERAS',
      image: 'https://fashionstorestorages.blob.core.windows.net/portada/portada_tres.png',
      categorySlug: 'Poleras',
    },
    {
      id: 'col-4',
      title: 'Industrial Outerwear',
      subtitle: 'Bombers MA-1 y chaquetas de gabardina de alta resistencia',
      tag: 'OUTERWEAR',
      action: 'VER CHAQUETAS',
      image: 'https://fashionstorestorages.blob.core.windows.net/productos/chaqueta_bomberH.png',
      categorySlug: 'Chaquetas',
    },
  ],
  'aura-sport': [
    {
      id: 'col-1',
      title: 'Colección Seamless Pro',
      subtitle: 'Tejido elástico de compresión sin costuras para máxima libertad',
      tag: 'PERFORMANCE',
      action: 'EXPLORAR SEAMLESS',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600&auto=format&fit=crop',
      categorySlug: 'Leggings',
    },
    {
      id: 'col-2',
      title: 'Falcon Running Footwear',
      subtitle: 'Amortiguación reactiva ultraligera para asfalto y pista',
      tag: 'SPEED SYSTEM',
      action: 'VER CALZADO',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop',
      categorySlug: 'Calzado',
    },
    {
      id: 'col-3',
      title: 'Tops Ultra-Support',
      subtitle: 'Sujeción deportiva de alto impacto con copas transpirables',
      tag: 'TRAINING',
      action: 'VER TOPS',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop',
      categorySlug: 'Tops',
    },
    {
      id: 'col-4',
      title: 'Outerwear Cortaviento',
      subtitle: 'Chaquetas técnicas térmicas repelentes al agua para exterior',
      tag: 'ALL-WEATHER',
      action: 'VER CORTAVIENTOS',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop',
      categorySlug: 'Chaquetas',
    },
  ],
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

  // Resolución estricta y sin ambigüedad del Tenant activo:
  // 1. Parametro en la ruta de React Router
  // 2. Prefijo en window.location.pathname (/store/:tenant o /tenant/:tenant)
  // 3. Segmento directo en URL (urbanly, aura-sport, dressly)
  // 4. Fallback estándar al tenant insignia 'dressly'
  const { tenant } = useParams<{ tenant?: string }>();
  const pathname = window.location.pathname.toLowerCase();
  const pathMatch = pathname.match(/\/(?:store|tenant)\/([a-zA-Z0-9_-]+)/i);

  let rawTenant = tenant || (pathMatch ? pathMatch[1] : null);
  if (!rawTenant) {
    if (pathname.includes('urbanly') || pathname.includes('subversive')) {
      rawTenant = 'urbanly';
    } else if (pathname.includes('aura')) {
      rawTenant = 'aura-sport';
    } else if (pathname.includes('dressly')) {
      rawTenant = 'dressly';
    } else {
      rawTenant = localStorage.getItem('tenantKey') || 'dressly';
    }
  }

  const normalized = (rawTenant || 'dressly').toLowerCase().trim();
  const resolvedTenant = (normalized === 'subversive-urban' || normalized === 'subversive')
    ? 'urbanly'
    : (normalized === 'aura' ? 'aura-sport' : (normalized === 'fashionstore' ? 'dressly' : normalized));

  const activeTenantKey = resolvedTenant;
  const currentTheme = TENANTS_THEME[activeTenantKey] || TENANTS_THEME['dressly'];

  const [appearance, setAppearance] = useState<AppearanceData | null>(null);
  const [dynamicProducts, setDynamicProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Sincronizar tenant en el almacenamiento local para interceptores HTTP
    localStorage.setItem('tenantKey', activeTenantKey);

    // Cargar la apariencia oficial exclusiva del tenant
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
    }).catch((err) => console.warn('Usando configuración predeterminada para vitrina:', err));

    // Cargar los productos reales aislados directamente de la base de datos física del tenant
    CatalogApi.getProducts({ limit: 12 })
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          const defaultImg = activeTenantKey === 'urbanly'
            ? 'https://fashionstorestorages.blob.core.windows.net/productos/hoodie_boxy.png'
            : (activeTenantKey === 'aura-sport'
              ? 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600&auto=format&fit=crop'
              : 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg');

          const mapped: Product[] = res.data.map((cp) => ({
            id: cp.id_producto,
            name: cp.nombre,
            category: cp.categoria?.nombre || 'General',
            categorySlug: cp.categoria?.nombre?.toLowerCase().replace(/\s+/g, '-') || 'general',
            price: cp.precio_final,
            originalPrice: cp.tiene_descuento ? cp.precio_base : undefined,
            rating: 4.9,
            reviewsCount: 16,
            image: cp.imagen_principal || defaultImg,
            isNew: true,
            isSale: cp.tiene_descuento,
            description: cp.descripcion || '',
            sizes: cp.tallas_disponibles.map((t) => t.codigo),
            colors: cp.colores_disponibles.map((c) => c.nombre),
          }));
          setDynamicProducts(mapped);
        } else {
          setDynamicProducts([]);
        }
      })
      .catch((err) => {
        console.warn('Error al cargar catálogo de tenant:', err);
        setDynamicProducts([]);
      });
  }, [activeTenantKey]);

  const activeCategories = TENANT_CATEGORIES[activeTenantKey] || TENANT_CATEGORIES['dressly'];
  const activeCollections = TENANT_FEATURED_COLLECTIONS[activeTenantKey] || TENANT_FEATURED_COLLECTIONS['dressly'];

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
    <div className="home-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="cart-toast animate-toast">
          <span>{toastMessage}</span>
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
                    ? (appearance?.hero_banner_secondary_url || currentTheme.heroImage)
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CIRCULAR CATEGORY PILLS ("Shop by Category") */}
      <section className="circular-categories-section">
        <div className="section-container">
          <div className="circular-categories-row">
            {activeCategories.map((cat) => {
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
            {activeCollections.map((col) => (
              <div
                key={col.id}
                className="collection-card"
                onClick={() => navigate(`/store/${activeTenantKey}/catalog?category=${encodeURIComponent(col.categorySlug)}`)}
              >
                <img src={col.image} alt={col.title} className="collection-card-img" />
                <div className="collection-card-overlay">
                  <div className="collection-card-content">
                    <span className="collection-card-tag">{col.tag}</span>
                    <h3 className="collection-card-title">{col.title}</h3>
                    <p className="collection-card-subtitle">{col.subtitle}</p>
                    <span className="collection-explore-link">
                      {col.action} →
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
            {/* Promo 1 */}
            <div className="promo-banner-card promo-spring">
              <div className="promo-text-side">
                <span className="promo-tag">
                  {appearance?.promo1_tag || (activeTenantKey === 'urbanly' ? 'STREETWEAR & ESSENTIALS' : (activeTenantKey === 'aura-sport' ? 'ENTRENAMIENTO & PERFORMANCE' : 'COLECCIÓN ATEMPORAL'))}
                </span>
                <h3 className="promo-title">
                  {appearance?.promo1_title || (activeTenantKey === 'urbanly' ? 'Siluetas Boxy & 500 GSM Heavyweight' : (activeTenantKey === 'aura-sport' ? 'Prendas de Compresión & Seamless' : 'Lino Natural & Tonos Tierra'))}
                </h3>
                <button
                  className="promo-action-btn"
                  onClick={() => navigate(`/store/${activeTenantKey}/catalog`)}
                >
                  {appearance?.promo1_btn || (activeTenantKey === 'urbanly' ? 'Ver Colección Heavyweight →' : (activeTenantKey === 'aura-sport' ? 'Ver Colección Pro →' : 'Ver Colección Lino →'))}
                </button>
              </div>
              <div className="promo-img-side">
                <img
                  src={
                    appearance?.promo1_image_url ||
                    (activeTenantKey === 'urbanly'
                      ? 'https://fashionstorestorages.blob.core.windows.net/portada/portada_dos.png'
                      : (activeTenantKey === 'aura-sport'
                        ? 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop'
                        : 'https://fashionstorestorages.blob.core.windows.net/productos/linen-collection.jpg'))
                  }
                  alt="Colección Destacada"
                />
              </div>
            </div>

            {/* Promo 2 */}
            <div className="promo-banner-card promo-fresh">
              <div className="promo-text-side">
                <span className="promo-tag">
                  {appearance?.promo2_tag || (activeTenantKey === 'urbanly' ? 'STREETWEAR & CARGO' : (activeTenantKey === 'aura-sport' ? 'CALZADO & EQUIPAMIENTO' : 'MARROQUINERÍA & ACCESORIOS'))}
                </span>
                <h3 className="promo-title">
                  {appearance?.promo2_title || (activeTenantKey === 'urbanly' ? 'Cargos & Outerwear Industrial' : (activeTenantKey === 'aura-sport' ? 'Running & Calzado Técnico' : 'Bolsos en Moca & Negro Profundo'))}
                </h3>
                <button
                  className="promo-action-btn"
                  onClick={() => navigate(`/store/${activeTenantKey}/catalog`)}
                >
                  {appearance?.promo2_btn || (activeTenantKey === 'urbanly' ? 'Ver Streetwear →' : (activeTenantKey === 'aura-sport' ? 'Ver Calzado →' : 'Ver Accesorios →'))}
                </button>
              </div>
              <div className="promo-img-side">
                <img
                  src={
                    appearance?.promo2_image_url ||
                    (activeTenantKey === 'urbanly'
                      ? 'https://fashionstorestorages.blob.core.windows.net/portada/portada_tres.png'
                      : (activeTenantKey === 'aura-sport'
                        ? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop'
                        : 'https://fashionstorestorages.blob.core.windows.net/productos/accessories.jpg'))
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
            {dynamicProducts.map((product) => {
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
                    />

                    {/* Badges */}
                    <div className="product-badges">
                      {product.isSale && (
                        <span className="product-badge badge-sale">OFERTA</span>
                      )}
                      {product.isNew && !product.isSale && (
                        <span className="product-badge badge-new">NUEVO</span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      className={`product-wishlist-btn ${isFavorited ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      aria-label="Agregar a favoritos"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={isFavorited ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>

                    {/* Quick Add Overlay */}
                    <div className="product-quick-add">
                      <button
                        className="quick-add-btn"
                        onClick={(e) => handleQuickAdd(product, e)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        <span>Añadir Rápido</span>
                      </button>
                    </div>
                  </div>

                  {/* Info container */}
                  <div className="product-card-info">
                    <span className="product-card-category">{product.category}</span>
                    <h3 className="product-card-title">{product.name}</h3>

                    <div className="product-card-footer">
                      <div className="product-pricing">
                        <span className="current-price">{product.price.toFixed(2)} Bs</span>
                        {product.originalPrice && (
                          <span className="original-price">{product.originalPrice.toFixed(2)} Bs</span>
                        )}
                      </div>

                      <div className="product-rating">
                        <div className="stars-wrapper" style={{ color: '#D97706' }}>
                          {'★'.repeat(Math.floor(product.rating))}
                        </div>
                        <span className="reviews-count">({product.reviewsCount})</span>
                      </div>
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
              <h4>Envío Rápido</h4>
              <p>Cobertura nacional express a cualquier ciudad de Bolivia.</p>
            </div>
            <div className="trust-card">
              <span className="trust-card-icon">📦</span>
              <h4>Devoluciones Fáciles</h4>
              <p>Periodo de cambio de hasta 30 días sin costo adicional.</p>
            </div>
            <div className="trust-card">
              <span className="trust-card-icon">🛡️</span>
              <h4>Pagos 100% Seguros</h4>
              <p>Transferencia bancaria directa, QR Simple y tarjetas habilitadas.</p>
            </div>
            <div className="trust-card">
              <span className="trust-card-icon">🎧</span>
              <h4>Atención Exclusiva</h4>
              <p>Asesoría personalizada en tallas y colecciones activas.</p>
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
                  (activeTenantKey === 'urbanly'
                    ? 'https://fashionstorestorages.blob.core.windows.net/portada/portada_cuatro.png'
                    : (activeTenantKey === 'aura-sport'
                      ? 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1600&auto=format&fit=crop'
                      : 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg'))
                }
                alt="Club Oficial"
              />
            </div>
            <div className="newsletter-form-side">
              <span className="newsletter-tag">OBTÉN 10% DE DESCUENTO EN TU PRIMER PEDIDO</span>
              <h3 className="newsletter-title">Únete a {currentTheme.name}</h3>
              <p className="newsletter-desc">
                Suscríbete para recibir lanzamientos exclusivos, drops de temporada e inspiración curada.
              </p>

              {newsletterSubscribed ? (
                <div className="newsletter-success">
                  🎉 ¡Gracias por unirte! Usa el código <strong>{activeTenantKey === 'urbanly' ? 'URBANLY10' : 'DRESSLY10'}</strong> al pagar para tu 10% de descuento.
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
              <span className="footer-brand-tagline">{appearance?.tagline || (activeTenantKey === 'urbanly' ? 'AESTHETIC STREETWEAR' : (activeTenantKey === 'aura-sport' ? 'ATHLETICS & GEAR' : 'FASHION BOUTIQUE'))}</span>
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
                <li><Link to={`/store/${activeTenantKey}/catalog?category=${activeTenantKey === 'urbanly' ? 'hoodies' : 'chaquetas'}`} onClick={() => window.scrollTo(0, 0)}>{activeTenantKey === 'urbanly' ? 'Hoodies & Sudaderas' : 'Blazers & Chaquetas'}</Link></li>
                <li><Link to={`/store/${activeTenantKey}/catalog?category=${activeTenantKey === 'urbanly' ? 'cargos' : 'vestidos'}`} onClick={() => window.scrollTo(0, 0)}>{activeTenantKey === 'urbanly' ? 'Cargos & Parachutes' : 'Vestidos de Gala'}</Link></li>
                <li><Link to={`/store/${activeTenantKey}/catalog?category=${activeTenantKey === 'urbanly' ? 'poleras' : 'accesorios'}`} onClick={() => window.scrollTo(0, 0)}>{activeTenantKey === 'urbanly' ? 'Poleras Oversize' : 'Bolsos & Marroquinería'}</Link></li>
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
              <img src={appearance?.promo1_image_url || currentTheme.heroImage} alt="Colección Destacada" />
              <img src={appearance?.promo2_image_url || currentTheme.heroImage} alt="Drop de Temporada" />
            </div>
            <div className="lookbook-footer">
              <button
                className="lookbook-shop-btn"
                onClick={() => {
                  setShowLookbookModal(false);
                  navigate(`/store/${activeTenantKey}/catalog`);
                }}
              >
                Comprar Colección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
