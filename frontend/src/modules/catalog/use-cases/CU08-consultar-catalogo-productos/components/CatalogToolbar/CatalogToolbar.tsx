/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CatalogToolbarProps {
  sortBy: string;
  onSortChange: (newSort: string) => void;
  totalProducts?: number;
}

export const CatalogToolbar: React.FC<CatalogToolbarProps> = ({
  sortBy,
  onSortChange,
}) => {
  return (
    <div
      className="catalog-toolbar"
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
        margin: '0 0 1.25rem 0',
        padding: 0,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }}
    >
      <div
        className="sort-by"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          margin: 0,
        }}
      >
        <span
          className="sort-label"
          style={{
            fontSize: '0.86rem',
            fontWeight: 600,
            color: '#4B433B',
            whiteSpace: 'nowrap',
          }}
        >
          Ordenar por
        </span>

        <div
          className="sort-select-wrapper"
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="sort-select"
            aria-label="Ordenar prendas"
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              border: '1px solid #C4956A',
              borderRadius: '8px',
              padding: '0 2.2rem 0 0.85rem',
              fontSize: '0.86rem',
              fontWeight: 500,
              color: '#1C1510',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              outline: 'none',
              height: '36px',
              minHeight: '36px',
              lineHeight: 'normal',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <option value="recientes">Novedades / Recientes</option>
            <option value="precio_asc">Precio: Menor a Mayor</option>
            <option value="precio_desc">Precio: Mayor a Menor</option>
            <option value="nombre_asc">Nombre: A - Z</option>
            <option value="nombre_desc">Nombre: Z - A</option>
          </select>
          <ChevronDown
            size={15}
            className="sort-chevron-icon"
            style={{
              position: 'absolute',
              right: '0.65rem',
              pointerEvents: 'none',
              color: '#8C5E35',
            }}
          />
        </div>
      </div>
    </div>
  );
};
