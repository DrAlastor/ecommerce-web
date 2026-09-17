import type { PaymentConfirmationResult } from './payment-billing.types';

export interface POSBranch {
  id_sucursal: number;
  nombre: string;
  direccion: string;
  telefono?: string | null;
  ciudad?: {
    id_ciudad: number;
    nombre: string;
    pais: string;
  };
}

export interface POSProductVariant {
  id_producto_variante: number;
  sku: string;
  talla: string;
  color: string;
  color_hex: string;
  stock_disponible: number;
  precio_regular: number;
  precio_final: number;
  tiene_descuento: boolean;
  promocion?: {
    id_promocion: number;
    nombre: string;
    tipo_descuento: string;
    descuento_porcentaje: number;
  } | null;
}

export interface POSProduct {
  id_producto: number;
  nombre: string;
  categoria: string;
  id_categoria: number;
  imagen: string | null;
  precio_base: number;
  stock_sucursal_total: number;
  variantes: POSProductVariant[];
}

export interface POSCartItem {
  id_producto_variante: number;
  id_producto: number;
  nombre_producto: string;
  imagen: string | null;
  sku: string;
  talla: string;
  color: string;
  color_hex: string;
  cantidad: number;
  precio_regular: number;
  precio_unitario: number;
  descuento_unitario: number;
  subtotal: number;
  stock_max: number;
}

export interface POSClientResult {
  id_cliente: number;
  ci: string | null;
  nombre_completo: string;
  email: string | null;
  puntos_fidelidad: number;
}

export interface CreatePresentialSalePayload {
  id_sucursal: number;
  items: {
    id_producto_variante: number;
    cantidad: number;
  }[];
  metodo_pago: 'efectivo' | 'tarjeta' | 'qr';
  monto_recibido?: number;
  id_cliente?: number;
  cliente_ci?: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  nit_factura?: string;
  razon_social_factura?: string;
  transaccion_externa?: string;
}

export interface POSSaleItemDetail {
  id_detalle: number;
  id_producto_variante: number;
  nombre_producto: string;
  sku: string;
  talla: string;
  color: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface POSSalePaymentDetail {
  id_pago: number;
  metodo_pago: string;
  monto: number;
  estado: string;
  fecha_pago: string | null;
  referencia_transaccion: string | null;
}

export interface POSSaleHistoryItem {
  id_venta: number;
  codigo_factura: string;
  tipo_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: string;
  fecha_venta: string;
  cliente: {
    id_cliente: number;
    nombre_completo: string;
    ci: string | null;
  };
  empleado: {
    id_empleado: number;
    nombre_completo: string;
    codigo_empleado: string;
  } | null;
  pago: POSSalePaymentDetail[];
  items: POSSaleItemDetail[];
}

export type { PaymentConfirmationResult };

