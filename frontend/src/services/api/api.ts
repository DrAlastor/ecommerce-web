import axios from 'axios';

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
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Resolver el tenant activo para garantizar aislamiento en cada petición HTTP
    let tenantKey = localStorage.getItem('tenantKey') || 'dressly';
    const path = window.location.pathname.toLowerCase();
    const match = path.match(/\/(?:store|tenant)\/([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      tenantKey = match[1];
    } else if (path.includes('urbanly') || path.includes('subversive')) {
      tenantKey = 'urbanly';
    } else if (path.includes('aura')) {
      tenantKey = 'aura-sport';
    } else if (path.includes('dressly')) {
      tenantKey = 'dressly';
    }

    // Normalizar slug
    tenantKey = tenantKey.toLowerCase().trim();
    if (tenantKey === 'subversive-urban' || tenantKey === 'subversive') {
      tenantKey = 'urbanly';
    } else if (tenantKey === 'aura') {
      tenantKey = 'aura-sport';
    } else if (tenantKey === 'fashionstore') {
      tenantKey = 'dressly';
    }

    config.headers['x-tenant-id'] = tenantKey;
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

    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');

      // Redirigir a login de tienda si no estamos en portal saas ni ya en /login
      if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/saas')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
