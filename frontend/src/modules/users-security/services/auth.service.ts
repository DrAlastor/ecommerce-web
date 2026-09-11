import api from '../../../services/api/api';
import type { LoginRequest, LoginResponse, ProfileResponse } from '../types/auth.types';

export const authService = {
  /**
   * Autentica al usuario con email y contraseña.
   * Retorna token JWT + info segura.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Obtiene el perfil del usuario autenticado.
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>('/auth/profile');
    return response.data;
  },

  /**
   * Cierra sesión limpiando el almacenamiento local.
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
  },

  /**
   * Guarda los datos de autenticación en localStorage.
   */
  saveAuth(data: LoginResponse): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('authUser', JSON.stringify({
      user: data.user,
      rol: data.rol,
      funciones: data.funciones,
    }));
  },

  /**
   * Recupera los datos de autenticación almacenados.
   */
  getStoredAuth(): { user: LoginResponse['user']; rol: LoginResponse['rol']; funciones: LoginResponse['funciones'] } | null {
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
