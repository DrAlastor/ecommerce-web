import axios from 'axios';
import { activeTenant, customerLoginPath, isLoginRequest, normalizeTenant } from './tenant';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor de request: inyecta token JWT y contexto de aislamiento Multi-Tenant (x-tenant-id)
api.interceptors.request.use(
  (config) => {
    const isSaasEndpoint = Boolean(config.url && (config.url.startsWith('/saas') || config.url.includes('/saas/')));
    const saasToken = localStorage.getItem('saas_token');
    const tenantToken = localStorage.getItem('accessToken');

    if (isSaasEndpoint && saasToken && !isLoginRequest(config.url)) {
      config.headers.Authorization = `Bearer ${saasToken}`;
    } else if (!isSaasEndpoint && tenantToken && !isLoginRequest(config.url) && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${tenantToken}`;
    }

    // Resolver el tenant activo para garantizar aislamiento en cada petición HTTP
    config.headers['x-tenant-id'] = normalizeTenant(String(config.headers['x-tenant-id'] || '')) || activeTenant();
    return config;
  },
  (error) => Promise.reject(error),
);

const REMOTE_API_FALLBACK = 'https://dressly-api-gjajasdeb8b0ethf.chilecentral-01.azurewebsites.net';

// Interceptor de response: maneja 401 y fallback de red
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Resiliencia: Si el backend local no está levantado (Network Error / net::ERR_CONNECTION_REFUSED),
    // reintentar automáticamente contra el despliegue oficial de Azure.
    if (
      (!error.response || error.message === 'Network Error' || error.code === 'ERR_NETWORK') &&
      config &&
      !config._retryRemote &&
      typeof config.baseURL === 'string' &&
      (config.baseURL.includes('localhost') || config.baseURL.startsWith('/'))
    ) {
      config._retryRemote = true;
      config.baseURL = REMOTE_API_FALLBACK;
      return axios(config);
    }

    if (error.response?.status === 401 && !isLoginRequest(config?.url) && !config?.url?.includes('/saas')) {
      const currentToken = localStorage.getItem('accessToken');
      // Una respuesta antigua no debe cerrar una sesión recién iniciada.
      if (!currentToken || config?.headers?.Authorization !== `Bearer ${currentToken}`) {
        return Promise.reject(error);
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');

      // Redirigir a login de tienda si no estamos en portal saas ni ya en /login
      const path = window.location.pathname;
      if (!/\/login\/?$/.test(path) && !path.startsWith('/saas')) {
        const login = customerLoginPath(path, window.location.search, localStorage.getItem('tenantKey'));
        window.location.href = `${login}?redirect=${encodeURIComponent(path + window.location.search)}`;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
