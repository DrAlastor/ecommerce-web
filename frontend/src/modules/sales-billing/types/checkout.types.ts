export interface NuevaDireccionPayload {
  destinatario: string;
  telefono: string;
  calle: string;
  detalle?: string;
  id_ciudad: number;
}

export interface ProcessPurchasePayload {
  metodo_pago: 'stripe' | 'qr' | 'transferencia';
  tipo_entrega: 'domicilio' | 'retiro_sucursal';
  id_direccion?: number;
  nueva_direccion?: NuevaDireccionPayload;
  id_sucursal_retiro?: number;
  transaccion_externa?: string;
  nit_factura?: string;
  razon_social_factura?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface OrderItemReceipt {
  id_detalle_venta: number;
  id_producto_variante: number;
  nombre_producto: string;
  sku: string;
  talla: string;
  color: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  imagen: string | null;
}

export interface OrderReceipt {
  id_venta: number;
  codigo_factura: string;
  tipo_venta: string;
  estado: string;
  fecha_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  cliente: {
    id_cliente: number;
    nombre_completo: string;
    ci: string;
  };
  pago: {
    id_pago: number;
    metodo_pago: string;
    importe: number;
    transaccion_externa: string;
    estado: string;
    fecha_pago: string;
  } | null;
  envio: {
    id_envio: number;
    transportista: string;
    numero_guia: string;
    estado: string;
    direccion: {
      destinatario: string;
      telefono: string;
      calle: string;
      ciudad: string;
      detalle?: string;
    };
  } | null;
  articulos: OrderItemReceipt[];
}
