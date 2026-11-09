/**
 * @caso-de-uso CU11 — Gestionar proveedores
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> vista de proveedores -> controlador de proveedores -> servicio de proveedores -> Proveedor/ProveedorProducto/Producto.
 */
import React from 'react';
import { Pencil, Plus } from 'lucide-react';
import type { Supplier } from '../../types/suppliers.types';
import type { emptySupplierForm } from '../../hooks/useSuppliersAdmin';

type SupplierFormState = typeof emptySupplierForm;

interface SupplierFormProps {
  editingSupplier: Supplier | null;
  supplierForm: SupplierFormState;
  onFormChange: (form: SupplierFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancelEdit: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  editingSupplier,
  supplierForm,
  onFormChange,
  onSubmit,
  onCancelEdit,
}) => (
  <section className="supplier-card">
    <div className="section-title-row">
      <div>
        <h2>{editingSupplier ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
        <p>Datos comerciales basicos del proveedor externo.</p>
      </div>
      {editingSupplier && (
        <button type="button" className="admin-btn text" onClick={onCancelEdit}>
          Cancelar edicion
        </button>
      )}
    </div>

    <form className="admin-form" onSubmit={onSubmit}>
      <div className="form-row-2">
        <div className="form-group">
          <label>Razon social</label>
          <input
            className="admin-input"
            value={supplierForm.razon_social}
            onChange={(event) => onFormChange({ ...supplierForm, razon_social: event.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>NIT</label>
          <input
            className="admin-input"
            value={supplierForm.nit}
            onChange={(event) => onFormChange({ ...supplierForm, nit: event.target.value })}
            required
          />
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label>Contacto</label>
          <input
            className="admin-input"
            value={supplierForm.contacto_nombre}
            onChange={(event) => onFormChange({ ...supplierForm, contacto_nombre: event.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Telefono</label>
          <input
            className="admin-input"
            value={supplierForm.telefono}
            onChange={(event) => onFormChange({ ...supplierForm, telefono: event.target.value })}
          />
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label>Correo</label>
          <input
            className="admin-input"
            type="email"
            value={supplierForm.email}
            onChange={(event) => onFormChange({ ...supplierForm, email: event.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Direccion</label>
          <input
            className="admin-input"
            value={supplierForm.direccion}
            onChange={(event) => onFormChange({ ...supplierForm, direccion: event.target.value })}
          />
        </div>
      </div>

      <div className="supplier-form-actions">
        <button type="submit" className="admin-btn primary">
          {editingSupplier ? <Pencil size={16} /> : <Plus size={16} />}
          {editingSupplier ? 'Guardar cambios' : 'Crear proveedor'}
        </button>
      </div>
    </form>
  </section>
);
