/**
 * @caso-de-uso CU11 — Gestionar proveedores
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> vista de proveedores -> controlador de proveedores -> servicio de proveedores -> Proveedor/ProveedorProducto/Producto.
 */
import React from 'react';
import { PackagePlus, Pencil } from 'lucide-react';
import type { Supplier, SupplierProduct } from '../../types/suppliers.types';
import type { emptyProductForm } from '../../hooks/useSuppliersAdmin';

type ProductFormState = typeof emptyProductForm;

interface SupplierProductsProps {
  selectedSupplier: Supplier | null;
  supplierProducts: SupplierProduct[];
  productForm: ProductFormState;
  availableProducts: Array<{ id_producto: number; nombre: string }>;
  onFormChange: (form: ProductFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onToggleProductStatus: (product: SupplierProduct) => void;
}

export const SupplierProducts: React.FC<SupplierProductsProps> = ({
  selectedSupplier,
  supplierProducts,
  productForm,
  availableProducts,
  onFormChange,
  onSubmit,
  onEditSupplier,
  onToggleProductStatus,
}) => {
  if (!selectedSupplier) return null;

  return (
    <section className="supplier-card">
      <div className="section-title-row">
        <div>
          <h2>Productos suministrados</h2>
          <p>{selectedSupplier.razon_social}</p>
        </div>
        <button type="button" className="admin-btn secondary" onClick={() => onEditSupplier(selectedSupplier)}>
          <Pencil size={16} /> Editar proveedor
        </button>
      </div>

      <form className="supplier-inline-form" onSubmit={onSubmit}>
        <select
          className="admin-select"
          value={productForm.id_producto}
          onChange={(event) => onFormChange({ ...productForm, id_producto: event.target.value })}
          required
        >
          <option value="">Seleccionar producto</option>
          {availableProducts.map((product) => (
            <option key={product.id_producto} value={product.id_producto}>
              {product.nombre}
            </option>
          ))}
        </select>
        <input
          className="admin-input"
          type="number"
          step="0.01"
          min="0"
          placeholder="Costo referencia"
          value={productForm.costo_referencia}
          onChange={(event) => onFormChange({ ...productForm, costo_referencia: event.target.value })}
        />
        <select
          className="admin-select"
          value={productForm.estado}
          onChange={(event) => onFormChange({ ...productForm, estado: event.target.value })}
        >
          <option value="DISPONIBLE">Disponible</option>
          <option value="AGOTADO">Agotado</option>
        </select>
        <button type="submit" className="admin-btn primary">
          <PackagePlus size={16} /> Asociar
        </button>
      </form>

      <div className="supplier-products-grid">
        {supplierProducts.length === 0 ? (
          <div className="supplier-empty">Este proveedor aun no tiene productos asociados.</div>
        ) : (
          supplierProducts.map((item) => (
            <article key={item.id_producto} className="supplier-product-card">
              <div>
                <strong>{item.producto.nombre}</strong>
                <span>{item.producto.categoria?.nombre || 'Sin categoria'}</span>
              </div>
              <div className="supplier-product-meta">
                <span>Bs {item.costo_referencia?.toFixed(2) || '0.00'}</span>
                <button
                  type="button"
                  className={`supplier-status ${item.estado.toLowerCase()}`}
                  onClick={() => onToggleProductStatus(item)}
                >
                  {item.estado}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};
