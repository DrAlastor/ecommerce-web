import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../../frontend/src/services/api/api';

const values = new Map<string, string>();
const location = { pathname: '/store/dressly/login', search: '', href: '' };

beforeEach(() => {
  values.clear();
  location.href = '';
  vi.stubGlobal('window', { location });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

describe('Sesiones y peticiones de acceso', () => {
  it('respeta la tienda explícita y no adjunta una sesión vieja al login', async () => {
    values.set('tenantKey', 'urbanly');
    values.set('accessToken', 'old');
    await api.post('/auth/login', {}, { headers: { 'x-tenant-id': 'aura-sport' }, adapter: async config => {
      expect(config.headers['x-tenant-id']).toBe('aura-sport');
      expect(config.headers.Authorization).toBeUndefined();
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    } });
  });
  it('un login rechazado no borra otra sesión ni redirige', async () => {
    values.set('accessToken', 'existing');
    await expect(api.post('/auth/login', {}, { adapter: async config => {
      throw { config, response: { status: 401 } };
    } })).rejects.toBeDefined();
    expect(values.get('accessToken')).toBe('existing');
    expect(location.href).toBe('');
  });
  it('una respuesta antigua no elimina el token recién obtenido', async () => {
    values.set('accessToken', 'old');
    await expect(api.get('/auth/profile', { adapter: async config => {
      values.set('accessToken', 'fresh');
      throw { config, response: { status: 401 } };
    } })).rejects.toBeDefined();
    expect(values.get('accessToken')).toBe('fresh');
    expect(location.href).toBe('');
  });
  it('un error SaaS no elimina la sesión del cliente', async () => {
    values.set('accessToken', 'customer');
    await expect(api.get('/saas/auth/profile', { adapter: async config => {
      throw { config, response: { status: 401 } };
    } })).rejects.toBeDefined();
    expect(values.get('accessToken')).toBe('customer');
  });
});
