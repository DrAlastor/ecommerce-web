/**
 * @caso-de-uso CU12 — Obtener recomendaciones de prendas mediante IA
 * @subsistema Experiencia Inteligente
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Cliente -> asistente de recomendaciones -> controlador de IA -> servicio de recomendaciones -> Catálogo/Preferencias/Proveedor de IA.
 */
import api from '../../../../../services/api/api';
import type { RecommendationsResponse } from '../types/recommendations.types';

export const recommendationsService = {
  async getRecommendations(data?: { prompt?: string; limit?: number }): Promise<RecommendationsResponse> {
    const response = await api.post<RecommendationsResponse>('/catalog/recommendations', data || {});
    return response.data;
  },
};
