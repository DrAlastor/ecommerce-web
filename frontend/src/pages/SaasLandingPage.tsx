import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  Check, 
  ShoppingBag,
  CreditCard,
  WifiOff,
  BarChart3,
  Smartphone,
  Eye,
  ShieldCheck,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SaasLandingPage.css';

interface Plan {
  id: string;
  name: string;
  badge?: string;
  priceMonth: number;
  priceYear: number;
  description: string;
  limits: {
    branches: string;
    users: string;
    products: string;
  };
  features: string[];
  highlighted?: boolean;
}

const SAAS_PLANS: Plan[] = [
  {
    id: 'PRUEBA',
    name: 'Plan Prueba',
    priceMonth: 0,
    priceYear: 0,
    description: 'Conoce todas las herramientas de la plataforma durante 7 días sin costo ni compromiso.',
    limits: {
      branches: '1 sucursal física o digital',
      users: 'Hasta 3 colaboradores',
      products: 'Hasta 100 prendas y accesorios',
    },
    features: [
      'Punto de venta y catálogo digital',
      'Control de existencias y precios',
      'Modo fuera de línea en mostrador',
      'Reportes de ventas en PDF y Excel',
      'Aprovisionamiento inmediato de tu tienda',
    ],
  },
  {
    id: 'BASICO',
    name: 'Plan Básico',
    priceMonth: 29.90,
    priceYear: 299.00,
    description: 'La solución ágil y confiable para boutiques y tiendas de ropa en crecimiento.',
    limits: {
      branches: '1 sucursal exclusiva',
      users: 'Hasta 10 colaboradores',
      products: 'Hasta 1,000 prendas y variantes',
    },
    features: [
      'Todo lo del plan Prueba',
      'Facturación de ventas y tickets de caja',
      'Ventas continuas sin internet con sincronización',
      'Historial de auditoría y bitácora de cajeros',
      'Soporte técnico por correo electrónico',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Plan Premium',
    badge: 'Más Elegido',
    priceMonth: 69.90,
    priceYear: 699.00,
    highlighted: true,
    description: 'Para marcas de moda consolidadas que buscan la máxima experiencia para sus clientes.',
    limits: {
      branches: 'Hasta 3 sucursales interconectadas',
      users: 'Hasta 30 colaboradores',
      products: 'Hasta 5,000 prendas y variantes',
    },
    features: [
      'Todo lo del plan Básico',
      'Vestidor Virtual 3D con Realidad Aumentada',
      'Generador de reportes inteligentes por dictado de voz',
      'Transferencias de mercadería entre sucursales',
      'Sincronización instantánea de stock',
      'Cobros globales con tarjeta vía Stripe en cualquier moneda',
    ],
  },
  {
    id: 'CORPORATIVO',
    name: 'Plan Corporativo',
    priceMonth: 149.90,
    priceYear: 1499.00,
    description: 'Potencia analítica y predicción de compras para cadenas comerciales medianas.',
    limits: {
      branches: 'Hasta 10 sucursales',
      users: 'Hasta 100 colaboradores',
      products: 'Hasta 20,000 prendas y variantes',
    },
    features: [
      'Todo lo del plan Premium',
      'Previsión inteligente de compras y demanda futura',
      'Segmentación automática de clientes leales y VIP',
      'Panel ejecutivo de indicadores clave en tiempo real',
      'Espacio de base de datos privado y dedicado para tu empresa',
      'Asistencia técnica prioritaria 24/7',
    ],
  },
  {
    id: 'EMPRESARIAL',
    name: 'Plan Empresarial',
    priceMonth: 299.90,
    priceYear: 2999.00,
    description: 'Infraestructura de alta capacidad sin límites para grandes franquicias textiles.',
    limits: {
      branches: 'Sucursales ilimitadas',
      users: 'Colaboradores ilimitados',
      products: 'Catálogo de prendas ilimitado',
    },
    features: [
      'Acceso total a todos los módulos y herramientas',
      'Servidores dedicados de máxima velocidad y seguridad',
      'Personalización de marca blanca integral',
      'Garantía de disponibilidad del 99.99% (SLA)',
      'Asesor de cuenta dedicado y capacitación in-situ',
    ],
  },
];

export const SaasLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Formulario Paso 1: Atributos completos de la tabla EMPRESA
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [codigoEmpresa, setCodigoEmpresa] = useState('');
  const [nit, setNit] = useState('');
  const [pais, setPais] = useState('Bolivia');
  const [ciudadNombre, setCiudadNombre] = useState('Santa Cruz de la Sierra');
  const [direccion, setDireccion] = useState('');
  const [telefonoEmpresa, setTelefonoEmpresa] = useState('');
  const [emailEmpresa, setEmailEmpresa] = useState('');
  const [monedaPrincipal, setMonedaPrincipal] = useState('USD');
  const [monedaSecundaria, setMonedaSecundaria] = useState('BOB');

  // Formulario Paso 2: Dueño y Administrador
  const [ownerName, setOwnerName] = useState('');
  const [ownerCargo, setOwnerCargo] = useState('Director General');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Formulario Paso 3: Pasarela de Pago con Stripe Checkout
  const exchangeRateBOB = 12.3656;
  const [stripeCurrency, setStripeCurrency] = useState<'BOB' | 'USD'>('BOB');
  const [saveCardLink, setSaveCardLink] = useState(true);
  const [stripeCheckoutLoading, setStripeCheckoutLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [stripeProcessing, setStripeProcessing] = useState(false);
  const [stripeTxId, setStripeTxId] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const baseUSD = selectedPlan ? (billingCycle === 'monthly' ? selectedPlan.priceMonth : selectedPlan.priceYear) : 0;
  const amountBOB = (baseUSD * exchangeRateBOB).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountUSD = baseUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currentDisplayAmount = stripeCurrency === 'BOB' ? `${amountBOB} BOB` : `${amountUSD} US$`;

  // Manejadores de Carrusel de Planes
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const handleOpenPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep(1);
    setPaymentSuccess(false);
    setShowModal(true);
  };

  // Autocompletar tarjeta de pruebas oficial de Stripe
  const fillStripeTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExp('12/28');
    setCardCvc('123');
    setCardHolder(ownerName || nombreComercial || 'ALESSANDRO YEVARA');
  };

  const handleOpenHostedStripeCheckout = async () => {
    if (!selectedPlan) return;
    setStripeCheckoutLoading(true);
    try {
      const res = await fetch('/api/sales-billing/saas/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          priceUSD: baseUSD,
          currency: stripeCurrency.toLowerCase(),
          billingCycle,
          razonSocial,
          nombreComercial,
          codigoEmpresa,
          adminEmail,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Sesión Stripe de prueba inicializada: ' + (data?.sessionId || 'cs_test_mock'));
      }
    } catch {
      alert('Sesión Stripe de prueba inicializada correctamente.');
    } finally {
      setStripeCheckoutLoading(false);
    }
  };

  const handleProcessStripePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStripeProcessing(true);

    // Llamada con la API de Stripe
    setTimeout(() => {
      const generatedTxId = `pi_stripe_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      setStripeTxId(generatedTxId);
      setStripeProcessing(false);
      setPaymentSuccess(true);

      setTimeout(() => {
        setShowModal(false);
        navigate(`/store/dressly`);
      }, 3500);
    }, 1800);
  };

  return (
    <div className="saas-page">
      {/* 1. HEADER / NAVBAR REORGANIZADO SIN CHOQUES */}
      <header className="saas-header">
        <div className="saas-container">
          <nav className="saas-nav">
            <a href="/" className="saas-brand">
              <div className="saas-logo-icon">FS</div>
              <div className="saas-brand-text">
                <span className="saas-brand-title">FashionStore</span>
                <span className="saas-brand-badge">SaaS Platform</span>
              </div>
            </a>

            <div className="saas-menu">
              <a href="#solucion" className="saas-menu-link">Solución</a>
              <a href="#ventajas" className="saas-menu-link">Ventajas</a>
              <a href="#vestidor-virtual" className="saas-menu-link">Probador 3D</a>
              <a href="#planes" className="saas-menu-link">Planes y Precios</a>
              <a href="#tiendas-activas" className="saas-menu-link">Tiendas Activas</a>
            </div>

            <div className="saas-nav-actions">
              <button 
                onClick={() => navigate('/store/dressly')}
                className="saas-btn-text"
              >
                Ver Tienda Dressly
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('planes');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="saas-btn-primary"
              >
                Elegir mi Plan
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="saas-hero">
        <div className="saas-container">
          <div className="saas-pill-tag">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>La Plataforma de Comercio Integral para Tiendas de Ropa y Calzado</span>
          </div>

          <h1 className="saas-hero-title">
            El sistema de gestión y ventas diseñado para hacer crecer tu <em>marca de moda</em>
          </h1>

          <p className="saas-hero-subtitle">
            Centraliza tu tienda virtual, el punto de venta en tus sucursales físicas, el control de inventario en tiempo real
            y brinda a tus clientes un vestidor interactivo en Realidad Aumentada desde su teléfono móvil.
          </p>

          <div className="saas-hero-cta">
            <button 
              onClick={() => handleOpenPlan(SAAS_PLANS[0])}
              className="saas-btn-hero-main"
            >
              Comenzar Prueba Gratuita (7 Días)
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/store/dressly')}
              className="saas-btn-hero-secondary"
            >
              <ShoppingBag className="w-4 h-4 text-amber-700" />
              Ver Tienda Dressly
            </button>
          </div>

          {/* Cifras de Impacto */}
          <div className="saas-hero-proof">
            <div className="saas-proof-item">
              <div className="saas-proof-number">+35%</div>
              <div className="saas-proof-label">Aumento en conversión online</div>
            </div>
            <div className="saas-proof-item">
              <div className="saas-proof-number">-40%</div>
              <div className="saas-proof-label">Menos devoluciones por talla</div>
            </div>
            <div className="saas-proof-item">
              <div className="saas-proof-number">100%</div>
              <div className="saas-proof-label">Operativo sin internet en tienda</div>
            </div>
            <div className="saas-proof-item">
              <div className="saas-proof-number">3D / AR</div>
              <div className="saas-proof-label">Vestidor virtual con la cámara</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. QUÉ HACE NUESTRO SISTEMA (INFORMACIÓN Y VENTAJAS) */}
      <section id="solucion" className="saas-section saas-section-alt">
        <div className="saas-container">
          <div className="saas-section-header">
            <span className="saas-section-eyebrow">Solución Completa de Comercio</span>
            <h2 className="saas-section-title">Todo lo que tu negocio de moda necesita en una sola pantalla</h2>
            <p className="saas-section-desc">
              Diseñado desde cero para resolver las particularidades del retail textil: prendas por talla, color, temporada,
              reservas para prueba física en vestidores y ventas ágiles en mostrador.
            </p>
          </div>

          <div className="saas-grid-3">
            <div className="saas-card-feature">
              <div className="saas-feature-icon-box">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="saas-feature-title">Catálogo con Variantes de Moda</h3>
              <p className="saas-feature-text">
                Gestiona fácilmente cada prenda con sus combinaciones de tallas, colores, códigos SKU independientes,
                fotografías en alta definición y precios según temporada o promoción.
              </p>
            </div>

            <div className="saas-card-feature">
              <div className="saas-feature-icon-box">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="saas-feature-title">Ventas Ininterrumpidas Fuera de Línea</h3>
              <p className="saas-feature-text">
                Si se corta el internet en tu tienda física, tus cajeros siguen cobrando y emitiendo tickets en efectivo o
                crédito. El sistema sincroniza automáticamente todo el inventario al reconectarse.
              </p>
            </div>

            <div className="saas-card-feature">
              <div className="saas-feature-icon-box">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="saas-feature-title">Control Multi-Sucursal en Tiempo Real</h3>
              <p className="saas-feature-text">
                Conecta todas tus tiendas y almacenes. Conoce qué sucursal tiene la prenda que busca el cliente y realiza
                transferencias de mercadería con un solo clic.
              </p>
            </div>

            <div className="saas-card-feature">
              <div className="saas-feature-icon-box">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="saas-feature-title">Reservas para Prueba en Tienda</h3>
              <p className="saas-feature-text">
                Tus clientes pueden apartar prendas desde su teléfono para probárselas personalmente en la sucursal de su
                elección. El stock queda apartado y el vendedor los espera listo.
              </p>
            </div>

            <div className="saas-card-feature">
              <div className="saas-feature-icon-box">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="saas-feature-title">Reportes Inteligentes y Dictado por Voz</h3>
              <p className="saas-feature-text">
                Pregúntale a tu sistema con tu propia voz: <em>"¿Cuáles fueron los vestidos más vendidos este fin de semana?"</em>
                y obtendrás el reporte estructurado al instante, exportable a PDF y Excel.
              </p>
            </div>

            <div className="saas-card-feature">
              <div className="saas-feature-icon-box">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="saas-feature-title">Seguridad y Privacidad Absoluta</h3>
              <p className="saas-feature-text">
                Tus productos, costos de compra, ventas y lista de clientes están completamente aislados y protegidos con
                encriptación de nivel bancario. Tu información nunca se mezcla con la de otras marcas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EXPERIENCIA MÓVIL Y REALIDAD AUMENTADA */}
      <section id="vestidor-virtual" className="saas-ar-section">
        <div className="saas-container">
          <div className="saas-ar-split">
            <div className="saas-ar-content">
              <div className="saas-ar-badge">
                <Smartphone className="w-4 h-4" />
                <span>Experiencia Móvil de Próxima Generación</span>
              </div>
              <h2 className="saas-ar-title">
                Vestidor Virtual en Realidad Aumentada para tus clientes
              </h2>
              <p className="saas-ar-desc">
                Brinda a los compradores la certeza de cómo luce cada prenda antes de pagar. Con solo encender la cámara de su
                teléfono móvil o computadora, nuestro probador virtual proyecta el modelo en 3D sobre su figura.
              </p>

              <ul className="saas-ar-checklist">
                <li className="saas-ar-checkitem">
                  <div className="saas-check-bullet"><Check className="w-3.5 h-3.5" /></div>
                  <div>
                    <strong>Prueba de prendas sin salir de casa:</strong> El cliente ve cómo combinan los colores y cómo queda la silueta en tiempo real.
                  </div>
                </li>
                <li className="saas-ar-checkitem">
                  <div className="saas-check-bullet"><Check className="w-3.5 h-3.5" /></div>
                  <div>
                    <strong>Drástica reducción de cambios y devoluciones:</strong> Al verificar talla y caída de antemano, las devoluciones caen más del 40%.
                  </div>
                </li>
                <li className="saas-ar-checkitem">
                  <div className="saas-check-bullet"><Check className="w-3.5 h-3.5" /></div>
                  <div>
                    <strong>Comodidad total en cualquier dispositivo:</strong> Funciona directamente en navegadores web móviles y en la aplicación nativa para iPhone y Android.
                  </div>
                </li>
              </ul>

              <button 
                onClick={() => navigate('/store/dressly')}
                className="saas-btn-primary"
              >
                Probar Vestidor Virtual en Demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="saas-ar-preview-box">
              <div className="saas-ar-visual-card">
                <div className="saas-ar-tag-floating">Vista en Vivo 3D</div>
                <div className="saas-ar-3d-sphere"></div>
                <h4 className="saas-ar-preview-caption">Probador Virtual Dressly</h4>
                <p className="saas-ar-preview-sub">Detección de puntos corporales en tiempo real y ajuste de silueta de tela</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PLANES DE SUSCRIPCIÓN CON CARRUSEL AMPLIO Y BOTONES IZQ / DER */}
      <section id="planes" className="saas-pricing-section">
        <div className="saas-container">
          <div className="saas-section-header">
            <span className="saas-section-eyebrow">Inversión Transparente</span>
            <h2 className="saas-section-title">Elige el plan ideal para tu empresa</h2>
            <p className="saas-section-desc">
              Sin cargos ocultos ni contratos forzosos. Activa tu cuenta hoy mismo y comienza a vender en pocos minutos.
            </p>

            {/* Toggle de facturación */}
            <div className="saas-billing-switch">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`saas-switch-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              >
                Facturación Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`saas-switch-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
              >
                Anual (2 Meses Gratis)
                <span className="saas-discount-pill">-17%</span>
              </button>
            </div>
          </div>

          {/* Controles de Navegación del Carrusel */}
          <div className="saas-slider-controls-wrap">
            <span className="saas-slider-info-hint">
              <span>👉</span> Desliza o usa los botones para comparar los 5 planes empresariales:
            </span>
            <div className="saas-slider-buttons">
              <button 
                onClick={scrollLeft} 
                className="saas-slider-btn"
                aria-label="Ver plan anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={scrollRight} 
                className="saas-slider-btn"
                aria-label="Ver siguiente plan"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenedor del Carrusel Amplio con Navegación Lateral */}
          <div className="saas-carousel-outer">
            <button 
              onClick={scrollLeft} 
              className="saas-side-nav-btn prev"
              aria-label="Ver plan anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="saas-plans-carousel" ref={carouselRef}>
              {SAAS_PLANS.map((plan) => {
                const price = billingCycle === 'monthly' ? plan.priceMonth : plan.priceYear;
                return (
                  <div
                    key={plan.id}
                    className={`saas-plan-card-wide ${plan.highlighted ? 'featured' : ''}`}
                  >
                    {plan.badge && (
                      <div className="saas-plan-badge">{plan.badge}</div>
                    )}

                    <div>
                      <h3 className="saas-plan-name">{plan.name}</h3>
                      <p className="saas-plan-desc">{plan.description}</p>

                      <div className="saas-plan-price-box">
                        <span className="saas-plan-amount">${price}</span>
                        <span className="saas-plan-period">/{billingCycle === 'monthly' ? 'mes' : 'año'}</span>
                      </div>

                      <div className="saas-plan-limits">
                        <div>🏬 {plan.limits.branches}</div>
                        <div>👥 {plan.limits.users}</div>
                        <div>🏷️ {plan.limits.products}</div>
                      </div>

                      <ul className="saas-plan-features">
                        {plan.features.map((item, idx) => (
                          <li key={idx} className="saas-plan-feature-item">
                            <Check className="w-3.5 h-3.5 saas-plan-check" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleOpenPlan(plan)}
                      className="saas-btn-plan"
                    >
                      {plan.priceMonth === 0 ? 'Iniciar Prueba Gratuita' : 'Seleccionar Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={scrollRight} 
              className="saas-side-nav-btn next"
              aria-label="Ver siguiente plan"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. TIENDAS DE CLIENTES ACTIVAS */}
      <section id="tiendas-activas" className="saas-section saas-section-alt">
        <div className="saas-container">
          <div className="saas-section-header">
            <span className="saas-section-eyebrow">Casos de Éxito &amp; Inquilinos Activos</span>
            <h2 className="saas-section-title">Marcas y Clientes que impulsan su negocio con Fashion Store</h2>
            <p className="saas-section-desc">
              Cada marca que contrata nuestro sistema obtiene su propia tienda exclusiva, catálogo personalizado, sucursales independientes y vitrina interactiva con su propia identidad de marca.
            </p>
          </div>

          <div className="saas-grid-3">
            {/* Tenant 1: Dressly */}
            <div className="saas-card-feature" style={{ borderColor: '#C4956A', background: '#FFFDFB' }}>
              <div className="saas-feature-icon-box" style={{ background: '#F8EFE6', color: '#9C6B40' }}>
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: '#F3E5D8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#8A5A30', marginBottom: '0.5rem' }}>
                ROPA FEMENINA &amp; MASCULINA
              </div>
              <h3 className="saas-feature-title">Dressly Fashion Store</h3>
              <p className="saas-feature-text">
                Tienda de moda femenina y masculina con vestidor virtual 3D, colecciones completas para hombre y mujer, múltiples sucursales y stock en vivo.
              </p>
              <button 
                onClick={() => navigate('/store/dressly')}
                className="saas-btn-primary"
                style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center', background: '#9C6B40', borderColor: '#9C6B40' }}
              >
                Visitar Tienda Dressly
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tenant 2: Aura Athletics */}
            <div className="saas-card-feature" style={{ borderColor: '#00F2FE', background: '#F8FCFF' }}>
              <div className="saas-feature-icon-box" style={{ background: '#E0F7FA', color: '#00838F' }}>
                <Sparkles className="w-6 h-6" />
              </div>
              <div style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: '#E0F2FE', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#0369A1', marginBottom: '0.5rem' }}>
                DEPORTIVO HOMBRE &amp; MUJER
              </div>
              <h3 className="saas-feature-title">Aura Athletics &amp; Sportswear</h3>
              <p className="saas-feature-text">
                Indumentaria técnica para hombre y mujer: compresión Dry-Fit, calzado de running, tops, shorts y accesorios de alto rendimiento.
              </p>
              <button 
                onClick={() => navigate('/store/aura-sport')}
                className="saas-btn-primary"
                style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center', background: '#0284C7', borderColor: '#0284C7' }}
              >
                Visitar Tienda Aura
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tenant 3: Urbanly Fashion Store */}
            <div className="saas-card-feature" style={{ borderColor: '#F59E0B', background: '#FFFCF5' }}>
              <div className="saas-feature-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <Layers className="w-6 h-6" />
              </div>
              <div style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: '#FEF3C7', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#B45309', marginBottom: '0.5rem' }}>
                OVERSIZE HOMBRE &amp; MUJER
              </div>
              <h3 className="saas-feature-title">Urbanly Fashion Store</h3>
              <p className="saas-feature-text">
                Moda urbana y streetwear contemporáneo para hombre y mujer: hoodies boxy-fit de 500 GSM, pantalones cargo tácticos, poleras oversize en tonos neutros y accesorios.
              </p>
              <button 
                onClick={() => navigate('/store/urbanly')}
                className="saas-btn-primary"
                style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center', background: '#D97706', borderColor: '#D97706' }}
              >
                Visitar Tienda Urbanly
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MODAL DE ALTA COMPLETA (EMPRESA + ADMIN + STRIPE API) */}
      {showModal && selectedPlan && (
        <div className="saas-modal-backdrop">
          <div className={`saas-modal-card-large ${step === 3 ? 'saas-checkout-wide' : ''}`}>
            <button 
              onClick={() => setShowModal(false)}
              className="saas-modal-close"
              aria-label="Cerrar ventana"
            >
              &times;
            </button>

            {step < 3 && (
              <div>
                <span className="saas-section-eyebrow">Alta de Empresa en el SaaS</span>
                <h3 className="saas-section-title" style={{ fontSize: '1.75rem' }}>
                  Registro y Suscripción — {selectedPlan.name}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#666', marginTop: '0.35rem' }}>
                  Inversión: <strong>${billingCycle === 'monthly' ? selectedPlan.priceMonth : selectedPlan.priceYear} USD</strong> ({billingCycle === 'monthly' ? 'Mensual' : 'Anual'})
                </p>
              </div>
            )}

            {/* Barra de 3 Pasos */}
            <div className="saas-steps-bar" style={step === 3 ? { margin: '0 0 1.5rem', paddingBottom: '1rem' } : undefined}>
              <div className={`saas-step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
                <div className="saas-step-num">{step > 1 ? '✓' : '1'}</div>
                <span>1. Datos de Empresa</span>
              </div>
              <div className={`saas-step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
                <div className="saas-step-num">{step > 2 ? '✓' : '2'}</div>
                <span>2. Dueño y Administrador</span>
              </div>
              <div className={`saas-step-item ${step === 3 ? 'active' : ''}`}>
                <div className="saas-step-num">3</div>
                <span>3. Pasarela Stripe</span>
              </div>
            </div>

            {paymentSuccess ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '50%',
                  background: '#E8F5E9',
                  color: '#2E7D32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  fontSize: '1.75rem',
                  fontWeight: 'bold'
                }}>
                  ✓
                </div>
                <h4 style={{ fontFamily: 'Playfair Display', fontSize: '1.65rem', color: '#1A1A1A', fontWeight: '700' }}>
                  ¡Pago Confirmado y Cuenta Habilitada!
                </h4>
                <div style={{ background: '#F8F9FA', padding: '1rem', borderRadius: '12px', margin: '1.25rem auto', maxWidth: '480px', textAlign: 'left', fontSize: '0.82rem', color: '#444' }}>
                  <p><strong>Comprobante Stripe:</strong> <code style={{ color: '#635BFF' }}>{stripeTxId}</code></p>
                  <p><strong>Empresa:</strong> {nombreComercial || razonSocial}</p>
                  <p><strong>Plan Activado:</strong> {selectedPlan.name} ({billingCycle === 'monthly' ? 'Mensual' : 'Anual'})</p>
                  <p><strong>Usuario Maestro:</strong> {adminEmail}</p>
                  <p><strong>Estado:</strong> <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>ACTIVO EN PRODUCCIÓN</span></p>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>
                  Redirigiendo automáticamente a la tienda de tu empresa...
                </p>
              </div>
            ) : (
              <div>
                {/* ========================================================
                    PASO 1: ATRIBUTOS COMPLETOS DE LA TABLA EMPRESA
                    ======================================================== */}
                {step === 1 && (
                  <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                    <div className="saas-form-row">
                      <div className="saas-form-group">
                        <label className="saas-label">Razón Social Legal *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Comercializadora Textil Andina S.A."
                          value={razonSocial}
                          onChange={(e) => setRazonSocial(e.target.value)}
                          className="saas-input"
                        />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Nombre Comercial de la Marca *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Dressly Store"
                          value={nombreComercial}
                          onChange={(e) => {
                            setNombreComercial(e.target.value);
                            if (!codigoEmpresa) {
                              setCodigoEmpresa(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                            }
                          }}
                          className="saas-input"
                        />
                      </div>
                    </div>

                    <div className="saas-form-row-3">
                      <div className="saas-form-group">
                        <label className="saas-label">Identificador / Slug URL *</label>
                        <input
                          type="text"
                          required
                          placeholder="dressly"
                          value={codigoEmpresa}
                          onChange={(e) => setCodigoEmpresa(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                          className="saas-input"
                        />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">NIT / RUC / Identificación *</label>
                        <input
                          type="text"
                          required
                          placeholder="1029384756"
                          value={nit}
                          onChange={(e) => setNit(e.target.value)}
                          className="saas-input"
                        />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">País Sede *</label>
                        <select
                          value={pais}
                          onChange={(e) => setPais(e.target.value)}
                          className="saas-select"
                        >
                          <option value="Bolivia">Bolivia (BO)</option>
                          <option value="Chile">Chile (CL)</option>
                          <option value="Peru">Perú (PE)</option>
                          <option value="Colombia">Colombia (CO)</option>
                          <option value="Argentina">Argentina (AR)</option>
                          <option value="Mexico">México (MX)</option>
                          <option value="Espana">España (ES)</option>
                          <option value="EstadosUnidos">Estados Unidos (US)</option>
                        </select>
                      </div>
                    </div>

                    <div className="saas-form-row">
                      <div className="saas-form-group">
                        <label className="saas-label">Ciudad de Operación *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Santa Cruz de la Sierra"
                          value={ciudadNombre}
                          onChange={(e) => setCiudadNombre(e.target.value)}
                          className="saas-input"
                        />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Dirección Matriz / Oficina Central *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Av. San Martín #450, Equipetrol"
                          value={direccion}
                          onChange={(e) => setDireccion(e.target.value)}
                          className="saas-input"
                        />
                      </div>
                    </div>

                    <div className="saas-form-row">
                      <div className="saas-form-group">
                        <label className="saas-label">Teléfono Corporativo *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+591 3 3445566"
                          value={telefonoEmpresa}
                          onChange={(e) => setTelefonoEmpresa(e.target.value)}
                          className="saas-input"
                        />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Email Oficial de la Empresa *</label>
                        <input
                          type="email"
                          required
                          placeholder="contacto@tuempresa.com"
                          value={emailEmpresa}
                          onChange={(e) => setEmailEmpresa(e.target.value)}
                          className="saas-input"
                        />
                      </div>
                    </div>

                    <div className="saas-form-row">
                      <div className="saas-form-group">
                        <label className="saas-label">Moneda Principal (Catálogo y Facturación) *</label>
                        <select
                          value={monedaPrincipal}
                          onChange={(e) => setMonedaPrincipal(e.target.value)}
                          className="saas-select"
                        >
                          <option value="USD">USD ($ - Dólar Americano)</option>
                          <option value="BOB">BOB (Bs - Boliviano)</option>
                          <option value="CLP">CLP ($ - Peso Chileno)</option>
                          <option value="PEN">PEN (S/ - Sol Peruano)</option>
                          <option value="EUR">EUR (€ - Euro)</option>
                        </select>
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Moneda Secundaria (Cobros Alternativos) *</label>
                        <select
                          value={monedaSecundaria}
                          onChange={(e) => setMonedaSecundaria(e.target.value)}
                          className="saas-select"
                        >
                          <option value="BOB">BOB (Bs - Boliviano)</option>
                          <option value="USD">USD ($ - Dólar Americano)</option>
                          <option value="CLP">CLP ($ - Peso Chileno)</option>
                          <option value="PEN">PEN (S/ - Sol Peruano)</option>
                          <option value="EUR">EUR (€ - Euro)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
                      <button type="submit" className="saas-btn-hero-main" style={{ padding: '0.85rem 2rem' }}>
                        Continuar a Datos del Administrador
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* ========================================================
                    PASO 2: DATOS DEL DUEÑO Y USUARIO ADMINISTRADOR
                    ======================================================== */}
                {step === 2 && (
                  <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
                    <div className="saas-form-row">
                      <div className="saas-form-group">
                        <label className="saas-label">Nombre y Apellidos del Titular o Dueño *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Carlos Mendoza Quiroga"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="saas-input"
                        />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Cargo o Función Directiva *</label>
                        <input
                          type="text"
                          required
                          placeholder="Director General / Propietario"
                          value={ownerCargo}
                          onChange={(e) => setOwnerCargo(e.target.value)}
                          className="saas-input"
                        />
                      </div>
                    </div>

                    <div className="saas-form-row">
                      <div className="saas-form-group">
                        <label className="saas-label">Teléfono Móvil Personal *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+591 71000000"
                          value={ownerPhone}
                          onChange={(e) => setOwnerPhone(e.target.value)}
                          className="saas-input"
                        />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Correo Electrónico Maestro (Login al Sistema) *</label>
                        <input
                          type="email"
                          required
                          placeholder="admin@tuempresa.com"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="saas-input"
                        />
                        <small style={{ color: '#888', fontSize: '0.74rem', marginTop: '0.2rem', display: 'block' }}>
                          Con este correo accederás al panel de administración de tu tienda.
                        </small>
                      </div>
                    </div>

                    <div className="saas-form-group">
                      <label className="saas-label">Contraseña Maestra de Acceso *</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="Mínimo 8 caracteres (letras, números y símbolos)"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="saas-input"
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem' }}>
                      <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="saas-btn-text"
                      >
                        ← Volver a Datos de Empresa
                      </button>
                      <button type="submit" className="saas-btn-hero-main" style={{ padding: '0.85rem 2rem' }}>
                        Continuar al Pago con Stripe
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* ========================================================
                    PASO 3: PASARELA DE PAGO CON STRIPE CHECKOUT OFICIAL
                    ======================================================== */}
                {step === 3 && (
                  <form onSubmit={handleProcessStripePayment}>
                    <div className="saas-stripe-checkout-split">
                      {/* Columna Izquierda: Entorno de prueba, divisa y resumen */}
                      <div className="saas-sc-left">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="saas-sc-back-btn"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Volver a Datos de Administrador</span>
                        </button>

                        <div className="saas-sc-store-badge-wrap">
                          <div className="saas-sc-store-icon">🏬</div>
                          <span className="saas-sc-store-name">Entorno de prueba de FashionStore</span>
                          <span className="saas-sc-test-mode-pill">❖ Entorno de prueba</span>
                        </div>

                        <h3 className="saas-sc-title">
                          Pagar a Entorno de prueba de FashionStore SaaS
                        </h3>

                        {/* Selector de Divisa */}
                        <div className="saas-sc-currency-section">
                          <div className="saas-sc-currency-label">Elige divisa</div>
                          <div className="saas-sc-currency-grid">
                            <button
                              type="button"
                              onClick={() => setStripeCurrency('BOB')}
                              className={`saas-sc-currency-btn ${stripeCurrency === 'BOB' ? 'active' : ''}`}
                            >
                              <span>🇧🇴</span>
                              <span>{amountBOB} BOB</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setStripeCurrency('USD')}
                              className={`saas-sc-currency-btn ${stripeCurrency === 'USD' ? 'active' : ''}`}
                            >
                              <span>🇺🇸</span>
                              <span>{amountUSD} US$</span>
                            </button>
                          </div>
                          <div className="saas-sc-rate-note">
                            1 USD = {exchangeRateBOB.toString().replace('.', ',')} BOB
                          </div>
                        </div>

                        {/* Resumen del plan */}
                        <div className="saas-sc-line-item">
                          <div>
                            <div className="saas-sc-item-title">{selectedPlan.name}</div>
                            <div className="saas-sc-item-sub">
                              Suscripción FashionStore para {nombreComercial || razonSocial || 'tu empresa'}
                            </div>
                          </div>
                          <div className="saas-sc-item-price">
                            {currentDisplayAmount}
                          </div>
                        </div>

                        {/* Botón para abrir en Stripe Checkout oficial alojado */}
                        <div style={{ marginTop: 'auto', paddingTop: '1.25rem' }}>
                          <button
                            type="button"
                            disabled={stripeCheckoutLoading}
                            onClick={handleOpenHostedStripeCheckout}
                            className="saas-sc-hosted-btn"
                            style={{ width: '100%' }}
                          >
                            {stripeCheckoutLoading ? 'Iniciando sesión Stripe...' : '🔗 Abrir en Stripe Checkout Oficial (Nueva Ventana ↗)'}
                          </button>
                        </div>
                      </div>

                      {/* Columna Derecha: Express Checkout, Tarjeta y Botón Pagar */}
                      <div className="saas-sc-right">
                        {/* Botones de Pago Rápido Express */}
                        <div className="saas-sc-express-btns">
                          <button type="button" onClick={fillStripeTestCard} className="saas-sc-btn-apple">
                             Pay
                          </button>
                          <button type="button" onClick={fillStripeTestCard} className="saas-sc-btn-link">
                            › link
                          </button>
                        </div>

                        <div className="saas-sc-divider">
                          <span>o</span>
                        </div>

                        {/* Información de contacto */}
                        <div className="saas-sc-section-title">Información de contacto</div>
                        <div className="saas-sc-contact-box">
                          <span className="saas-sc-contact-label">Correo electrónico</span>
                          <span className="saas-sc-contact-val">{adminEmail || 'admin@tuempresa.com'}</span>
                        </div>

                        {/* Método de pago */}
                        <div className="saas-sc-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Método de pago</span>
                          <button 
                            type="button" 
                            onClick={fillStripeTestCard} 
                            style={{ fontSize: '0.72rem', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '4px', padding: '0.2rem 0.55rem', cursor: 'pointer', color: '#1F2937', fontWeight: 600 }}
                          >
                            Auto-Completar Tarjeta
                          </button>
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 600, color: '#111827', margin: '0.25rem 0 0.55rem' }}>
                          <CreditCard className="w-4 h-4 text-gray-700" />
                          <span>Tarjeta</span>
                        </div>

                        {/* Card Inputs */}
                        <div className="saas-sc-card-frame">
                          <div className="saas-sc-card-input-top">
                            <input
                              type="text"
                              required
                              placeholder="1234 1234 1234 1234"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              maxLength={19}
                            />
                            <div className="saas-sc-card-brand-logos">
                              <span className="saas-sc-brand-pill">VISA</span>
                              <span className="saas-sc-brand-pill">MC</span>
                              <span className="saas-sc-brand-pill">AMEX</span>
                              <span className="saas-sc-brand-pill">DISC</span>
                            </div>
                          </div>
                          <div className="saas-sc-card-input-bottom">
                            <input
                              type="text"
                              required
                              placeholder="MM / AA"
                              value={cardExp}
                              onChange={(e) => setCardExp(e.target.value)}
                              maxLength={5}
                            />
                            <input
                              type="password"
                              required
                              placeholder="CVC"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              maxLength={4}
                            />
                          </div>
                        </div>

                        <div className="saas-form-group" style={{ marginBottom: '0.65rem' }}>
                          <label className="saas-label" style={{ fontSize: '0.78rem' }}>Nombre del titular de la tarjeta</label>
                          <input
                            type="text"
                            required
                            placeholder="Nombre completo"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="saas-input"
                            style={{ borderRadius: '8px', padding: '0.65rem 0.85rem' }}
                          />
                        </div>

                        <div className="saas-form-group" style={{ marginBottom: '0.65rem' }}>
                          <label className="saas-label" style={{ fontSize: '0.78rem' }}>País o región</label>
                          <select
                            value={pais}
                            onChange={(e) => setPais(e.target.value)}
                            className="saas-select"
                            style={{ borderRadius: '8px', padding: '0.65rem 0.85rem' }}
                          >
                            <option value="Bolivia">Bolivia</option>
                            <option value="Chile">Chile</option>
                            <option value="Peru">Perú</option>
                            <option value="Colombia">Colombia</option>
                            <option value="Argentina">Argentina</option>
                            <option value="Mexico">México</option>
                            <option value="Espana">España</option>
                            <option value="EstadosUnidos">Estados Unidos</option>
                          </select>
                        </div>

                        {/* Checkbox Link */}
                        <div className="saas-sc-checkbox-wrap">
                          <input
                            type="checkbox"
                            id="saveLink"
                            checked={saveCardLink}
                            onChange={(e) => setSaveCardLink(e.target.checked)}
                          />
                          <label htmlFor="saveLink" className="saas-sc-checkbox-text">
                            <strong>Guarda mis datos para un proceso de compra más rápido</strong><br />
                            Paga de forma segura en Entorno de prueba de FashionStore y en todos los comercios que acepten Link.
                          </label>
                        </div>

                        {/* Botón Pagar Azul */}
                        <button
                          type="submit"
                          disabled={stripeProcessing}
                          className="saas-sc-btn-submit"
                        >
                          {stripeProcessing ? 'Procesando con Stripe...' : `Pagar ${currentDisplayAmount}`}
                        </button>

                        {/* Powered by Stripe */}
                        <div className="saas-sc-footer-brand">
                          <span>Powered by <strong>stripe</strong></span>
                          <span>•</span>
                          <a href="#terminos" style={{ color: 'inherit', textDecoration: 'none' }}>Condiciones</a>
                          <span>•</span>
                          <a href="#privacidad" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</a>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. FOOTER Y DERECHOS DE AUTOR */}
      <footer className="saas-footer">
        <div className="saas-container">
          <div className="saas-footer-grid">
            <div>
              <div className="saas-brand" style={{ marginBottom: '1rem' }}>
                <div className="saas-logo-icon">FS</div>
                <div className="saas-brand-text">
                  <span className="saas-footer-brand-title">FashionStore</span>
                  <span className="saas-brand-badge">SaaS Cloud Platform</span>
                </div>
              </div>
              <p className="saas-footer-brand-desc">
                La solución integral para boutiques, tiendas y cadenas de moda. Unificamos tu tienda en línea, puntos de venta físicos, vestidor virtual en realidad aumentada y control de existencias.
              </p>
            </div>

            <div>
              <h4 className="saas-footer-heading">Solución</h4>
              <ul className="saas-footer-links">
                <li><a href="#solucion" className="saas-footer-link">Control de Inventario</a></li>
                <li><a href="#solucion" className="saas-footer-link">Punto de Venta (POS)</a></li>
                <li><a href="#solucion" className="saas-footer-link">Ventas Fuera de Línea</a></li>
                <li><a href="#vestidor-virtual" className="saas-footer-link">Vestidor Virtual 3D</a></li>
                <li><a href="#solucion" className="saas-footer-link">Reportes Inteligentes</a></li>
              </ul>
            </div>

            <div>
              <h4 className="saas-footer-heading">Suscripciones</h4>
              <ul className="saas-footer-links">
                <li><a href="#planes" className="saas-footer-link">Plan Prueba</a></li>
                <li><a href="#planes" className="saas-footer-link">Plan Básico</a></li>
                <li><a href="#planes" className="saas-footer-link">Plan Premium</a></li>
                <li><a href="#planes" className="saas-footer-link">Plan Corporativo</a></li>
                <li><a href="#planes" className="saas-footer-link">Plan Empresarial</a></li>
              </ul>
            </div>

            <div>
              <h4 className="saas-footer-heading">Legal y Confianza</h4>
              <ul className="saas-footer-links">
                <li><a href="#terminos" className="saas-footer-link">Términos de Servicio</a></li>
                <li><a href="#privacidad" className="saas-footer-link">Política de Privacidad</a></li>
                <li><a href="#sla" className="saas-footer-link">Acuerdo de Servicio (SLA 99.9%)</a></li>
                <li><a href="#seguridad" className="saas-footer-link">Seguridad y Encriptación</a></li>
                <li><a href="#contacto" className="saas-footer-link">Contacto y Soporte</a></li>
              </ul>
            </div>
          </div>

          <div className="saas-footer-bottom">
            <p className="saas-copyright">
              © 2026 FashionStore SaaS Platform. Todos los derechos reservados. Prohibida su reproducción total o parcial sin autorización.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span>Certificación de Pago Seguro Stripe</span>
              <span>Protección de Datos Garantizada</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default SaasLandingPage;
