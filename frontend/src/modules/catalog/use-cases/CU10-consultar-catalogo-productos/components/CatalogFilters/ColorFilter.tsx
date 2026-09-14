import React from 'react';
import type { CatalogColor } from '../../../../types/catalog.types';

interface ColorFilterProps {
  colors: CatalogColor[];
  selectedColors: string[];
  onToggleColor: (colorName: string) => void;
}

export const ColorFilter: React.FC<ColorFilterProps> = ({
  colors,
  selectedColors,
  onToggleColor,
}) => {
  if (colors.length === 0) return null;

  return (
    <div className="filter-group">
      <h4 className="filter-title">Color</h4>
      <div className="color-grid">
        {colors.map((col) => {
          const isSelected = selectedColors.includes(col.nombre);
          return (
            <button
              key={col.id_color}
              type="button"
              className={`color-bubble ${isSelected ? 'selected' : ''}`}
              style={{ backgroundColor: col.codigo_hex || '#CCC' }}
              title={col.nombre}
              onClick={() => onToggleColor(col.nombre)}
            >
              {isSelected && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={col.nombre.toLowerCase() === 'blanco' ? '#000' : '#FFF'}
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
