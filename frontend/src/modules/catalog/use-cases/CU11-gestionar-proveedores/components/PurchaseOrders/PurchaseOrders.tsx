/**
 * @caso-de-uso CU11 — Gestionar proveedores
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> vista de proveedores -> controlador de proveedores -> servicio de proveedores -> Proveedor/ProveedorProducto/Producto.
 */
import React from 'react';
import { Plus, Truck } from 'lucide-react';
import { emptyOrderDetail } from '../../hooks/useSuppliersAdmin';
import type { PurchaseOrder, SuppliersMetadata } from '../../types/suppliers.types';

type OrderFormState = {
  id_proveedor: string;
  id_sucursal: string;
  fecha_estimada: string;
  observaciones: string;
};

type OrderDetailState = typeof emptyOrderDetail;

interface PurchaseOrdersProps {
  metadata: SuppliersMetadata | null;
  orders: PurchaseOrder[];
  orderForm: OrderFormState;
  orderDetails: OrderDetailState[];
  onOrderFormChange: (form: OrderFormState) => void;
  onOrderDetailsChange: (details: OrderDetailState[]) => void;
  onSubmit: (event: React.FormEvent) => void;
  onOrderStatus: (order: PurchaseOrder, status: string) => void;
  onReceiveOrder: (order: PurchaseOrder) => void;
}

export const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({
  metadata,
  orders,
  orderForm,
  orderDetails,
  onOrderFormChange,
  onOrderDetailsChange,
  onSubmit,
  onOrderStatus,
  onReceiveOrder,
}) => (
  <>
    <section className="supplier-card">
      <div className="section-title-row">
        <div>
          <h2>Nueva orden de compra</h2>
          <p>Crear la orden registra mercaderia adquirida, sin aumentar stock todavia.</p>
        </div>
      </div>

      <form className="admin-form" onSubmit={onSubmit}>
        <div className="form-row-2">
          <select
            className="admin-select"
            value={orderForm.id_proveedor}
            onChange={(event) => onOrderFormChange({ ...orderForm, id_proveedor: event.target.value })}
            required
          >
            <option value="">Proveedor</option>
            {metadata?.suppliers.map((supplier) => (
              <option key={supplier.id_proveedor} value={supplier.id_proveedor}>
                {supplier.razon_social}
              </option>
            ))}
          </select>
          <select
            className="admin-select"
            value={orderForm.id_sucursal}
            onChange={(event) => onOrderFormChange({ ...orderForm, id_sucursal: event.target.value })}
            required
          >
            <option value="">Sucursal destino</option>
            {metadata?.branches.map((branch) => (
              <option key={branch.id_sucursal} value={branch.id_sucursal}>
                {branch.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row-2">
          <input
            className="admin-input"
            type="date"
            value={orderForm.fecha_estimada}
            onChange={(event) => onOrderFormChange({ ...orderForm, fecha_estimada: event.target.value })}
          />
          <input
            className="admin-input"
            placeholder="Observaciones"
            value={orderForm.observaciones}
            onChange={(event) => onOrderFormChange({ ...orderForm, observaciones: event.target.value })}
          />
        </div>

        <div className="order-detail-list">
          {orderDetails.map((detail, index) => (
            <div key={index} className="order-detail-row">
              <select
                className="admin-select"
                value={detail.id_producto_variante}
                onChange={(event) => {
                  const next = [...orderDetails];
                  next[index] = { ...detail, id_producto_variante: event.target.value };
                  onOrderDetailsChange(next);
                }}
                required
              >
                <option value="">Variante</option>
                {metadata?.variants.map((variant) => (
                  <option key={variant.id_producto_variante} value={variant.id_producto_variante}>
                    {variant.producto.nombre} · {variant.talla.codigo}/{variant.color.nombre} · {variant.sku}
                  </option>
                ))}
              </select>
              <input
                className="admin-input"
                type="number"
                min="1"
                value={detail.cantidad}
                onChange={(event) => {
                  const next = [...orderDetails];
                  next[index] = { ...detail, cantidad: event.target.value };
                  onOrderDetailsChange(next);
                }}
                required
              />
              <input
                className="admin-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Costo"
                value={detail.costo_unitario}
                onChange={(event) => {
                  const next = [...orderDetails];
                  next[index] = { ...detail, costo_unitario: event.target.value };
                  onOrderDetailsChange(next);
                }}
                required
              />
              <select
                className="admin-select"
                value={detail.id_temporada}
                onChange={(event) => {
                  const next = [...orderDetails];
                  next[index] = { ...detail, id_temporada: event.target.value };
                  onOrderDetailsChange(next);
                }}
                required
              >
                <option value="">Temporada</option>
                {metadata?.seasons.map((season) => (
                  <option key={season.id_temporada} value={season.id_temporada}>
                    {season.nombre}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="supplier-form-actions split">
          <button
            type="button"
            className="admin-btn secondary"
            onClick={() => onOrderDetailsChange([...orderDetails, emptyOrderDetail])}
          >
            <Plus size={16} /> Agregar detalle
          </button>
          <button type="submit" className="admin-btn primary">
            <Truck size={16} /> Registrar orden
          </button>
        </div>
      </form>
    </section>

    <section className="supplier-card">
      <div className="section-title-row">
        <div>
          <h2>Ordenes de compra</h2>
          <p>Seguimiento de mercaderia pendiente, en transito o recibida.</p>
        </div>
      </div>

      <div className="admin-table-container supplier-orders-table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Proveedor</th>
              <th>Sucursal</th>
              <th>Estado</th>
              <th>Estimado</th>
              <th>Total</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id_orden_compra}>
                <td>#{order.id_orden_compra}</td>
                <td>{order.proveedor?.razon_social}</td>
                <td>{order.sucursal?.nombre}</td>
                <td><span className={`order-status ${order.estado}`}>{order.estado}</span></td>
                <td>{order.fecha_estimada ? new Date(order.fecha_estimada).toLocaleDateString() : '-'}</td>
                <td>{order.total_unidades} uds · Bs {order.total_estimado.toFixed(2)}</td>
                <td>
                  <div className="action-buttons-group">
                    {order.estado === 'pendiente' && (
                      <button type="button" className="admin-btn sm secondary" onClick={() => onOrderStatus(order, 'en_transito')}>
                        En transito
                      </button>
                    )}
                    {order.estado !== 'recibida' && order.estado !== 'cancelada' && (
                      <button type="button" className="admin-btn sm primary" onClick={() => onReceiveOrder(order)}>
                        Recibir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="supplier-empty">No hay ordenes de compra registradas.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  </>
);
