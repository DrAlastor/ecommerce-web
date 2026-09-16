import type { CatalogProduct } from '../../../types/catalog.types';

export interface RecommendedProduct extends CatalogProduct {
  razon_recomendacion: string;
  stock_total?: number;
}

export interface RecommendationsResponse {
  data: RecommendedProduct[];
  meta: {
    total: number;
    personalized: boolean;
    source: 'ai' | 'local';
  };
}
