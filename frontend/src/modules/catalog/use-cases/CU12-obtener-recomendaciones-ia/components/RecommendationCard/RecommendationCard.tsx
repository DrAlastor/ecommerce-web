/**
 * @caso-de-uso CU12 — Obtener recomendaciones de prendas mediante IA
 * @subsistema Experiencia Inteligente
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> asistente de recomendaciones -> controlador de IA -> servicio de recomendaciones -> Catálogo/Preferencias/Proveedor de IA.
 */
import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { RecommendedProduct } from '../../types/recommendations.types';

interface RecommendationCardProps {
  product: RecommendedProduct;
  onOpenProduct: (productId: number) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ product, onOpenProduct }) => (
  <article className="recommendation-card" onClick={() => onOpenProduct(product.id_producto)}>
    <div className="recommendation-media">
      <img
        src={product.imagen_principal || 'https://fashionstorestorage.blob.core.windows.net/productos/chaleco_sastre.png'}
        alt={product.nombre}
      />
      {product.tiene_descuento && (
        <span className="recommendation-discount">-{product.descuento_porcentaje}%</span>
      )}
    </div>
    <div className="recommendation-body">
      <span className="recommendation-category">{product.categoria?.nombre || 'Moda'}</span>
      <h3>{product.nombre}</h3>
      <div className="recommendation-price">
        <strong>Bs {product.precio_final.toFixed(2)}</strong>
        {product.tiene_descuento && <span>Bs {product.precio_base.toFixed(2)}</span>}
      </div>
      <p><Sparkles size={14} /> {product.razon_recomendacion}</p>
      <button type="button">
        Ver detalle <ArrowRight size={16} />
      </button>
    </div>
  </article>
);
