import { describe, expect, it } from 'vitest';
import { customerLoginPath, isLoginRequest, loginDestination, resolveTenant } from '../../../../frontend/src/services/api/tenant';

describe('Acceso de clientes por tienda', () => {
  it('elige Dressly por defecto y prioriza la tienda indicada en URL', () => {
    expect(resolveTenant('/login')).toBe('dressly');
    expect(resolveTenant('/store/dressly/login', '', 'urbanly')).toBe('dressly');
    expect(resolveTenant('/login', '?tenant=aura', 'urbanly')).toBe('aura-sport');
    expect(resolveTenant('/urbanly/login', '', 'dressly')).toBe('urbanly');
  });
  it('conserva la tienda al exigir acceso', () => {
    expect(customerLoginPath('/store/urbanly/checkout', '', 'dressly')).toBe('/store/urbanly/login');
    expect(customerLoginPath('/mis-compras', '', 'aura-sport')).toBe('/store/aura-sport/login');
  });
  it('regresa al cliente a su tienda o a su compra', () => {
    expect(loginDestination('dressly', undefined, 'Cliente')).toBe('/store/dressly');
    expect(loginDestination('urbanly', '/cart?coupon=test', 'Cliente')).toBe('/store/urbanly/cart?coupon=test');
    expect(loginDestination('dressly', '/store/dressly/checkout', 'Cliente')).toBe('/store/dressly/checkout');
    expect(loginDestination('dressly', undefined, 'Administrador')).toBe('/admin');
  });
  it('rechaza destinos externos, de otra tienda o administrativos para clientes', () => {
    for (const destination of ['//example.com', 'https://example.com', '/store/urbanly/cart', '/admin', '/pos', '/saas/admin', '/store/dressly/login', '/']) {
      expect(loginDestination('dressly', destination, 'Cliente')).toBe('/store/dressly');
    }
  });
  it('distingue errores de credenciales de una sesión expirada', () => {
    expect(isLoginRequest('/auth/login')).toBe(true);
    expect(isLoginRequest('/saas/auth/login')).toBe(true);
    expect(isLoginRequest('/auth/profile')).toBe(false);
  });
});
