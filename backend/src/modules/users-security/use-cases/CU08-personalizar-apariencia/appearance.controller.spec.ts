import { describe, expect, it, vi } from 'vitest';
import { AppearanceController } from './appearance.controller.js';

describe('apariencia pública de la tienda', () => {
  it('combina nombre y logo de la misma empresa', async () => {
    const theme = { codigo_empresa: 'tienda', logo_url: '' };
    const appearance = { getAppearance: vi.fn().mockResolvedValue(theme) };
    const company = { getCompanyInfo: vi.fn().mockResolvedValue({ codigo_empresa: 'tienda', nombre_comercial: 'Mi Tienda', logo_url: 'https://example.com/logo.png' }) };
    const result = await new AppearanceController(appearance as any, company as any).getPublicAppearance('tienda');
    expect(result).toMatchObject({ site_title: 'Mi Tienda', logo_url: 'https://example.com/logo.png' });
  });

  it('no utiliza el nombre ni logo de una empresa distinta', async () => {
    const theme = { codigo_empresa: 'tienda', logo_url: '' };
    const appearance = { getAppearance: vi.fn().mockResolvedValue(theme) };
    const company = { getCompanyInfo: vi.fn().mockResolvedValue({ codigo_empresa: 'dressly', nombre_comercial: 'Dressly', logo_url: 'https://example.com/logo.png' }) };
    const result = await new AppearanceController(appearance as any, company as any).getPublicAppearance('tienda');
    expect(result).toEqual(theme);
  });
});
