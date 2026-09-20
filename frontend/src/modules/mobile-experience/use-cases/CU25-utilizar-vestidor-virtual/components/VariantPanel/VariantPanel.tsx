import React from 'react';
import type { ArVariant, ProductSummary } from '../../types/virtual-fitting.types';
import { Sparkles, Check, Package, Tag } from 'lucide-react';
import './VariantPanel.css';

interface VariantPanelProps {
  product: ProductSummary;
  selectedVariant: ArVariant | null;
  tallas: Array<{ id_talla: number; codigo: string }>;
  colores: Array<{ id_color: number; nombre: string; codigo_hex: string | null }>;
  selectedTallaId: number | null;
  selectedColorId: number | null;
  onSelectTalla: (idTalla: number) => void;
  onSelectColor: (idColor: number) => void;
}

/**
 * Panel lateral del vestidor que muestra los datos de la prenda,
 * selector de variantes activas compatibles con RA, y estado de stock.
 */
export const VariantPanel: React.FC<VariantPanelProps> = ({
  product,
  selectedVariant,
  tallas,
  colores,
  selectedTallaId,
  selectedColorId,
  onSelectTalla,
  onSelectColor,
}) => {
  const stock = selectedVariant?.total_stock ?? 0;
  const inStock = stock > 0;

  return (
    <div className="fitting-variant-panel">
      {/* Encabezado del producto */}
      <div className="panel-header">
        <span className="panel-category-tag">{product.categoria}</span>
        <h1 className="panel-title">{product.nombre}</h1>
        {selectedVariant && (
          <div className="panel-sku-code">
            <span>SKU: {selectedVariant.sku}</span>
          </div>
        )}
      </div>

      {/* Precio y promociones */}
      <div className="panel-price-section">
        {selectedVariant?.tiene_descuento ? (
          <div className="panel-price-row">
            <span className="panel-price-final">
              Bs. {selectedVariant.precio_final.toFixed(2)}
            </span>
            <span className="panel-price-original">
              Bs. {selectedVariant.precio_variante.toFixed(2)}
            </span>
            <span className="panel-discount-tag">
              <Tag size={12} />
              -{selectedVariant.descuento_porcentaje}%
            </span>
          </div>
        ) : (
          <div className="panel-price-row">
            <span className="panel-price-final">
              Bs. {(selectedVariant?.precio_final ?? product.precio_base).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="panel-divider" />

      {/* Selector de Tallas */}
      <div className="panel-selector-group">
        <div className="selector-label-row">
          <label className="selector-label">Talla</label>
          {selectedVariant && (
            <span className="selector-current-value">{selectedVariant.talla.codigo}</span>
          )}
        </div>
        <div className="talla-chips-grid">
          {tallas.map((t) => {
            const isSelected = t.id_talla === selectedTallaId;
            return (
              <button
                key={t.id_talla}
                type="button"
                className={`talla-chip ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectTalla(t.id_talla)}
              >
                {t.codigo}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Colores */}
      <div className="panel-selector-group">
        <div className="selector-label-row">
          <label className="selector-label">Color</label>
          {selectedVariant && (
            <span className="selector-current-value">{selectedVariant.color.nombre}</span>
          )}
        </div>
        <div className="color-swatches-row">
          {colores.map((c) => {
            const isSelected = c.id_color === selectedColorId;
            const bg = c.codigo_hex || '#4a5568';
            return (
              <button
                key={c.id_color}
                type="button"
                className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                style={{ backgroundColor: bg }}
                onClick={() => onSelectColor(c.id_color)}
                title={c.nombre}
              >
                {isSelected && <Check size={14} className="color-check-icon" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Indicador de compatibilidad RA y Stock */}
      <div className="panel-status-box">
        <div className="status-row-item">
          <Sparkles size={16} className="text-emerald-400" />
          <span>Modelo 3D y RA activados en esta variante</span>
        </div>
        <div className="status-row-item">
          <Package size={16} className={inStock ? 'text-blue-400' : 'text-amber-400'} />
          <span>
            {inStock ? `${stock} unidades disponibles` : 'Sin unidades para entrega inmediata'}
          </span>
        </div>
      </div>
    </div>
  );
};
