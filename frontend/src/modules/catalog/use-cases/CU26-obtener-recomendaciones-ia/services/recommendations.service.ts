import api from '../../../../../services/api/api';
import type { RecommendationsResponse } from '../types/recommendations.types';

export const recommendationsService = {
  async getRecommendations(data?: { prompt?: string; limit?: number }): Promise<RecommendationsResponse> {
    const response = await api.post<RecommendationsResponse>('/catalog/recommendations', data || {});
    return response.data;
  },
};
