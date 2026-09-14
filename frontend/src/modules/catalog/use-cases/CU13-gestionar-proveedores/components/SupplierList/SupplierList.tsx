import React from 'react';
import { Search } from 'lucide-react';
import type { Supplier } from '../../types/suppliers.types';

interface SupplierListProps {
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  search: string;
  loading: boolean;
  onSearchChange: (search: string) => void;
  onSelectSupplier: (supplier: Supplier) => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({
  suppliers,
  selectedSupplier,
  search,
  loading,
  onSearchChange,
  onSelectSupplier,
}) => (
  <aside className="supplier-panel">
    <div className="supplier-panel-header">
      <div>
        <h2>Proveedores</h2>
        <span>{suppliers.length} registrados</span>
      </div>
    </div>

    <div className="search-input-wrap supplier-search">
      <Search size={16} className="search-icon-lucide" />
      <input
        className="admin-input search-box"
        value={search}
        placeholder="Buscar razon social, NIT o contacto..."
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>

    <div className="supplier-list">
      {loading ? (
        <div className="supplier-empty">Cargando proveedores...</div>
      ) : suppliers.length === 0 ? (
        <div className="supplier-empty">No hay proveedores para mostrar.</div>
      ) : (
        suppliers.map((supplier) => (
          <button
            key={supplier.id_proveedor}
            type="button"
            className={`supplier-list-item ${selectedSupplier?.id_proveedor === supplier.id_proveedor ? 'active' : ''}`}
            onClick={() => onSelectSupplier(supplier)}
          >
            <strong>{supplier.razon_social}</strong>
            <span>NIT {supplier.nit}</span>
            <small>
              {supplier.total_productos || 0} productos · {supplier.total_ordenes || 0} ordenes
            </small>
          </button>
        ))
      )}
    </div>
  </aside>
);
