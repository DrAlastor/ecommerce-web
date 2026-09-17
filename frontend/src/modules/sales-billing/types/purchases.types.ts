export interface PurchaseItemDetail {
  id_detalle_venta: number;
  id_producto: number;
  nombre_producto: string;
  sku: string;
  talla: string;
  color: string;
  color_hex?: string;
  imagen: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface PurchasePaymentDetail {
  id_pago: number;
  metodo_pago: string;
  estado: string;
  importe: number;
  transaccion_externa: string;
  fecha_pago: string;
}

export interface PurchaseShippingDetail {
  id_envio: number;
  numero_guia: string;
  transportista: string;
  estado: string;
  fecha_entrega: string | null;
  direccion: {
    destinatario: string;
    telefono: string | null;
    calle: string;
    detalle?: string | null;
    ciudad: string;
  } | null;
}

export interface PurchaseSummary {
  id_venta: number;
  codigo_factura: string;
  tipo_venta: string;
  estado: string;
  fecha_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  total_articulos: number;
  pago: PurchasePaymentDetail | null;
  envio: PurchaseShippingDetail | null;
  items: PurchaseItemDetail[];
}

export interface PurchaseDetail extends PurchaseSummary {
  cliente: {
    id_cliente: number;
    nombre_completo: string;
    ci: string;
  };
  factura: {
    numero_autorizacion: string;
    codigo_control: string;
    leyenda: string;
  };
}

export interface PurchaseFilterParams {
  estado?: string;
  search?: string;
  tipo_venta?: string;
  page?: number;
  limit?: number;
}

export interface PurchasesListResponse {
  data: PurchaseSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
