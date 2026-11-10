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

// Interceptor de response: maneja 401 (token expirado/inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');

      // Redirigir a login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
