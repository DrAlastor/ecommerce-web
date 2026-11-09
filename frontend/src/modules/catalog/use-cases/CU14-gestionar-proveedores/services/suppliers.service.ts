/**
 * @caso-de-uso CU11 — Gestionar proveedores
 * @subsistema Catálogo y Proveedores
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Administrador -> vista de proveedores -> controlador de proveedores -> servicio de proveedores -> Proveedor/ProveedorProducto/Producto.
 */
import api from '../../../../../services/api/api';
import type {
  PaginatedResponse,
  PurchaseOrder,
  Supplier,
  SupplierProduct,
  SuppliersMetadata,
} from '../types/suppliers.types';

const baseUrl = '/catalog/admin/suppliers';

export const suppliersService = {
  async getMetadata(): Promise<SuppliersMetadata> {
    const res = await api.get<SuppliersMetadata>(`${baseUrl}/metadata`);
    return res.data;
  },

  async getSuppliers(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Supplier>> {
    const res = await api.get<PaginatedResponse<Supplier>>(baseUrl, { params });
    return res.data;
  },

  async createSupplier(data: {
    razon_social: string;
    nit: string;
    contacto_nombre?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
  }) {
    const res = await api.post(`${baseUrl}`, data);
    return res.data;
  },

  async updateSupplier(
    id: number,
    data: {
      razon_social?: string;
      nit?: string;
      contacto_nombre?: string;
      telefono?: string;
      email?: string;
      direccion?: string;
    },
  ) {
    const res = await api.put(`${baseUrl}/${id}`, data);
    return res.data;
  },

  async getSupplierProducts(id: number): Promise<SupplierProduct[]> {
    const res = await api.get<SupplierProduct[]>(`${baseUrl}/${id}/products`);
    return res.data;
  },

  async addSupplierProduct(
    supplierId: number,
    data: { id_producto: number; costo_referencia?: number; estado?: string },
  ) {
    const res = await api.post(`${baseUrl}/${supplierId}/products`, data);
    return res.data;
  },

  async updateSupplierProduct(
    supplierId: number,
    productId: number,
    data: { costo_referencia?: number; estado?: string },
  ) {
    const res = await api.put(`${baseUrl}/${supplierId}/products/${productId}`, data);
    return res.data;
  },

  async removeSupplierProduct(supplierId: number, productId: number) {
    const res = await api.delete(`${baseUrl}/${supplierId}/products/${productId}`);
    return res.data;
  },

  async getPurchaseOrders(params?: {
    id_proveedor?: number;
    id_sucursal?: number;
    estado?: string;
  }): Promise<PurchaseOrder[]> {
    const res = await api.get<PurchaseOrder[]>(`${baseUrl}/purchase-orders/list`, { params });
    return res.data;
  },

  async createPurchaseOrder(data: {
    id_proveedor: number;
    id_sucursal: number;
    fecha_estimada?: string;
    observaciones?: string;
    detalles: Array<{
      id_producto_variante: number;
      cantidad: number;
      costo_unitario: number;
      id_temporada: number;
    }>;
  }) {
    const res = await api.post(`${baseUrl}/purchase-orders`, data);
    return res.data;
  },

  async updatePurchaseOrderStatus(id: number, estado: string) {
    const res = await api.patch(`${baseUrl}/purchase-orders/${id}/status`, { estado });
    return res.data;
  },

  async receivePurchaseOrder(id: number, data?: { id_empleado_responsable?: number }) {
    const res = await api.post(`${baseUrl}/purchase-orders/${id}/receive`, data || {});
    return res.data;
  },
};
