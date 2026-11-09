import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { UpdateAppearanceDto } from './dto/appearance.dto.js';
import * as fs from 'fs';
import * as path from 'path';

export interface AppearanceRecord {
  codigo_empresa: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  tagline: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_description: string;
  hero_banner_url: string;
  badge: string;
  cta_primary_text?: string;
  cta_secondary_text?: string;
  trust1_title?: string;
  trust1_desc?: string;
  trust2_title?: string;
  trust2_desc?: string;
  trust3_title?: string;
  trust3_desc?: string;
  admin_sidebar_color?: string;
  admin_accent_color?: string;
  storefront_bg_color?: string;
  css_variables: string;
  fecha_modificacion: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  category: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  tagline: string;
}

@Injectable()
export class AppearanceService {
  private readonly logger = new Logger(AppearanceService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly dataFile = path.resolve(this.dataDir, 'tenants_appearance.json');

  private defaultThemes: Record<string, AppearanceRecord> = {
    dressly: {
      codigo_empresa: 'dressly',
      primary_color: '#1a1a1a',
      secondary_color: '#d4af37',
      accent_color: '#c5a059',
      font_family: 'Playfair Display, serif',
      tagline: 'FASHION STORE',
      hero_headline: 'Eleva Tu',
      hero_subheadline: 'Estilo Cotidiano',
      hero_description: 'Descubre prendas atemporales diseñadas para el máximo confort y la más pura elegancia. Confeccionadas pensando en ti.',
      hero_banner_url: 'https://fashionstorestorages.blob.core.windows.net/productos/hero-model.jpg',
      badge: 'NUEVA COLECCIÓN 2026',
      cta_primary_text: 'Comprar Ahora',
      cta_secondary_text: 'Ver Lookbook',
      trust1_title: 'Envío Gratis',
      trust1_desc: 'En compras más de 350 Bs',
      trust2_title: 'Devolución Fácil',
      trust2_desc: '30 días sin costo',
      trust3_title: 'Pago 100% Seguro',
      trust3_desc: 'QR, Tarjeta & Bancos',
      admin_sidebar_color: '#1A1918',
      admin_accent_color: '#C4956A',
      storefront_bg_color: '#FBF9F5',
      css_variables: '--color-primary: #1a1a1a; --color-secondary: #d4af37; --color-accent: #c5a059; --admin-sidebar-bg: #1A1918; --admin-accent: #C4956A; --font-display: "Playfair Display", serif;',
      fecha_modificacion: new Date().toISOString(),
    },
    'aura-sport': {
      codigo_empresa: 'aura-sport',
      primary_color: '#0D0D0D',
      secondary_color: '#CCFF00',
      accent_color: '#00F0FF',
      font_family: 'Oswald, sans-serif',
      tagline: 'PERFORMANCE & SPORTSWEAR',
      hero_headline: 'PERFORMANCE',
      hero_subheadline: 'MEETS STYLE.',
      hero_description: 'Ropa técnica de alto impacto diseñada para maximizar tu rendimiento físico y estilo diario.',
      hero_banner_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1600&auto=format&fit=crop',
      badge: 'PRO SERIES 2026',
      cta_primary_text: 'Comprar Colección',
      cta_secondary_text: 'Ver Lookbook Activo',
      trust1_title: 'Envío Atleta Express',
      trust1_desc: 'Despacho rápido a todo el país',
      trust2_title: 'Tecnología Dry-Fit Pro',
      trust2_desc: 'Tejidos anti-humedad y compresión',
      trust3_title: 'Pago Garantizado',
      trust3_desc: '100% seguro con QR y tarjeta',
      admin_sidebar_color: '#0D0D0D',
      admin_accent_color: '#CCFF00',
      storefront_bg_color: '#121212',
      css_variables: '--color-primary: #0D0D0D; --color-secondary: #CCFF00; --color-accent: #00F0FF; --admin-sidebar-bg: #0D0D0D; --admin-accent: #CCFF00; --font-display: "Oswald", sans-serif;',
      fecha_modificacion: new Date().toISOString(),
    },
    urbanly: {
      codigo_empresa: 'urbanly',
      primary_color: '#1A1918',
      secondary_color: '#8C7E72',
      accent_color: '#4D5645',
      font_family: 'Inter, sans-serif',
      tagline: 'STREETWEAR & OVERSIZE',
      hero_headline: 'AESTHETIC T-SHIRTS &',
      hero_subheadline: 'OVERSIZED ESSENTIALS',
      hero_description: 'Siluetas holgadas, tonos tierra neutros y algodón pesado 300 GSM diseñados para el movimiento de la ciudad.',
      hero_banner_url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1600&auto=format&fit=crop',
      badge: 'NEUTRAL TONES DROP',
      cta_primary_text: 'Explorar Drop',
      cta_secondary_text: 'Ver Lookbook Urbano',
      trust1_title: 'Heavyweight 300 GSM',
      trust1_desc: 'Algodón prémium peinado',
      trust2_title: 'Corte Boxy Oversize',
      trust2_desc: 'Calce perfecto unisex',
      trust3_title: 'Pago Rápido & Seguro',
      trust3_desc: 'Pasarelas nacionales e internacionales',
      admin_sidebar_color: '#21201E',
      admin_accent_color: '#8C7E72',
      storefront_bg_color: '#EDE8E3',
      css_variables: '--color-primary: #1A1918; --color-secondary: #8C7E72; --color-accent: #4D5645; --admin-sidebar-bg: #21201E; --admin-accent: #8C7E72; --font-display: "Inter", sans-serif;',
      fecha_modificacion: new Date().toISOString(),
    },
  };

  private curatedPresets: ThemePreset[] = [
    {
      id: 'luxury-gold',
      name: 'Dressly Luxury Gold',
      category: 'Haute Couture',
      primary_color: '#1a1a1a',
      secondary_color: '#d4af37',
      accent_color: '#c5a059',
      font_family: 'Playfair Display, serif',
      tagline: 'FASHION STORE',
    },
    {
      id: 'active-neon',
      name: 'Aura Neon Active',
      category: 'Sport & Athletics',
      primary_color: '#0D0D0D',
      secondary_color: '#CCFF00',
      accent_color: '#00F0FF',
      font_family: 'Oswald, sans-serif',
      tagline: 'ATHLETICS & ACTIVEWEAR',
    },
    {
      id: 'washed-neutral',
      name: 'Urbanly Neutral Earth',
      category: 'Streetwear & Oversize',
      primary_color: '#1A1918',
      secondary_color: '#8C7E72',
      accent_color: '#4D5645',
      font_family: 'Inter, sans-serif',
      tagline: 'STREETWEAR & OVERSIZE',
    },
    {
      id: 'nordic-minimal',
      name: 'Nordic Clean Minimal',
      category: 'Minimalist',
      primary_color: '#111827',
      secondary_color: '#3B82F6',
      accent_color: '#60A5FA',
      font_family: 'Plus Jakarta Sans, sans-serif',
      tagline: 'ESSENTIAL APPAREL',
    },
    {
      id: 'midnight-rose',
      name: 'Midnight Rose Editorial',
      category: 'Boutique Exclusive',
      primary_color: '#0F172A',
      secondary_color: '#F43F5E',
      accent_color: '#FB7185',
      font_family: 'Montserrat, sans-serif',
      tagline: 'EXCLUSIVE ATELIER',
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacoraService: BitacoraService,
  ) {
    this.ensureStorage();
  }

  private ensureStorage() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!fs.existsSync(this.dataFile)) {
        fs.writeFileSync(this.dataFile, JSON.stringify(this.defaultThemes, null, 2), 'utf8');
      }
    } catch (e) {
      this.logger.error('Error inicializando almacenamiento de apariencias:', e);
    }
  }

  private loadAll(): Record<string, AppearanceRecord> {
    try {
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      this.logger.warn('Error leyendo archivo de apariencias, usando defaults:', e);
    }
    return { ...this.defaultThemes };
  }

  private saveAll(data: Record<string, AppearanceRecord>) {
    try {
      this.ensureStorage();
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      this.logger.error('Error guardando archivo de apariencias:', e);
    }
  }

  private generateCss(
    primary: string,
    secondary: string,
    accent: string,
    fontFamily?: string
  ): string {
    return `:root { --color-primary: ${primary}; --color-secondary: ${secondary}; --color-accent: ${accent}; --font-display: ${fontFamily || "'Playfair Display', serif"}; }`;
  }

  async getAppearance(tenantKey?: string, userId: number = 1, ip?: string): Promise<AppearanceRecord> {
    const key = (tenantKey || 'dressly').toLowerCase().trim();
    const all = this.loadAll();
    const theme = all[key] || all['dressly'] || this.defaultThemes['dressly'];

    if (ip && userId) {
      await this.bitacoraService.logAction(
        'Consulta de Tema Visual',
        `Apariencia: ${key}`,
        userId,
        ip,
      );
    }

    return theme;
  }

  async getPresets(): Promise<ThemePreset[]> {
    return this.curatedPresets;
  }

  async updateAppearance(
    dto: UpdateAppearanceDto,
    tenantKey?: string,
    userId: number = 1,
    ip?: string,
  ): Promise<{ success: boolean; message: string; data: AppearanceRecord }> {
    const key = (dto.codigo_empresa || tenantKey || 'dressly').toLowerCase().trim();
    const all = this.loadAll();
    const existing = all[key] || this.defaultThemes[key] || this.defaultThemes['dressly'];

    const primary = dto.primary_color || existing.primary_color;
    const secondary = dto.secondary_color || existing.secondary_color;
    const accent = dto.accent_color || existing.accent_color;
    const adminSidebar = dto.admin_sidebar_color || existing.admin_sidebar_color || '#1A1918';
    const adminAccent = dto.admin_accent_color || existing.admin_accent_color || secondary;
    const font = dto.font_family || existing.font_family;

    const updated: AppearanceRecord = {
      ...existing,
      ...dto,
      codigo_empresa: key,
      primary_color: primary,
      secondary_color: secondary,
      accent_color: accent,
      admin_sidebar_color: adminSidebar,
      admin_accent_color: adminAccent,
      font_family: font,
      css_variables: this.generateCss(primary, secondary, accent, font),
      fecha_modificacion: new Date().toISOString(),
    };

    all[key] = updated;
    this.saveAll(all);

    this.logger.log(`Apariencia visual de [${key}] actualizada por usuario ${userId}`);

    if (ip && userId) {
      await this.bitacoraService.logAction(
        'Actualización de Tema Visual',
        `Apariencia: ${key} (${primary}, ${secondary})`,
        userId,
        ip,
      );
    }

    return {
      success: true,
      message: 'Tema visual de la vitrina digital actualizado y publicado exitosamente.',
      data: updated,
    };
  }
}
