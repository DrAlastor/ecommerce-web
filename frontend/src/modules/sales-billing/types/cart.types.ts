export interface CartItemColor {
  nombre: string;
  hex: string;
}

export interface CartItemPromotion {
  id_promocion: number;
  nombre: string;
  tipo_descuento: 'porcentaje' | 'monto_fijo' | string;
  valor_descuento: number;
  porcentaje: number;
}

export interface BackendCartItem {
  id_item_carrito: number;
  id_producto_variante: number;
  id_producto: number;
  nombre_producto: string;
  sku: string;
  talla: string;
  color: CartItemColor;
  imagen: string | null;
  cantidad: number;
  stock_disponible: number;
  disponible: boolean;
  precio_unitario_registrado: number;
  precio_original: number;
  precio_vigente: number;
  tiene_descuento: boolean;
  porcentaje_descuento: number;
  promocion: CartItemPromotion | null;
  subtotal: number;
}

export interface BackendCart {
  id_carrito: number;
  id_cliente: number;
  actualizado: string;
  items: BackendCartItem[];
  cantidad_articulos: number;
  subtotal: number;
  ahorro_total: number;
  total: number;
  todos_disponibles: boolean;
}

export interface AddToCartPayload {
  id_producto_variante?: number;
  id_producto?: number;
  cantidad: number;
}

export interface UpdateCartItemPayload {
  cantidad: number;
}

export interface SyncCartPayload {
  items: {
    id_producto_variante: number;
    cantidad: number;
  }[];
}
