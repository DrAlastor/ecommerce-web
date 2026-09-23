/**
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> catálogo y filtros -> controlador de catálogo -> servicio de catálogo -> Producto/Categoría/Colección/Promoción.
 */
import React from 'react';

interface SaleFilterProps {
  onlySale: boolean;
  onToggleSale: (sale: boolean) => void;
}

export const SaleFilter: React.FC<SaleFilterProps> = ({
  onlySale,
  onToggleSale,
}) => {
  return (
    <div className="filter-group">
      <h4 className="filter-title">Promociones</h4>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={onlySale}
          onChange={(e) => onToggleSale(e.target.checked)}
        />
        <span className="checkbox-text" style={{ fontWeight: 600, color: '#DC2626' }}>
          🏷️ Solo en oferta
        </span>
      </label>
    </div>
  );
};
