import api from '../../../../../services/api/api';

export interface AppearanceData {
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
  hero_banner_secondary_url?: string;
  promo1_tag?: string;
  promo1_title?: string;
  promo1_btn?: string;
  promo1_image_url?: string;
  promo2_tag?: string;
  promo2_title?: string;
  promo2_btn?: string;
  promo2_image_url?: string;
  newsletter_banner_url?: string;
  logo_url?: string;
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
  css_variables?: string;
  fecha_modificacion?: string;
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

export const appearanceService = {
  async getPublicAppearance(tenant: string): Promise<AppearanceData> {
    const res = await api.get<AppearanceData>(`/users-security/appearance/public/${tenant}`);
    return res.data;
  },

  async getAppearance(tenant?: string): Promise<AppearanceData> {
    const res = await api.get<AppearanceData>('/users-security/appearance', {
      params: tenant ? { tenant } : undefined,
    });
    return res.data;
  },

  async updateAppearance(
    data: Partial<AppearanceData>,
    tenant?: string,
  ): Promise<{ success: boolean; message: string; data: AppearanceData }> {
    const res = await api.put<{ success: boolean; message: string; data: AppearanceData }>(
      '/users-security/appearance',
      data,
      {
        params: tenant ? { tenant } : undefined,
      },
    );
    return res.data;
  },

  async getPresets(): Promise<ThemePreset[]> {
    const res = await api.get<ThemePreset[]>('/users-security/appearance/presets');
    return res.data;
  },
};
