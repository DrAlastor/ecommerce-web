import React, { useState, useRef, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Users,
  Tag,
  CheckCircle2,
  Lock,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SaasLandingPage.css';
const publicApiFetch = (path: string, options: RequestInit) => fetch(
  (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '') + path,
  {...options, signal: AbortSignal.timeout(120000)},
);

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

  // Selector de Pasarela: Stereum (QR Bolivia) vs Stripe (Internacional)
  const [paymentGateway, setPaymentGateway] = useState<'stereum' | 'stripe'>('stripe');
  const [stereumLoading, setStereumLoading] = useState(false);
  const [stereumQrBase64, setStereumQrBase64] = useState<string | null>(null);
  const [stereumTxId, setStereumTxId] = useState<string | null>(null);
  const [stereumAmountBob, setStereumAmountBob] = useState<number | null>(null);

  // Formulario Paso 3: Pasarela de Pago con Stripe Checkout
  const exchangeRateBOB = 12.3656;
  const [stripeCurrency, setStripeCurrency] = useState<'BOB' | 'USD'>('BOB');
  const [stripeCheckoutLoading, setStripeCheckoutLoading] = useState(false);
  const [stripeProcessing, setStripeProcessing] = useState(false);
  const [stripeTxId, setStripeTxId] = useState('');
  const [publicStores, setPublicStores] = useState<{codigo_empresa: string; nombre_comercial: string; logo_url: string}[]>([]);
  const [storeLoadError, setStoreLoadError] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const res = await publicApiFetch('/users-security/company/public', {});
        if (!res.ok) throw new Error('Tiendas no disponibles');
        const stores = await res.json();
        if (active) { setPublicStores(stores); setStoreLoadError(false); }
      } catch { if (active) setStoreLoadError(true); }
    };
    void refresh(); window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, []);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  useEffect(() => { setStripeTxId(''); }, [selectedPlan?.id, billingCycle, codigoEmpresa, adminEmail, stripeCurrency]);

  const baseUSD = selectedPlan ? (billingCycle === 'monthly' ? selectedPlan.priceMonth : selectedPlan.priceYear) : 0;
  const amountBOB = (baseUSD * exchangeRateBOB).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountUSD = baseUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currentDisplayAmount = stripeCurrency === 'BOB' ? `${amountBOB} BOB` : `${amountUSD} US$`;

  // Utilidad para parseo HTTP seguro sin fallos de "Unexpected end of JSON input"
  const parseSafeResponse = async (res: Response) => {
    const text = await res.text();
    if (!text || text.trim() === '') {
      if (!res.ok) {
        throw new Error(`El servidor respondió con código HTTP ${res.status} (${res.statusText || 'Error de conexión'}). Verifique que el servicio backend esté activo.`);
      }
      return {};
    }
    try {
      return JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(`Error del servidor (${res.status}): ${text.substring(0, 180)}`);
      }
      return { message: text };
    }
  };

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

  // Genera o consulta el cobro QR oficial en Stereum
  const loadStereumCharge = async () => {
    if (!selectedPlan) return;
    setStereumLoading(true);
    try {
      const slug = (codigoEmpresa || nombreComercial.toLowerCase().replace(/[^a-z0-9]/g, '')).trim();
      const res = await publicApiFetch('/sales-billing/saas/stereum/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          priceUSD: baseUSD,
          currency: 'BOB',
          billingCycle,
          empresaSlug: slug,
          nombreComercial: nombreComercial || razonSocial,
          adminEmail,
        }),
      });
      const data = await parseSafeResponse(res);
      if (data?.qr_base64) {
        setStereumQrBase64(data.qr_base64);
      }
      if (data?.id) {
        setStereumTxId(data.id);
      }
      if (data?.amount) {
        setStereumAmountBob(data.amount);
      }
    } catch (err: any) {
      console.warn('Stereum load fallback:', err.message);
    } finally {
      setStereumLoading(false);
    }
  };

  // Autocompletar tarjeta de pruebas oficial de Stripe
  const handleOpenHostedStripeCheckout = async () => {
    if (!selectedPlan) return;
    const checkoutWindow = window.open('about:blank', '_blank');
    if (!checkoutWindow) { alert('Permite ventanas emergentes para abrir Stripe.'); return; }
    setStripeCheckoutLoading(true);
    try {
      const res = await publicApiFetch('/sales-billing/saas/create-checkout-session', {
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
          codigoEmpresa: (codigoEmpresa || nombreComercial.toLowerCase().replace(/[^a-z0-9]/g, '')).trim(),
          adminEmail,
        }),
      });
      const data = await parseSafeResponse(res);
      if (!res.ok) {
        throw new Error(data?.message || 'Error al inicializar sesión de Stripe.');
      }
      if (data?.url) {
        setStripeTxId(data.sessionId);
        checkoutWindow.location.href = data.url;
        if (!checkoutWindow) throw new Error('Permite las ventanas emergentes para abrir Stripe y vuelve a intentarlo.');
      } else {
        throw new Error(data?.message || data?.error || 'Stripe no devolvió una sesión de pago válida.');
      }
    } catch (err: any) {
      checkoutWindow.close();
      alert(err.message || 'Error al conectar con Stripe Checkout.');
    } finally {
      setStripeCheckoutLoading(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStripeProcessing(true);

    try {
      const slug = (codigoEmpresa || nombreComercial.toLowerCase().replace(/[^a-z0-9]/g, '')).trim();
      if (!slug) {
        throw new Error('Debe ingresar un identificador único (slug) para su empresa.');
      }

      const isTrial = selectedPlan?.id === 'PRUEBA';
      if (!isTrial && paymentGateway !== 'stripe') throw new Error('El alta de planes de pago requiere confirmación de Stripe. El QR no tiene verificación automática configurada.');
      if (!isTrial && !stripeTxId.startsWith('cs_')) {
        await handleOpenHostedStripeCheckout();
        return;
      }
      const generatedTxId = isTrial ? '' : stripeTxId;

      const payload = {
        codigo_empresa: slug,
        razon_social: razonSocial || nombreComercial,
        nombre_comercial: nombreComercial,
        nit,
        pais,
        ciudad_nombre: ciudadNombre,
        direccion,
        telefono: telefonoEmpresa,
        email: emailEmpresa,
        moneda_principal: monedaPrincipal,
        moneda_secundaria: monedaSecundaria,
        admin_nombre: ownerName,
        admin_email: adminEmail,
        admin_password: adminPassword,
        admin_telefono: ownerPhone,
        admin_cargo: ownerCargo,
        plan_id: selectedPlan?.id || 'trial',
        stripe_tx_id: generatedTxId,
      };

      const res = await publicApiFetch('/users-security/company/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await parseSafeResponse(res);
      if (!res.ok) {
        const errorMsg = Array.isArray(responseData?.message)
          ? responseData.message.join('. ')
          : (responseData?.message || 'Error en el registro y aprovisionamiento de la empresa.');
        throw new Error(errorMsg);
      }

      setStripeTxId(generatedTxId);
      setStripeProcessing(false);
      setPaymentSuccess(true);

      setTimeout(() => {
        setShowModal(false);
        navigate(`/store/${slug}`);
      }, 3500);
    } catch (err: any) {
      alert(err.message || 'Error al procesar el registro.');
      setStripeProcessing(false);
    } finally {
      setStripeProcessing(false);
    }
  };

  return (
    <div className="saas-page">
      {/* 1. HEADER / NAVBAR REORGANIZADO SIN CHOQUES */}
      <header className="saas-header">
        <div className="saas-container">
          <nav className="saas-nav">
            <a href="/" className="saas-brand">
              <img 
                src="https://fashionstorestorages.blob.core.windows.net/media/logo-fashionstore.png" 
                onError={(e) => { e.currentTarget.src = '/logo-fashionstore.png'; }}
                alt="FashionStore Logo" 
                className="saas-brand-logo-img" 
              />
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
                onClick={() => navigate('/saas/login')}
                className="saas-btn-text"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                title="Acceso al Panel de Super Administrador del SaaS"
              >
                <Lock className="w-4 h-4 text-amber-600" />
                Iniciar Sesión
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
              onClick={() => navigate('/saas/login')}
              className="saas-btn-hero-secondary"
            >
              <Lock className="w-4 h-4 text-amber-700" />
              Iniciar Sesión
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
              <Sparkles className="w-4 h-4 text-[#C4956A] inline-block mr-1.5" />
              Desliza o usa los botones para comparar los 5 planes empresariales:
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
                        <div className="saas-plan-limit-row">
                          <Building2 className="w-3.5 h-3.5 saas-plan-limit-icon" />
                          <span>{plan.limits.branches}</span>
                        </div>
                        <div className="saas-plan-limit-row">
                          <Users className="w-3.5 h-3.5 saas-plan-limit-icon" />
                          <span>{plan.limits.users}</span>
                        </div>
                        <div className="saas-plan-limit-row">
                          <Tag className="w-3.5 h-3.5 saas-plan-limit-icon" />
                          <span>{plan.limits.products}</span>
                        </div>
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

          {storeLoadError && <p>No se pudo cargar la lista de tiendas. Vuelve a intentarlo al recuperar la conexión.</p>}
          <div className="saas-grid-3">
            {publicStores.map(store => <div key={store.codigo_empresa} className="saas-card-feature">
              {store.logo_url && <div className="saas-tenant-logo-badge"><img src={store.logo_url} alt={store.nombre_comercial} className="saas-tenant-logo-img" onError={e => {e.currentTarget.style.display='none';}} /></div>}
              <h3 className="saas-feature-title">{store.nombre_comercial}</h3>
              <p className="saas-feature-text">Explora el catálogo de esta tienda.</p>
              <button className="saas-btn-primary" onClick={() => navigate('/store/' + encodeURIComponent(store.codigo_empresa))}>Visitar tienda <ArrowRight size={18} /></button>
            </div>)}
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
                <div className="saas-step-num">{step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}</div>
                <span>1. Datos de Empresa</span>
              </div>
              <div className={`saas-step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
                <div className="saas-step-num">{step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}</div>
                <span>2. Dueño y Administrador</span>
              </div>
              <div className={`saas-step-item ${step === 3 ? 'active' : ''}`}>
                <div className="saas-step-num">3</div>
                <span>3. Pasarela de Pago</span>
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
                }}>
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h4 style={{ fontFamily: 'Playfair Display', fontSize: '1.65rem', color: '#1A1A1A', fontWeight: '700' }}>
                  ¡Pago Confirmado y Cuenta Habilitada!
                </h4>
                <div style={{ background: '#F8F9FA', padding: '1.25rem', borderRadius: '12px', margin: '1.25rem auto', maxWidth: '480px', textAlign: 'left', fontSize: '0.85rem', color: '#444', lineHeight: 1.6 }}>
                  <p><strong>Comprobante de Pago:</strong> <code style={{ color: '#635BFF' }}>{stripeTxId}</code></p>
                  <p><strong>Empresa:</strong> {nombreComercial || razonSocial}</p>
                  <p><strong>Ruta Exclusiva:</strong> <code style={{ color: '#0284C7' }}>/store/{codigoEmpresa}</code></p>
                  <p><strong>Base de Datos Físicamente Aislada:</strong> <code style={{ color: '#059669' }}>{codigoEmpresa}_db</code></p>
                  <p><strong>Plan Activado:</strong> {selectedPlan.name} ({billingCycle === 'monthly' ? 'Mensual' : 'Anual'})</p>
                  <p><strong>Usuario Administrador:</strong> {adminEmail}</p>
                  <p><strong>Estado:</strong> <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>APROVISIONADO Y ACTIVO</span></p>
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

                    <div className="saas-modal-actions end">
                      <button type="submit" className="saas-btn-hero-main" style={{ padding: '0.85rem 2rem' }}>
                        <span>Continuar a Datos del Administrador</span>
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

                    <div className="saas-modal-actions">
                      <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="saas-btn-text"
                      >
                        <ChevronLeft className="w-4 h-4 inline-block mr-1" />
                        <span>Volver a Datos de Empresa</span>
                      </button>
                      <button type="submit" className="saas-btn-hero-main" style={{ padding: '0.85rem 2rem' }}>
                        Continuar al Pago con Stripe
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* ========================================================
                    PASO 3: PASARELA DE PAGO OFICIAL (STEREUM QR + STRIPE)
                    ======================================================== */}
                {step === 3 && (
                  <div>
                    {/* Selector de Pasarela */}
                    <div className="saas-gateway-selector">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentGateway('stereum');
                          if (!stereumQrBase64) loadStereumCharge();
                        }}
                        className={`saas-gateway-tab ${paymentGateway === 'stereum' ? 'active' : ''}`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>🇧🇴 Stereum Pay (Pago QR / Cripto BOB)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentGateway('stripe')}
                        className={`saas-gateway-tab ${paymentGateway === 'stripe' ? 'active' : ''}`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>💳 Stripe Checkout (Tarjeta Internacional)</span>
                      </button>
                    </div>

                    {paymentGateway === 'stereum' ? (
                      <form onSubmit={handleProcessPayment}>
                        <div className="saas-stripe-checkout-split">
                          {/* Columna Izquierda: Datos y Resumen */}
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
                              <div className="saas-sc-store-icon">🇧🇴</div>
                              <span className="saas-sc-store-name">Stereum SRL — Pasarela Oficial</span>
                              <span className="saas-stereum-badge">⚡ QR Simple</span>
                            </div>

                            <h3 className="saas-sc-title">
                              Pago Inmediato de Suscripción SaaS
                            </h3>

                            <div className="saas-sc-line-item" style={{ marginTop: '1.25rem' }}>
                              <div>
                                <div className="saas-sc-item-title">{selectedPlan.name}</div>
                                <div className="saas-sc-item-sub">
                                  Suscripción {billingCycle === 'monthly' ? 'Mensual' : 'Anual'} para {nombreComercial || razonSocial}
                                </div>
                              </div>
                              <div className="saas-sc-item-price">
                                Bs. {stereumAmountBob ? stereumAmountBob.toFixed(2) : amountBOB} BOB
                              </div>
                            </div>

                            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#F8F9FA', borderRadius: '12px', fontSize: '0.82rem', color: '#444', lineHeight: 1.6 }}>
                              <p><strong>Identificador Empresa:</strong> <code>{codigoEmpresa || 'empresa'}</code></p>
                              <p><strong>Email Administrador:</strong> {adminEmail}</p>
                              <p><strong>ID Transacción Stereum:</strong> <code style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>{stereumTxId || 'Generando sesión...'}</code></p>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '1.25rem' }}>
                              <button
                                type="button"
                                onClick={loadStereumCharge}
                                disabled={stereumLoading}
                                className="saas-sc-hosted-btn"
                                style={{ width: '100%', justifyContent: 'center' }}
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${stereumLoading ? 'animate-spin' : ''}`} />
                                <span>{stereumLoading ? 'Actualizando QR...' : '🔄 Regenerar Código QR Stereum'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Columna Derecha: QR Stereum en Vivo */}
                          <div className="saas-sc-right">
                            <div className="saas-stereum-card">
                              <span className="saas-stereum-badge">✓ Red de Pagos Inmediatos Stereum (CSL)</span>
                              <div className="saas-stereum-amount">
                                Bs. {stereumAmountBob ? stereumAmountBob.toFixed(2) : amountBOB} BOB
                              </div>
                              <p className="saas-stereum-subtitle">
                                Abre tu aplicación bancaria boliviana favorita o billetera digital y escanea el código para procesar el pago:
                              </p>

                              <div className="saas-stereum-qr-wrapper">
                                {stereumLoading ? (
                                  <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem', color: '#666' }}>
                                    <RefreshCw className="w-8 h-8 animate-spin text-[#C4956A]" />
                                    <span style={{ fontSize: '0.8rem' }}>Conectando con Stereum...</span>
                                  </div>
                                ) : stereumQrBase64 ? (
                                  <img
                                    src={`data:image/png;base64,${stereumQrBase64}`}
                                    alt="Código QR Stereum Pay"
                                    className="saas-stereum-qr-img"
                                  />
                                ) : (
                                  <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem', padding: '1rem', color: '#888' }}>
                                    <QrCode className="w-12 h-12 text-gray-400" />
                                    <span style={{ fontSize: '0.78rem', textAlign: 'center' }}>
                                      QR listo para escanear en cualquier banco
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="saas-stereum-bank-logos">
                                <span className="saas-stereum-pill">Banco Unión</span>
                                <span className="saas-stereum-pill">BCP</span>
                                <span className="saas-stereum-pill">BNB</span>
                                <span className="saas-stereum-pill">Banco Ganadero</span>
                                <span className="saas-stereum-pill">Mercantil</span>
                                <span className="saas-stereum-pill">USDT / Cripto</span>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={stripeProcessing}
                              className="saas-sc-btn-submit"
                              style={{ background: '#2E7D32', marginTop: '1.25rem' }}
                            >
                              {stripeProcessing ? 'Aprovisionando Empresa en PostgreSQL...' : '✓ Confirmar Pago y Crear Cuenta'}
                            </button>

                            <div className="saas-sc-footer-brand">
                              <span>Powered by <strong>Stereum SRL</strong> • Seguro & Auditado</span>
                            </div>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleProcessPayment}>
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
                        <p>Completa el pago en la página oficial de Stripe. Luego regresa a esta ventana y pulsa «Ya pagué: verificar y crear empresa».</p>
                        <p>Correo del administrador: <strong>{adminEmail}</strong></p>
                            {/* Botón Pagar Azul */}
                            <button
                              type="submit"
                              disabled={stripeProcessing}
                              className="saas-sc-btn-submit"
                            >
                              {stripeProcessing ? 'Procesando...' : stripeTxId.startsWith('cs_') ? 'Ya pagué: verificar y crear empresa' : `Continuar en Stripe (${currentDisplayAmount})`}
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
                <img 
                  src="https://fashionstorestorages.blob.core.windows.net/media/logo-fashionstore.png" 
                  onError={(e) => { e.currentTarget.src = '/logo-fashionstore.png'; }}
                  alt="FashionStore Logo" 
                  className="saas-brand-logo-img" 
                />
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
