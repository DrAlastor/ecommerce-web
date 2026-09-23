/**
 * @caso-de-uso CU11 — Gestionar proveedores
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Administrador -> vista de proveedores -> controlador de proveedores -> servicio de proveedores -> Proveedor/ProveedorProducto/Producto.
 */
import React from 'react';
import { CheckCircle2, ClipboardList, RefreshCw } from 'lucide-react';
import { PurchaseOrders } from '../components/PurchaseOrders/PurchaseOrders';
import { SupplierForm } from '../components/SupplierForm/SupplierForm';
import { SupplierList } from '../components/SupplierList/SupplierList';
import { SupplierProducts } from '../components/SupplierProducts/SupplierProducts';
import { useSuppliersAdmin } from '../hooks/useSuppliersAdmin';
import './ManageSuppliersPage.css';

export const ManageSuppliersPage: React.FC = () => {
  const suppliersAdmin = useSuppliersAdmin();

  return (
    <div className="manage-suppliers-page">
      <div className="admin-page-header suppliers-header">
        <div>
          <h1 className="admin-page-title">Gestion de Proveedores</h1>
          <p className="admin-page-subtitle">
            Administra origen comercial, productos suministrados y ordenes de compra proximas a ingresar.
          </p>
        </div>
        <button type="button" className="admin-btn secondary" onClick={suppliersAdmin.refreshAll}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {suppliersAdmin.feedback && (
        <div className={`supplier-feedback-toast ${suppliersAdmin.feedback.type}`}>
          {suppliersAdmin.feedback.type === 'success' ? <CheckCircle2 size={18} /> : <ClipboardList size={18} />}
          <span>{suppliersAdmin.feedback.message}</span>
        </div>
      )}

      <section className="supplier-workspace">
        <SupplierList
          suppliers={suppliersAdmin.suppliers}
          selectedSupplier={suppliersAdmin.selectedSupplier}
          search={suppliersAdmin.search}
          loading={suppliersAdmin.loading}
          onSearchChange={suppliersAdmin.setSearch}
          onSelectSupplier={suppliersAdmin.setSelectedSupplier}
        />

        <main className="supplier-main">
          <SupplierForm
            editingSupplier={suppliersAdmin.editingSupplier}
            supplierForm={suppliersAdmin.supplierForm}
            onFormChange={suppliersAdmin.setSupplierForm}
            onSubmit={suppliersAdmin.handleSupplierSubmit}
            onCancelEdit={suppliersAdmin.resetSupplierForm}
          />

          <SupplierProducts
            selectedSupplier={suppliersAdmin.selectedSupplier}
            supplierProducts={suppliersAdmin.supplierProducts}
            productForm={suppliersAdmin.productForm}
            availableProducts={suppliersAdmin.availableProducts}
            onFormChange={suppliersAdmin.setProductForm}
            onSubmit={suppliersAdmin.handleSupplierProductSubmit}
            onEditSupplier={suppliersAdmin.startEditingSupplier}
            onToggleProductStatus={suppliersAdmin.handleSupplierProductStatus}
          />

          <PurchaseOrders
            metadata={suppliersAdmin.metadata}
            orders={suppliersAdmin.orders}
            orderForm={suppliersAdmin.orderForm}
            orderDetails={suppliersAdmin.orderDetails}
            onOrderFormChange={suppliersAdmin.setOrderForm}
            onOrderDetailsChange={suppliersAdmin.setOrderDetails}
            onSubmit={suppliersAdmin.handleOrderSubmit}
            onOrderStatus={suppliersAdmin.handleOrderStatus}
            onReceiveOrder={suppliersAdmin.handleReceiveOrder}
          />
        </main>
      </section>
    </div>
  );
};

export default ManageSuppliersPage;
