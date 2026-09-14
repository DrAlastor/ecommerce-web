export interface Supplier {
  id_proveedor: number;
  razon_social: string;
  nit: string;
  contacto_nombre: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  total_productos?: number;
  total_ordenes?: number;
}

export interface SupplierProduct {
  id_proveedor: number;
  id_producto: number;
  costo_referencia: number | null;
  estado: 'DISPONIBLE' | 'AGOTADO' | string;
  producto: {
    id_producto: number;
    nombre: string;
    precio_base?: number;
    estado: string;
    categoria?: { nombre: string };
  };
}

export interface PurchaseOrderDetail {
  id_detalle_orden_compra: number;
  cantidad: number;
  costo_unitario: number;
  id_producto_variante: number;
  id_temporada: number;
  producto_variante?: {
    id_producto_variante: number;
    sku: string;
    producto?: { id_producto: number; nombre: string };
    talla?: { codigo: string };
    color?: { nombre: string };
  };
  temporada?: { id_temporada: number; nombre: string };
}

export interface PurchaseOrder {
  id_orden_compra: number;
  fecha_orden: string;
  fecha_estimada: string | null;
  fecha_recepcion: string | null;
  estado: 'pendiente' | 'en_transito' | 'recibida' | 'cancelada' | string;
  observaciones: string | null;
  id_proveedor: number;
  id_sucursal: number;
  proveedor?: { id_proveedor: number; razon_social: string; nit: string };
  sucursal?: { id_sucursal: number; nombre: string };
  detalle_orden_compra: PurchaseOrderDetail[];
  total_estimado: number;
  total_unidades: number;
}

export interface SuppliersMetadata {
  products: Array<{ id_producto: number; nombre: string; estado: string }>;
  branches: Array<{ id_sucursal: number; nombre: string; estado: string }>;
  variants: Array<{
    id_producto_variante: number;
    sku: string;
    estado: string;
    producto: { id_producto: number; nombre: string };
    talla: { codigo: string };
    color: { nombre: string };
  }>;
  seasons: Array<{ id_temporada: number; nombre: string; estado: string }>;
  suppliers: Array<{ id_proveedor: number; razon_social: string; nit: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
