/**
 * @caso-de-uso CU16 — Gestionar movimientos de inventario
 * @subsistema Sucursales e Inventario
 * @capa Entity/DTO — Frontend web
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Administrador o Encargado -> formulario de movimiento -> controlador de inventario -> servicio transaccional -> MovimientoInventario/Inventario/Variante/Sucursal.
 */
export interface MovementBranch {
  id_sucursal: number;
  nombre: string;
  ciudad?: string;
  direccion?: string;
}

export interface MovementProduct {
  id_producto: number;
  nombre: string;
  precio_base: number;
}

export interface MovementVariant {
  id_producto_variante: number;
  sku: string;
  talla: string;
  color: string;
  color_hex: string | null;
}

export interface MovementEmployee {
  id_empleado: number;
  nombre_completo: string;
  codigo: string;
}

export interface MovementItem {
  id_movimiento: number;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste' | 'devolucion' | string;
  cantidad: number;
  fecha: string;
  motivo: string;
  producto: MovementProduct;
  variante: MovementVariant;
  sucursal: MovementBranch;
  responsable: MovementEmployee;
}

export interface MovementStats {
  total_movimientos: number;
  unidades_ingresadas: number;
  unidades_egresadas: number;
  unidades_ajustes: number;
  unidades_devoluciones: number;
}

export interface VariantStockInfo {
  id_producto_variante: number;
  sku: string;
  producto_nombre: string;
  precio_base: number;
  talla: string;
  color: string;
  color_hex: string | null;
  stocks_por_sucursal: Record<
    number,
    { stock_disponible: number; stock_reservado: number; stock_minimo: number }
  >;
}

export interface MovementMetadata {
  sucursales: MovementBranch[];
  variantes: VariantStockInfo[];
}

export interface MovementPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MovementResponse {
  data: MovementItem[];
  pagination: MovementPaginationMeta;
  stats: MovementStats;
}

export interface MovementQueryParams {
  search?: string;
  id_sucursal?: number;
  tipo_movimiento?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}

export interface CreateMovementPayload {
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste' | 'devolucion';
  cantidad: number;
  id_producto_variante: number;
  id_sucursal: number;
  motivo: string;
}
