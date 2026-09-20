import React from 'react';
import type { ProductVariant } from '../../types/product-detail.types';
import { Ruler, Check } from 'lucide-react';

interface VariantSelectorProps {
  colores: Array<{ id_color: number; nombre: string; codigo_hex: string | null }>;
  tallas: Array<{ id_talla: number; codigo: string }>;
  variantes: ProductVariant[];
  selectedColorId: number | null;
  selectedTallaId: number | null;
  hasSizeGuide: boolean;
  onSelectColor: (id_color: number) => void;
  onSelectTalla: (id_talla: number) => void;
  onOpenSizeGuide: () => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  colores,
  tallas,
  variantes,
  selectedColorId,
  selectedTallaId,
  hasSizeGuide,
  onSelectColor,
  onSelectTalla,
  onOpenSizeGuide,
}) => {
  // Obtener nombre del color seleccionado
  const activeColor = colores.find((c) => c.id_color === selectedColorId);

  // Helper para saber si una talla tiene stock en el color actualmente seleccionado
  const isSizeInStockForSelectedColor = (id_talla: number) => {
    if (!selectedColorId) return true;
    const v = variantes.find(
      (item) => item.color.id_color === selectedColorId && item.talla.id_talla === id_talla,
    );
    return v ? v.total_stock > 0 : false;
  };

  // Helper para saber si la combinación exacta existe
  const doesCombinationExist = (id_talla: number) => {
    if (!selectedColorId) return true;
    return variantes.some(
      (item) => item.color.id_color === selectedColorId && item.talla.id_talla === id_talla,
    );
  };

  if (colores.length === 0 && tallas.length === 0) {
    return (
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          color: '#6B7280',
          fontSize: '0.88rem',
          margin: '1rem 0',
        }}
      >
        ℹ️ Este producto no cuenta con variantes activas de color o talla en inventario.
      </div>
    );
  }

  return (
    <div className="variant-selector-wrapper">
      {/* Selector de Color */}
      <div className="variant-picker-block">
        <div className="variant-header-row">
          <span className="variant-label">
            Color: <strong>{activeColor?.nombre || 'Seleccionar'}</strong>
          </span>
        </div>
        <div className="color-options-row">
          {colores.map((color) => {
            const isSelected = color.id_color === selectedColorId;
            const variantWithImg = variantes.find(
              (v) => v.color.id_color === color.id_color && v.imagen_url,
            );

            if (variantWithImg?.imagen_url) {
              return (
                <button
                  key={color.id_color}
                  type="button"
                  className={`color-thumbnail-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectColor(color.id_color)}
                  title={color.nombre}
                >
                  <img
                    src={variantWithImg.imagen_url}
                    alt={color.nombre}
                    className="color-thumbnail-img"
                  />
                  <span
                    className="color-mini-dot"
                    style={{ backgroundColor: color.codigo_hex || '#1A1A1A' }}
                  />
                </button>
              );
            }

            return (
              <button
                key={color.id_color}
                type="button"
                className={`color-bubble-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectColor(color.id_color)}
                title={color.nombre}
                style={{ backgroundColor: color.codigo_hex || '#1A1A1A' }}
              >
                {isSelected && (
                  <Check
                    size={14}
                    color={
                      color.codigo_hex && color.codigo_hex.toLowerCase() === '#ffffff'
                        ? '#000000'
                        : '#FFFFFF'
                    }
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Talla */}
      <div className="variant-picker-block">
        <div className="variant-header-row">
          <span className="variant-label">Talla:</span>
          {hasSizeGuide && (
            <button
              type="button"
              className="btn-size-guide-trigger"
              onClick={onOpenSizeGuide}
            >
              <Ruler size={14} />
              <span>Guía de tallas</span>
            </button>
          )}
        </div>

        <div className="size-options-row">
          {tallas.map((talla) => {
            const isSelected = talla.id_talla === selectedTallaId;
            const inStock = isSizeInStockForSelectedColor(talla.id_talla);
            const exists = doesCombinationExist(talla.id_talla);

            return (
              <button
                key={talla.id_talla}
                type="button"
                className={`size-chip-btn ${isSelected ? 'selected' : ''} ${
                  !inStock || !exists ? 'out-of-stock' : ''
                }`}
                onClick={() => onSelectTalla(talla.id_talla)}
                title={!exists ? 'No disponible en este color' : !inStock ? 'Sin existencias' : 'Disponible'}
              >
                <span className="size-text">{talla.codigo}</span>
                {!inStock && <span className="no-stock-slash" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
