import api from '../../../../services/api/api';
import type { LoginRequest, LoginResponse, ProfileResponse } from '../types/auth.types';
import { activeTenant, normalizeTenant } from '../../../../services/api/tenant';

export const authService = {
  /**
   * Autentica al usuario con email y contraseña.
   * Retorna token JWT + info segura.
   */
  async login(credentials: LoginRequest, tenant = activeTenant()): Promise<LoginResponse> {
    const selected = normalizeTenant(tenant) || 'dressly';
    const response = await api.post<LoginResponse>('/auth/login', credentials, { headers: { 'x-tenant-id': selected } });
    return { ...response.data, tenant: selected };
  },

  /**
   * Obtiene el perfil del usuario autenticado.
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>('/auth/profile');
    return response.data;
  },

  /**
   * Cierra sesión notificando al backend y limpiando el almacenamiento local.
   */
  async logout(): Promise<void> {
    try {
      if (this.hasToken()) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Error durante el cierre de sesión en el servidor:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
    }
  },

  /**
   * Guarda los datos de autenticación en localStorage.
   */
  saveAuth(data: LoginResponse): void {
    if (data.tenant) localStorage.setItem('tenantKey', data.tenant);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('authUser', JSON.stringify({
      tenant: data.tenant || activeTenant(),
      user: data.user,
      rol: data.rol,
      funciones: data.funciones,
    }));
  },

  /**
   * Recupera los datos de autenticación almacenados.
   */
  getStoredAuth(): { tenant?: string; user: LoginResponse['user']; rol: LoginResponse['rol']; funciones: LoginResponse['funciones'] } | null {
    const stored = localStorage.getItem('authUser');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  /**
   * Verifica si hay un token almacenado.
   */
  hasToken(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};
