/**
 * @caso-de-uso Módulo heredado — Gestión de devoluciones
 * @subsistema Ventas, Pagos y Compras
 * @capa Entity/DTO — Frontend web
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Usuario autorizado -> vista de devoluciones -> controlador -> servicio de devoluciones -> Devolución/DetalleDevolución/Venta/Inventario.
 * Nota: módulo heredado; su numeración no corresponde al catálogo oficial de CU del informe.
 */
export interface ReturnItem {
  id_detalle_devolucion?: number;
  id_detalle_venta: number;
  cantidad: number;
  motivo?: string;
  precio_unitario?: number;
  subtotal?: number;
  producto?: {
    id_producto?: number;
    nombre: string;
    sku?: string;
    imagen_url?: string | null;
    color?: string;
    talla?: string;
  };
}

export interface ReturnRecord {
  id_devolucion: number;
  id_venta: number;
  fecha_hora: string;
  motivo: string;
  estado: 'pendiente' | 'procesada' | 'rechazada' | string;
  observacion?: string | null;
  total_items: number;
  monto_estimado: number;
  venta: {
    id_venta: number;
    codigo_factura: string;
    fecha_venta: string;
    monto_total: number;
    cliente?: {
      id_cliente: number;
      nombre: string;
      ci?: string | null;
    } | null;
    sucursal?: {
      id_sucursal: number;
      nombre: string;
    } | null;
  };
  items: ReturnItem[];
}

export interface CreateReturnPayload {
  id_venta: number;
  motivo: string;
  observacion?: string;
  items: Array<{
    id_detalle_venta: number;
    cantidad: number;
    motivo?: string;
  }>;
  id_sucursal_reingreso?: number;
  auto_procesar?: boolean;
}

export interface UpdateReturnStatusPayload {
  estado: 'procesada' | 'rechazada' | 'pendiente';
  observacion?: string;
  id_sucursal_reingreso?: number;
}

export interface ReturnsPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReturnsListResponse {
  data: ReturnRecord[];
  meta: ReturnsPaginationMeta;
}

export interface SaleLookupItem {
  id_detalle_venta: number;
  cantidad_comprada: number;
  cantidad_devuelta: number;
  cantidad_disponible: number;
  precio_unitario: number;
  subtotal: number;
  producto: {
    id_producto?: number;
    nombre: string;
    sku?: string;
    imagen_url?: string | null;
    color?: string;
    talla?: string;
  };
}

export interface BranchOption {
  id_sucursal: number;
  nombre: string;
  direccion?: string;
}

export interface SaleLookupResult {
  id_venta: number;
  codigo_factura: string;
  numero_comprobante?: string | null;
  fecha_venta: string;
  estado: string;
  total: number;
  cliente?: {
    id_cliente: number;
    nombre: string;
    ci?: string | null;
  } | null;
  sucursal_origen?: {
    id_sucursal: number;
    nombre: string;
  } | null;
  tiene_items_disponibles: boolean;
  items: SaleLookupItem[];
}

export interface SaleLookupResponse {
  ventas: SaleLookupResult[];
  sucursales: BranchOption[];
}
