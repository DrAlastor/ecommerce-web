/**
 * @caso-de-uso CU12 — Obtener recomendaciones de prendas mediante IA
 * @subsistema Experiencia Inteligente
 * @capa Entity/DTO — Frontend web
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Cliente -> asistente de recomendaciones -> controlador de IA -> servicio de recomendaciones -> Catálogo/Preferencias/Proveedor de IA.
 */
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
