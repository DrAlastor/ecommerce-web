import React from 'react';
import { Search, RotateCcw, Building2, Tag, Palette } from 'lucide-react';
import type { InventoryMetadata } from '../types/inventory.types';

interface InventoryFiltersProps {
  metadata: InventoryMetadata | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedBranchId: number | null;
  onBranchChange: (id: number | null) => void;
  selectedSizeId: number | null;
  onSizeChange: (id: number | null) => void;
  selectedColorId: number | null;
  onColorChange: (id: number | null) => void;
  selectedStockStatus: 'todos' | 'disponible' | 'bajo' | 'agotado';
  onStockStatusChange: (status: 'todos' | 'disponible' | 'bajo' | 'agotado') => void;
  onResetFilters: () => void;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = React.memo(({
  metadata,
  searchQuery,
  onSearchChange,
  selectedBranchId,
  onBranchChange,
  selectedSizeId,
  onSizeChange,
  selectedColorId,
  onColorChange,
  selectedStockStatus,
  onStockStatusChange,
  onResetFilters,
}) => {
  const branches = metadata?.branches || [];
  const sizes = metadata?.sizes || [];
  const colors = metadata?.colors || [];

  return (
    <div className="inventory-filters-card">
      <div className="inv-filters-row">
        {/* Buscador */}
        <div className="inv-filter-group search-group">
          <label className="inv-filter-label">Buscar Prenda o SKU</label>
          <div className="inv-search-input-wrapper">
            <Search size={16} className="inv-search-icon" />
            <input
              type="text"
              placeholder="Ej. Vestido, Camiseta, PPU-M-BLA..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="inv-search-input"
            />
          </div>
        </div>

        {/* Filtro Sucursal (Autorizadas) */}
        <div className="inv-filter-group">
          <label className="inv-filter-label">
            <Building2 size={14} />
            <span>Sucursal</span>
          </label>
          <select
            value={selectedBranchId || ''}
            onChange={(e) => onBranchChange(e.target.value ? Number(e.target.value) : null)}
            className="inv-filter-select"
            disabled={branches.length === 1}
          >
            {branches.length > 1 && <option value="">Todas las autorizadas ({branches.length})</option>}
            {branches.map((b) => (
              <option key={b.id_sucursal} value={b.id_sucursal}>
                {b.nombre} ({b.ciudad})
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Talla */}
        <div className="inv-filter-group">
          <label className="inv-filter-label">
            <Tag size={14} />
            <span>Talla</span>
          </label>
          <select
            value={selectedSizeId || ''}
            onChange={(e) => onSizeChange(e.target.value ? Number(e.target.value) : null)}
            className="inv-filter-select"
          >
            <option value="">Todas las tallas</option>
            {sizes.map((s) => (
              <option key={s.id_talla} value={s.id_talla}>
                Talla {s.codigo}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Color */}
        <div className="inv-filter-group">
          <label className="inv-filter-label">
            <Palette size={14} />
            <span>Color</span>
          </label>
          <select
            value={selectedColorId || ''}
            onChange={(e) => onColorChange(e.target.value ? Number(e.target.value) : null)}
            className="inv-filter-select"
          >
            <option value="">Todos los colores</option>
            {colors.map((c) => (
              <option key={c.id_color} value={c.id_color}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Estado de Stock */}
        <div className="inv-filter-group">
          <label className="inv-filter-label">Nivel de Existencias</label>
          <select
            value={selectedStockStatus}
            onChange={(e) => onStockStatusChange(e.target.value as any)}
            className="inv-filter-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="disponible">🟢 Con Stock Disponible</option>
            <option value="bajo">🟡 Bajo Stock (Alerta)</option>
            <option value="agotado">🔴 Agotados (0 unidades)</option>
          </select>
        </div>

        {/* Botón de limpiar filtros */}
        <div className="inv-filter-group reset-group">
          <button
            type="button"
            className="inv-reset-btn"
            onClick={onResetFilters}
            title="Restablecer filtros"
          >
            <RotateCcw size={15} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>
    </div>
  );
});

InventoryFilters.displayName = 'InventoryFilters';
