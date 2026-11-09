/**
 * @caso-de-uso CU11 — Gestionar proveedores
 * @subsistema Catálogo y Proveedores
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Administrador -> vista de proveedores -> controlador de proveedores -> servicio de proveedores -> Proveedor/ProveedorProducto/Producto.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../users-security/shared/components/AuthContext';
import { suppliersService } from '../services/suppliers.service';
import type {
  PurchaseOrder,
  Supplier,
  SupplierProduct,
  SuppliersMetadata,
} from '../types/suppliers.types';

type Feedback = { type: 'success' | 'error'; message: string } | null;

export const emptySupplierForm = {
  razon_social: '',
  nit: '',
  contacto_nombre: '',
  telefono: '',
  email: '',
  direccion: '',
};

export const emptyProductForm = {
  id_producto: '',
  costo_referencia: '',
  estado: 'DISPONIBLE',
};

export const emptyOrderForm = {
  id_proveedor: '',
  id_sucursal: '',
  fecha_estimada: '',
  observaciones: '',
};

export const emptyOrderDetail = {
  id_producto_variante: '',
  cantidad: '1',
  costo_unitario: '',
  id_temporada: '',
};

export function useSuppliersAdmin() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [metadata, setMetadata] = useState<SuppliersMetadata | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [orderDetails, setOrderDetails] = useState([emptyOrderDetail]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchSuppliers = useCallback(async () => {
    const response = await suppliersService.getSuppliers({ search, limit: 50 });
    setSuppliers(response.data);
    setSelectedSupplier((current) => {
      if (!current) return response.data[0] || null;
      return response.data.find((supplier) => supplier.id_proveedor === current.id_proveedor) || response.data[0] || null;
    });
  }, [search]);

  const fetchOrders = useCallback(async () => {
    const data = await suppliersService.getPurchaseOrders();
    setOrders(data);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const meta = await suppliersService.getMetadata();
      setMetadata(meta);
      await Promise.all([fetchSuppliers(), fetchOrders()]);
    } catch (error: any) {
      showFeedback('error', error.response?.data?.message || 'No se pudo cargar proveedores.');
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, fetchSuppliers]);

  const fetchSupplierProducts = useCallback(async () => {
    if (!selectedSupplier) {
      setSupplierProducts([]);
      return;
    }

    try {
      const data = await suppliersService.getSupplierProducts(selectedSupplier.id_proveedor);
      setSupplierProducts(data);
    } catch (error: any) {
      showFeedback('error', error.response?.data?.message || 'No se pudo cargar productos suministrados.');
    }
  }, [selectedSupplier]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    fetchSupplierProducts();
  }, [fetchSupplierProducts]);

  const availableProducts = useMemo(() => {
    const associatedIds = new Set(supplierProducts.map((item) => item.id_producto));
    return (metadata?.products || []).filter((product) => !associatedIds.has(product.id_producto));
  }, [metadata, supplierProducts]);

  const resetSupplierForm = () => {
    setSupplierForm(emptySupplierForm);
    setEditingSupplier(null);
  };

  const handleSupplierSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      razon_social: supplierForm.razon_social,
      nit: supplierForm.nit,
      contacto_nombre: supplierForm.contacto_nombre || undefined,
      telefono: supplierForm.telefono || undefined,
      email: supplierForm.email || undefined,
      direccion: supplierForm.direccion || undefined,
    };

    try {
      if (editingSupplier) {
        const response = await suppliersService.updateSupplier(editingSupplier.id_proveedor, payload);
        showFeedback('success', response.message);
      } else {
        const response = await suppliersService.createSupplier(payload);
        showFeedback('success', response.message);
      }
      resetSupplierForm();
      const meta = await suppliersService.getMetadata();
      setMetadata(meta);
      await fetchSuppliers();
    } catch (error: any) {
      showFeedback('error', error.response?.data?.message || 'No se pudo guardar el proveedor.');
    }
  };

  const startEditingSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      razon_social: supplier.razon_social,
      nit: supplier.nit,
      contacto_nombre: supplier.contacto_nombre || '',
      telefono: supplier.telefono || '',
      email: supplier.email || '',
      direccion: supplier.direccion || '',
    });
  };

  const handleSupplierProductSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSupplier) return;

    try {
      const response = await suppliersService.addSupplierProduct(selectedSupplier.id_proveedor, {
        id_producto: Number(productForm.id_producto),
        costo_referencia: productForm.costo_referencia ? Number(productForm.costo_referencia) : undefined,
        estado: productForm.estado,
      });
      showFeedback('success', response.message);
      setProductForm(emptyProductForm);
      await Promise.all([fetchSupplierProducts(), fetchSuppliers()]);
    } catch (error: any) {
      showFeedback('error', error.response?.data?.message || 'No se pudo asociar el producto.');
    }
  };

  const handleSupplierProductStatus = async (product: SupplierProduct) => {
    if (!selectedSupplier) return;

    try {
      const nextStatus = product.estado === 'DISPONIBLE' ? 'AGOTADO' : 'DISPONIBLE';
      const response = await suppliersService.updateSupplierProduct(
        selectedSupplier.id_proveedor,
        product.id_producto,
        { estado: nextStatus },
      );
      showFeedback('success', response.message);
      await fetchSupplierProducts();
    } catch (error: any) {
      showFeedback('error', error.response?.data?.message || 'No se pudo actualizar la relacion.');
    }
  };

  const handleOrderSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await suppliersService.createPurchaseOrder({
        id_proveedor: Number(orderForm.id_proveedor),
        id_sucursal: Number(orderForm.id_sucursal),
        fecha_estimada: orderForm.fecha_estimada || undefined,
        observaciones: orderForm.observaciones || undefined,
        detalles: orderDetails.map((detail) => ({
          id_producto_variante: Number(detail.id_producto_variante),
          cantidad: Number(detail.cantidad),
          costo_unitario: Number(detail.costo_unitario),
          id_temporada: Number(detail.id_temporada),
        })),
      });
      showFeedback('success', response.message);
      setOrderForm(emptyOrderForm);
      setOrderDetails([emptyOrderDetail]);
      await Promise.all([fetchOrders(), fetchSuppliers()]);
    } catch (error: any) {
      showFeedback('error', error.response?.data?.message || 'No se pudo registrar la orden.');
    }
  };

  const handleOrderStatus = async (order: PurchaseOrder, estado: string) => {
    try {
      const response = await suppliersService.updatePurchaseOrderStatus(order.id_orden_compra, estado);
      showFeedback('success', response.message);
      await fetchOrders();
    } catch (error: any) {
      showFeedback('error', error.response?.data?.message || 'No se pudo actualizar la orden.');
    }
  };

  const handleReceiveOrder = async (order: PurchaseOrder) => {
    try {
      const employeeId = user?.empleado?.id_empleado;
      if (!employeeId) {
        showFeedback('error', 'Tu cuenta no tiene empleado asociado para registrar inventario.');
        return;
      }

      const response = await suppliersService.receivePurchaseOrder(order.id_orden_compra, {
        id_empleado_responsable: employeeId,
      });
      showFeedback('success', response.message);
      await fetchOrders();
    } catch (error: any) {
      showFeedback('error', error.response?.data?.message || 'No se pudo registrar la recepcion.');
    }
  };

  return {
    suppliers,
    supplierProducts,
    orders,
    metadata,
    selectedSupplier,
    setSelectedSupplier,
    editingSupplier,
    supplierForm,
    setSupplierForm,
    productForm,
    setProductForm,
    orderForm,
    setOrderForm,
    orderDetails,
    setOrderDetails,
    search,
    setSearch,
    loading,
    feedback,
    availableProducts,
    refreshAll,
    resetSupplierForm,
    handleSupplierSubmit,
    startEditingSupplier,
    handleSupplierProductSubmit,
    handleSupplierProductStatus,
    handleOrderSubmit,
    handleOrderStatus,
    handleReceiveOrder,
  };
}
