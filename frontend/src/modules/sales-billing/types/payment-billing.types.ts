export interface ProcessPaymentPayload {
  id_venta: number;
  metodo_pago: 'tarjeta' | 'stripe' | 'qr' | 'transferencia' | 'efectivo';
  monto: number;
  monto_recibido?: number;
  transaccion_externa?: string;
  nit_factura?: string;
  razon_social_factura?: string;
}

export interface PaymentItemReceipt {
  id_detalle_venta: number;
  id_producto: number;
  nombre_producto: string;
  sku: string;
  talla: string;
  color: string;
  imagen: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface PaymentConfirmationResult {
  success: boolean;
  mensaje: string;
  id_venta: number;
  codigo_factura: string;
  estado_venta: string;
  fecha: string;
  sucursal?: {
    id_sucursal: number;
    nombre: string;
    ciudad?: string;
  };
  cliente: {
    id_cliente?: number;
    nombre_completo: string;
    nit_ci: string;
  };
  pago: {
    metodo_pago: string;
    monto_pagado: number;
    monto_recibido: number;
    cambio: number;
    transaccion: string;
    fecha_pago: string;
  };
  liquidacion: {
    subtotal: number;
    descuento: number;
    total: number;
  };
  factura: {
    numero_factura: string;
    numero_autorizacion: string;
    codigo_control: string;
    leyenda: string;
  };
  items: PaymentItemReceipt[];
}

export interface PendingSaleItem {
  id_detalle_venta: number;
  nombre: string;
  sku: string;
  talla?: string;
  color?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  imagen: string | null;
}

export interface PendingSale {
  id_venta: number;
  codigo_factura: string;
  tipo_venta: string;
  estado: string;
  fecha_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  cliente: {
    id_cliente?: number;
    nombre_completo: string;
    ci: string;
  };
  total_articulos: number;
  items: PendingSaleItem[];
}
