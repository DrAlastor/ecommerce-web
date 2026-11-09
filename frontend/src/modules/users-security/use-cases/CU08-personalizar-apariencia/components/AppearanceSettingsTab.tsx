import React, { useState, useEffect } from 'react';
import {
  Palette,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Sparkles,
  Smartphone,
  Monitor,
  ShoppingBag,
  Search,
  Store,
  Layout,
  Sliders,
  Type,
} from 'lucide-react';
import { appearanceService } from '../services/appearance.service';
import type { AppearanceData } from '../services/appearance.service';
import '../../CU07-gestionar-empresas/pages/SettingsPages.css';

interface ThemePresetItem {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  adminSidebar: string;
  adminAccent: string;
  font: string;
  tagline: string;
  badge: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
  heroBannerUrl: string;
}

const PRESET_PALETTES: Record<string, ThemePresetItem[]> = {
  dressly: [
    {
      id: 'dressly-couture',
      name: 'Haute Couture (Oficial)',
      primary: '#1A1A1A',
      secondary: '#C4956A',
      accent: '#8C7B6D',
      adminSidebar: '#1A1918',
      adminAccent: '#C4956A',
      font: 'Playfair Display, Georgia, serif',
      tagline: 'FASHION STORE',
      badge: 'NUEVA COLECCIÓN 2026',
      heroHeadline: 'Eleva Tu',
      heroSubheadline: 'Estilo Cotidiano',
      heroDescription: 'Descubre prendas atemporales diseñadas para el máximo confort y la más pura elegancia. Confeccionadas pensando en ti.',
      ctaPrimary: 'Comprar Ahora',
      ctaSecondary: 'Ver Lookbook',
      heroBannerUrl: 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg',
    },
    {
      id: 'dressly-champagne',
      name: 'Champagne & Rose Gold',
      primary: '#262220',
      secondary: '#D4AF37',
      accent: '#C5A059',
      adminSidebar: '#2B2520',
      adminAccent: '#D4AF37',
      font: 'Cinzel, serif',
      tagline: 'LUXURY BOUTIQUE',
      badge: 'EDICIÓN LIMITADA',
      heroHeadline: 'Sastrería &',
      heroSubheadline: 'Lujo Atemporal',
      heroDescription: 'Prendas exclusivas confeccionadas con lino natural, sedas finas y patrones de autor.',
      ctaPrimary: 'Explorar Tienda',
      ctaSecondary: 'Lookbook Exclusivo',
      heroBannerUrl: 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg',
    },
    {
      id: 'dressly-noir',
      name: 'Minimal Monochrome',
      primary: '#111111',
      secondary: '#E5E5E5',
      accent: '#737373',
      adminSidebar: '#111827',
      adminAccent: '#3B82F6',
      font: 'Playfair Display, Georgia, serif',
      tagline: 'ATELIER CONTEMPORÁNEO',
      badge: 'PRÊT-À-PORTER',
      heroHeadline: 'Elegancia Pura &',
      heroSubheadline: 'Minimalismo',
      heroDescription: 'Siluetas arquitectónicas sobrias con la máxima pureza de líneas y sofisticación.',
      ctaPrimary: 'Comprar Ahora',
      ctaSecondary: 'Ver Lookbook',
      heroBannerUrl: 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg',
    },
  ],
  'aura-sport': [
    {
      id: 'aura-volt',
      name: 'Kinetic Volt (Oficial)',
      primary: '#0A0A0A',
      secondary: '#D4FF00',
      accent: '#00F0FF',
      adminSidebar: '#0A0A0A',
      adminAccent: '#D4FF00',
      font: 'Oswald, sans-serif',
      tagline: 'ATHLETIC WEAR',
      badge: 'PERFORMANCE 2026',
      heroHeadline: 'Supera Tus',
      heroSubheadline: 'Límites Activos',
      heroDescription: 'Ropa técnica de compresión y running diseñada para maximizar tu potencia y resistencia.',
      ctaPrimary: 'Comprar Colección',
      ctaSecondary: 'Ver Lookbook',
      heroBannerUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1600&auto=format&fit=crop',
    },
  ],
  urbanly: [
    {
      id: 'urbanly-neutral',
      name: 'Brutalist Sand (Oficial)',
      primary: '#18181B',
      secondary: '#D4C5B9',
      accent: '#A89F91',
      adminSidebar: '#21201E',
      adminAccent: '#D4C5B9',
      font: 'Inter, sans-serif',
      tagline: 'OVERSIZED ESSENTIALS',
      badge: 'STREET DROP 2026',
      heroHeadline: 'Estilo Urbano &',
      heroSubheadline: 'Corte Oversize',
      heroDescription: 'Hoodies boxy de 500 GSM, joggers cargo y estética relajada para la calle.',
      ctaPrimary: 'Explorar Drop',
      ctaSecondary: 'Ver Lookbook',
      heroBannerUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1600&auto=format&fit=crop',
    },
  ],
};

const OFFICIAL_HERO_IMAGES = [
  {
    id: 'editorial-blazer',
    label: 'Dressly Elegance',
    url: 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg',
  },
  {
    id: 'editorial-urban',
    label: 'Urban Streetwear',
    url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 'editorial-sport',
    label: 'Aura Athletics',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1600&auto=format&fit=crop',
  },
];

export const AppearanceSettingsTab: React.FC = () => {
  // El tenant se determina desde la configuración local o de sesión (un tenant solo edita su propio sistema)
  const currentTenant = localStorage.getItem('tenantKey') || 'dressly';
  const tenantDisplayName =
    currentTenant === 'aura-sport'
      ? 'Aura Athletics'
      : currentTenant === 'urbanly'
      ? 'Urbanly'
      : 'Dressly Fashion Store';

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const [theme, setTheme] = useState<AppearanceData>({
    codigo_empresa: currentTenant,
    primary_color: '#1A1A1A',
    secondary_color: '#C4956A',
    accent_color: '#8C7B6D',
    admin_sidebar_color: '#1A1918',
    admin_accent_color: '#C4956A',
    storefront_bg_color: '#F8F5F1',
    font_family: 'Playfair Display, Georgia, serif',
    hero_headline: 'Eleva Tu',
    hero_subheadline: 'Estilo Cotidiano',
    hero_description: 'Descubre prendas atemporales diseñadas para el máximo confort y la más pura elegancia. Confeccionadas pensando en ti.',
    hero_banner_url: 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg',
    tagline: 'FASHION STORE',
    badge: 'NUEVA COLECCIÓN 2026',
    cta_primary_text: 'Comprar Ahora',
    cta_secondary_text: 'Ver Lookbook',
    trust1_title: 'Envío Gratis',
    trust1_desc: 'En compras más de 350 Bs',
    trust2_title: 'Devolución Fácil',
    trust2_desc: '30 días sin costo',
    trust3_title: 'Pago 100% Seguro',
    trust3_desc: 'QR, Tarjeta & Bancos',
  });

  const loadAppearance = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await appearanceService.getAppearance(currentTenant);
      setTheme((prev) => ({
        ...prev,
        ...data,
        cta_primary_text: data.cta_primary_text || 'Comprar Ahora',
        cta_secondary_text: data.cta_secondary_text || 'Ver Lookbook',
        trust1_title: data.trust1_title || 'Envío Gratis',
        trust1_desc: data.trust1_desc || 'En compras más de 350 Bs',
        trust2_title: data.trust2_title || 'Devolución Fácil',
        trust2_desc: data.trust2_desc || '30 días sin costo',
        trust3_title: data.trust3_title || 'Pago 100% Seguro',
        trust3_desc: data.trust3_desc || 'QR, Tarjeta & Bancos',
        admin_sidebar_color: data.admin_sidebar_color || '#1A1918',
        admin_accent_color: data.admin_accent_color || data.secondary_color || '#C4956A',
        storefront_bg_color: data.storefront_bg_color || '#F8F5F1',
      }));
    } catch (err: any) {
      console.warn('Usando valores iniciales de apariencia:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppearance();
  }, [currentTenant]);

  const handleInputChange = (field: keyof AppearanceData, val: string) => {
    setTheme((prev) => ({ ...prev, [field]: val }));
  };

  const applyPreset = (preset: ThemePresetItem) => {
    setTheme((prev) => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent,
      admin_sidebar_color: preset.adminSidebar,
      admin_accent_color: preset.adminAccent,
      font_family: preset.font,
      tagline: preset.tagline,
      badge: preset.badge,
      hero_headline: preset.heroHeadline,
      hero_subheadline: preset.heroSubheadline,
      hero_description: preset.heroDescription,
      cta_primary_text: preset.ctaPrimary,
      cta_secondary_text: preset.ctaSecondary,
      hero_banner_url: preset.heroBannerUrl,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await appearanceService.updateAppearance(theme, currentTenant);
      setSuccessMsg(res.message || 'Apariencia de su tienda actualizada exitosamente.');
      setTheme((prev) => ({ ...prev, ...res.data }));

      // Inyectar en vivo las variables CSS en la página actual para respuesta inmediata
      document.documentElement.style.setProperty('--color-primary', theme.primary_color);
      document.documentElement.style.setProperty('--color-secondary', theme.secondary_color);
      document.documentElement.style.setProperty('--color-accent', theme.accent_color);
      document.documentElement.style.removeProperty('--admin-sidebar-bg');
      document.documentElement.style.setProperty('--font-display', theme.font_family);
      document.documentElement.style.setProperty('--storefront-hero-bg', theme.storefront_bg_color || '#F8F5F1');

      // Guardar también en localStorage para persistencia instantánea entre pestañas
      localStorage.setItem(`tenant_appearance_${currentTenant}`, JSON.stringify(theme));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar la apariencia.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const currentPresets = PRESET_PALETTES[currentTenant] || PRESET_PALETTES.dressly;

  return (
    <div className="settings-card">
      {/* Header sin selectores de otros tenants */}
      <div className="settings-header">
        <div className="settings-header-info">
          <div className="settings-header-icon">
            <Palette size={24} />
          </div>
          <div>
            <div className="settings-title-row">
              <h2 className="settings-title">Personalización de Apariencia</h2>
              <span className="settings-status-badge">Activo</span>
            </div>
            <p className="settings-subtitle">
              Personaliza los colores de afuera (vitrina), los de adentro (panel), tipografía y el diseño del titular de la portada
            </p>
          </div>
        </div>

        {/* Indicador del Tenant Activo */}
        <div className="current-tenant-badge">
          <Store size={16} />
          <span>Inquilino: <strong>{tenantDisplayName}</strong></span>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="settings-alert settings-alert-error">
          <AlertCircle size={20} />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="settings-alert settings-alert-success">
          <CheckCircle size={20} />
          <div>{successMsg}</div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: '#736B63' }}>
          <RefreshCw size={24} className="animate-spin" />
          <span>Cargando tema de apariencia...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Split Layout: Izquierda Controles / Derecha Previsualización en Vivo */}
          <div className="appearance-split-layout">
            {/* COLUMNA IZQUIERDA: CONTROLES DE PERSONALIZACIÓN */}
            <div className="appearance-controls-col">
              {/* Presets Rápidos del Tenant */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 className="settings-section-title">
                  <Sparkles size={18} />
                  Estilos y Paletas Rápidas para {tenantDisplayName}
                </h3>
                <div className="presets-grid">
                  {currentPresets.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`preset-card ${
                        theme.primary_color.toLowerCase() === preset.primary.toLowerCase() &&
                        theme.font_family === preset.font
                          ? 'active'
                          : ''
                      }`}
                    >
                      <h4 className="preset-title">{preset.name}</h4>
                      <div className="preset-swatches">
                        <span className="preset-dot" style={{ backgroundColor: preset.primary }} title="Primario" />
                        <span className="preset-dot" style={{ backgroundColor: preset.secondary }} title="Secundario" />
                        <span className="preset-dot" style={{ backgroundColor: preset.accent }} title="Acento" />
                        <span className="preset-dot" style={{ backgroundColor: preset.adminSidebar }} title="Admin Sidebar" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 1: COLORES DE AFUERA (VITRINA PÚBLICA) */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 className="settings-section-title">
                  <Palette size={18} />
                  Colores de Afuera (Vitrina & Tienda Online)
                </h3>
                <div className="color-pickers-grid">
                  {/* Primario */}
                  <div className="color-picker-item">
                    <label className="settings-label">Color Primario (Botones & Títulos)</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        value={theme.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="color-input-box"
                      />
                      <input
                        type="text"
                        value={theme.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="color-hex-text"
                        placeholder="#1A1A1A"
                      />
                    </div>
                    <span className="color-role-hint">Navbar, botones principales "Comprar Ahora", titulares</span>
                  </div>

                  {/* Secundario */}
                  <div className="color-picker-item">
                    <label className="settings-label">Color Secundario / Acento Principal</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        value={theme.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="color-input-box"
                      />
                      <input
                        type="text"
                        value={theme.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="color-hex-text"
                        placeholder="#C4956A"
                      />
                    </div>
                    <span className="color-role-hint">Precios destacados, etiquetas doradas y rebajas</span>
                  </div>

                  {/* Fondo del Hero / Vitrina */}
                  <div className="color-picker-item">
                    <label className="settings-label">Fondo de Portada (Hero Section)</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        value={theme.storefront_bg_color || '#F8F5F1'}
                        onChange={(e) => handleInputChange('storefront_bg_color', e.target.value)}
                        className="color-input-box"
                      />
                      <input
                        type="text"
                        value={theme.storefront_bg_color || '#F8F5F1'}
                        onChange={(e) => handleInputChange('storefront_bg_color', e.target.value)}
                        className="color-hex-text"
                        placeholder="#F8F5F1"
                      />
                    </div>
                    <span className="color-role-hint">Tono de fondo cálido o neutro para la cabecera</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: ESTILO DEL PANEL ADMINISTRATIVO */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 className="settings-section-title">
                  <Layout size={18} />
                  Estilo del Panel Administrativo (Adentro)
                </h3>
                <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: '#FAF8F5', border: '1px solid #E5E0D8', marginBottom: '1rem', fontSize: '0.82rem', color: '#635A52' }}>
                  El panel de control izquierdo mantiene su diseño original claro (#FFFFFF) para máxima legibilidad y armonía visual.
                </div>
                <div className="color-pickers-grid">
                  {/* Admin Accent */}
                  <div className="color-picker-item">
                    <label className="settings-label">Color de Selección Activa en el Menú</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        value={theme.admin_accent_color || theme.secondary_color || '#C4956A'}
                        onChange={(e) => handleInputChange('admin_accent_color', e.target.value)}
                        className="color-input-box"
                      />
                      <input
                        type="text"
                        value={theme.admin_accent_color || theme.secondary_color || '#C4956A'}
                        onChange={(e) => handleInputChange('admin_accent_color', e.target.value)}
                        className="color-hex-text"
                        placeholder="#C4956A"
                      />
                    </div>
                    <span className="color-role-hint">Color de destaque del elemento seleccionado en el menú</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: TIPOGRAFÍA */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 className="settings-section-title">
                  <Type size={18} />
                  Tipo de Letra Oficial (Tipografía de Marca)
                </h3>
                <div className="settings-form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="settings-label">Familia Tipográfica para Titulares</label>
                    <select
                      value={theme.font_family}
                      onChange={(e) => handleInputChange('font_family', e.target.value)}
                      className="settings-select"
                      style={{ fontFamily: theme.font_family }}
                    >
                      <option value="Playfair Display, Georgia, serif">Playfair Display — Editorial, Alta Costura & Elegancia</option>
                      <option value="Inter, system-ui, sans-serif">Inter — Minimalista, Moderna & Urbana</option>
                      <option value="Montserrat, sans-serif">Montserrat — Geométrica, Contemporánea</option>
                      <option value="Cinzel, serif">Cinzel — Lujo Clásico, Joyería & Premium</option>
                      <option value="Oswald, sans-serif">Oswald — Impacto Atlético, Dinámica & Condensada</option>
                      <option value="Plus Jakarta Sans, sans-serif">Plus Jakarta Sans — Tecnológica & Vanguardista</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: DISEÑO Y CONTENIDO DE LA LANDING PAGE (PORTADA - FOTO 2) */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 className="settings-section-title">
                  <Sliders size={18} />
                  Diseño de Portada en la Landing Page
                </h3>
                <div className="settings-form-grid">
                  {/* Badge Superior */}
                  <div className="form-group">
                    <label className="settings-label">Etiqueta Superior (Badge)</label>
                    <input
                      type="text"
                      value={theme.badge}
                      onChange={(e) => handleInputChange('badge', e.target.value)}
                      className="settings-input"
                      placeholder="NUEVA COLECCIÓN 2026"
                    />
                  </div>

                  {/* Tagline de la Tienda */}
                  <div className="form-group">
                    <label className="settings-label">Slogan o Tagline en Navbar</label>
                    <input
                      type="text"
                      value={theme.tagline}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      className="settings-input"
                      placeholder="FASHION STORE"
                    />
                  </div>

                  {/* Titular Línea 1 */}
                  <div className="form-group">
                    <label className="settings-label">Título Principal (Línea 1)</label>
                    <input
                      type="text"
                      value={theme.hero_headline}
                      onChange={(e) => handleInputChange('hero_headline', e.target.value)}
                      className="settings-input"
                      placeholder="Eleva Tu"
                    />
                  </div>

                  {/* Titular Línea 2 */}
                  <div className="form-group">
                    <label className="settings-label">Título Principal (Línea 2 - Destacado)</label>
                    <input
                      type="text"
                      value={theme.hero_subheadline}
                      onChange={(e) => handleInputChange('hero_subheadline', e.target.value)}
                      className="settings-input"
                      placeholder="Estilo Cotidiano"
                    />
                  </div>

                  {/* Bajada / Descripción */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="settings-label">Descripción de la Portada</label>
                    <textarea
                      rows={3}
                      value={theme.hero_description}
                      onChange={(e) => handleInputChange('hero_description', e.target.value)}
                      className="settings-textarea"
                      placeholder="Descubre prendas atemporales diseñadas para el máximo confort y la más pura elegancia. Confeccionadas pensando en ti."
                    />
                  </div>

                  {/* Botones CTA */}
                  <div className="form-group">
                    <label className="settings-label">Texto Botón Principal (CTA 1)</label>
                    <input
                      type="text"
                      value={theme.cta_primary_text || 'Comprar Ahora'}
                      onChange={(e) => handleInputChange('cta_primary_text', e.target.value)}
                      className="settings-input"
                      placeholder="Comprar Ahora"
                    />
                  </div>

                  <div className="form-group">
                    <label className="settings-label">Texto Botón Secundario (CTA 2)</label>
                    <input
                      type="text"
                      value={theme.cta_secondary_text || 'Ver Lookbook'}
                      onChange={(e) => handleInputChange('cta_secondary_text', e.target.value)}
                      className="settings-input"
                      placeholder="Ver Lookbook"
                    />
                  </div>

                  {/* Imagen Editorial de Portada */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="settings-label">Imagen Editorial de Portada (Hero Banner)</label>
                    <input
                      type="url"
                      value={theme.hero_banner_url}
                      onChange={(e) => handleInputChange('hero_banner_url', e.target.value)}
                      className="settings-input"
                      placeholder="https://..."
                    />

                    {/* Miniaturas Rápidas para Selección */}
                    <div className="banner-thumbs-grid">
                      {OFFICIAL_HERO_IMAGES.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => handleInputChange('hero_banner_url', img.url)}
                          className={`banner-thumb ${theme.hero_banner_url === img.url ? 'selected' : ''}`}
                          style={{ backgroundImage: `url(${img.url})` }}
                        >
                          <span className="banner-thumb-label">{img.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Propuestas de Valor / Trust Row */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="settings-label" style={{ marginBottom: '0.6rem' }}>
                      Beneficios de Confianza (Trust Row inferior de la portada)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#736B63' }}>Beneficio 1 (Envío)</span>
                        <input
                          type="text"
                          value={theme.trust1_title || 'Envío Gratis'}
                          onChange={(e) => handleInputChange('trust1_title', e.target.value)}
                          className="settings-input"
                          style={{ marginBottom: '4px' }}
                          placeholder="Envío Gratis"
                        />
                        <input
                          type="text"
                          value={theme.trust1_desc || 'En compras más de 350 Bs'}
                          onChange={(e) => handleInputChange('trust1_desc', e.target.value)}
                          className="settings-input"
                          style={{ fontSize: '0.8rem' }}
                          placeholder="En compras más de 350 Bs"
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#736B63' }}>Beneficio 2 (Devolución)</span>
                        <input
                          type="text"
                          value={theme.trust2_title || 'Devolución Fácil'}
                          onChange={(e) => handleInputChange('trust2_title', e.target.value)}
                          className="settings-input"
                          style={{ marginBottom: '4px' }}
                          placeholder="Devolución Fácil"
                        />
                        <input
                          type="text"
                          value={theme.trust2_desc || '30 días sin costo'}
                          onChange={(e) => handleInputChange('trust2_desc', e.target.value)}
                          className="settings-input"
                          style={{ fontSize: '0.8rem' }}
                          placeholder="30 días sin costo"
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#736B63' }}>Beneficio 3 (Pago Seguro)</span>
                        <input
                          type="text"
                          value={theme.trust3_title || 'Pago 100% Seguro'}
                          onChange={(e) => handleInputChange('trust3_title', e.target.value)}
                          className="settings-input"
                          style={{ marginBottom: '4px' }}
                          placeholder="Pago 100% Seguro"
                        />
                        <input
                          type="text"
                          value={theme.trust3_desc || 'QR, Tarjeta & Bancos'}
                          onChange={(e) => handleInputChange('trust3_desc', e.target.value)}
                          className="settings-input"
                          style={{ fontSize: '0.8rem' }}
                          placeholder="QR, Tarjeta & Bancos"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Guardar */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1.5rem' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
                  {saving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Guardando Cambios...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Guardar y Publicar Apariencia</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* COLUMNA DERECHA: PREVISUALIZACIÓN EN VIVO (STICKY) */}
            <div className="appearance-preview-sticky">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye size={18} color="#736B63" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1C1510' }}>
                    Previsualización en Vivo de la Portada
                  </span>
                </div>

                {/* Switcher Desktop / Móvil */}
                <div className="preview-device-switch">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                    title="Vista Escritorio"
                  >
                    <Monitor size={14} />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                    title="Vista Móvil"
                  >
                    <Smartphone size={14} />
                    <span>Móvil</span>
                  </button>
                </div>
              </div>

              {/* Marco de Pantalla Simulada */}
              <div className="viewport-frame">
                <div className={previewDevice === 'desktop' ? 'viewport-desktop' : 'viewport-mobile'}>
                  {/* Navbar Simulada */}
                  <div
                    style={{
                      padding: '0.6rem 0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #EFECE6',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <span
                        style={{
                          fontFamily: theme.font_family,
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          letterSpacing: '0.08em',
                          color: theme.primary_color,
                        }}
                      >
                        {tenantDisplayName.toUpperCase()}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '0.5rem',
                          letterSpacing: '0.15em',
                          color: theme.secondary_color,
                          fontWeight: 600,
                        }}
                      >
                        {theme.tagline}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Search size={14} color="#736B63" />
                      <ShoppingBag size={14} color={theme.primary_color} />
                    </div>
                  </div>

                  {/* HERO SECTION EXACTA DE LA FOTO 2 */}
                  <div
                    className="mock-landing-hero"
                    style={{ backgroundColor: theme.storefront_bg_color || '#F8F5F1' }}
                  >
                    <div className="mock-landing-grid">
                      {/* Contenido Izquierdo */}
                      <div className="mock-landing-content">
                        <span
                          className="mock-landing-badge"
                          style={{ color: theme.secondary_color }}
                        >
                          {theme.badge}
                        </span>

                        <h1
                          className="mock-landing-headline"
                          style={{
                            fontFamily: theme.font_family,
                            color: theme.primary_color,
                          }}
                        >
                          {theme.hero_headline} <br />
                          {theme.hero_subheadline}
                        </h1>

                        <p className="mock-landing-desc">{theme.hero_description}</p>

                        <div className="mock-landing-actions">
                          <button
                            type="button"
                            className="mock-landing-cta-primary"
                            style={{ backgroundColor: theme.primary_color }}
                          >
                            <span>{theme.cta_primary_text || 'Comprar Ahora'}</span>
                            <span style={{ fontSize: '0.75rem' }}>→</span>
                          </button>

                          <button type="button" className="mock-landing-cta-secondary">
                            <span>▶</span>
                            <span>{theme.cta_secondary_text || 'Ver Lookbook'}</span>
                          </button>
                        </div>

                        {/* Fila de Trust Badges */}
                        <div className="mock-trust-row">
                          <div className="mock-trust-col">
                            <span>🚚</span>
                            <div>
                              <strong>{theme.trust1_title || 'Envío Gratis'}</strong>
                              <p>{theme.trust1_desc || 'En compras más de 350 Bs'}</p>
                            </div>
                          </div>
                          <div className="mock-trust-col">
                            <span>🔄</span>
                            <div>
                              <strong>{theme.trust2_title || 'Devolución Fácil'}</strong>
                              <p>{theme.trust2_desc || '30 días sin costo'}</p>
                            </div>
                          </div>
                          <div className="mock-trust-col">
                            <span>🛡️</span>
                            <div>
                              <strong>{theme.trust3_title || 'Pago 100% Seguro'}</strong>
                              <p>{theme.trust3_desc || 'QR, Tarjeta & Bancos'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Imagen Editorial Derecha */}
                      <div
                        className="mock-hero-image-wrap"
                        style={{
                          backgroundImage: `url(${theme.hero_banner_url || OFFICIAL_HERO_IMAGES[0].url})`,
                        }}
                      >
                        <div className="mock-slide-dots">
                          <span className="mock-slide-dot active">01</span>
                          <span className="mock-slide-dot">02</span>
                          <span className="mock-slide-dot">03</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Previsualización del Panel Interno (Original Claro) */}
              <div className="mock-admin-container">
                <div className="mock-admin-header">
                  <span>Previsualización del Menú Interno</span>
                  <span style={{ color: '#736B63', fontSize: '0.65rem' }}>Panel de Administración</span>
                </div>
                <div className="mock-admin-body">
                  <div
                    className="mock-admin-sidebar"
                    style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #E5E0D8' }}
                  >
                    <div className="mock-admin-logo" style={{ fontFamily: theme.font_family, color: '#1A1A1A' }}>
                      Dressly<span style={{ color: theme.secondary_color }}>Admin</span>
                    </div>
                    <div
                      className="mock-admin-item active"
                      style={{
                        backgroundColor: theme.primary_color,
                        color: '#FFFFFF',
                      }}
                    >
                      <span>★</span>
                      <span>Personalizar Apariencia</span>
                    </div>
                    <div className="mock-admin-item" style={{ color: '#736B63' }}>
                      <span>⚙</span>
                      <span>Configuración</span>
                    </div>
                    <div className="mock-admin-item" style={{ color: '#736B63' }}>
                      <span>📦</span>
                      <span>Catálogo</span>
                    </div>
                  </div>
                  <div className="mock-admin-main">
                    <div style={{ height: '14px', width: '60%', backgroundColor: '#E5E0D8', borderRadius: '4px' }} />
                    <div style={{ height: '10px', width: '90%', backgroundColor: '#EFECE6', borderRadius: '4px' }} />
                    <div style={{ height: '35px', width: '100%', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E5E0D8' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AppearanceSettingsTab;
