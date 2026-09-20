import api from '../../../../../services/api/api';
import type { ArVariantDetail, ArVariantsResponse } from '../types/virtual-fitting.types';

export const virtualFittingService = {
  /** Obtiene una variante específica con datos para el vestidor virtual */
  async getVariantForFitting(variantId: number): Promise<ArVariantDetail> {
    const response = await api.get<ArVariantDetail>(`/virtual-fitting/variant/${variantId}`);
    return response.data;
  },

  /** Obtiene todas las variantes compatibles con RA de un producto */
  async getArVariantsByProduct(productId: number): Promise<ArVariantsResponse> {
    const response = await api.get<ArVariantsResponse>(
      `/virtual-fitting/product/${productId}/ar-variants`,
    );
    return response.data;
  },

  /** Registra interacción de vestidor virtual (requiere auth) */
  async registerInteraction(productId: number): Promise<{ registered: boolean }> {
    const response = await api.post<{ registered: boolean }>('/virtual-fitting/interaction', {
      id_producto: productId,
    });
    return response.data;
  },
};
