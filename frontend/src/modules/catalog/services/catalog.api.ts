import api from '../../../services/api/api';
import type {
  CatalogQueryParams,
  CatalogResponse,
  CatalogFilterMetadata,
} from '../types/catalog.types';

export const CatalogApi = {
  /**
   * CU10 — Consultar catálogo de productos con filtros y paginación
   */
  async getProducts(params?: CatalogQueryParams): Promise<CatalogResponse> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          cleanParams[key] = value;
        }
      });
    }

    const response = await api.get<CatalogResponse>('/catalog/products', {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Obtiene metadatos para poblar filtros dinámicamente
   */
  async getFilterMetadata(): Promise<CatalogFilterMetadata> {
    const response = await api.get<CatalogFilterMetadata>('/catalog/filters');
    return response.data;
  },
};
