/**
 * @caso-de-uso CU17 — Realizar reserva de prendas
 * @subsistema Reservas
 * @capa Entity/DTO — Frontend web
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Cliente -> formulario de reserva -> controlador de reservas -> servicio de disponibilidad -> Reserva/DetalleReserva/Inventario/Sucursal.
 */
export interface BranchAvailability {
  id_sucursal: number;
  nombre: string;
  direccion: string;
  telefono: string;
  hora_apertura: string;
  hora_cierre: string;
  ciudad: string;
  pais: string;
  stock_disponible: number;
  stock_reservado: number;
  tiene_disponibilidad: boolean;
}

export interface VariantAvailabilityResponse {
  variante: {
    id_producto_variante: number;
    sku: string;
    precio: number;
    producto_id: number;
    producto_nombre: string;
    talla: string;
    color_nombre: string;
    color_hex: string;
    imagen_url: string | null;
  };
  sucursales: BranchAvailability[];
}

export interface CreateReservationPayload {
  id_sucursal: number;
  fecha_visita?: string;
  observaciones?: string;
  id_producto_variante?: number;
  cantidad?: number;
  items?: Array<{
    id_producto_variante: number;
    cantidad: number;
  }>;
}

export interface ReservationReceiptItem {
  id_detalle_reserva: number;
  id_producto_variante: number;
  cantidad: number;
  estado: string;
  producto_nombre: string;
  sku: string;
  talla: string;
  color_nombre: string;
  color_hex: string;
  imagen_url: string | null;
  precio_estimado: number;
  subtotal_estimado: number;
}

export interface ReservationReceipt {
  comprobante: {
    id_reserva: number;
    codigo: string;
    estado: string;
    fecha_reserva: string;
    horario_estimado: string;
    fecha_limite: string;
    observaciones: string | null;
    dias_vigencia: number;
  };
  sucursal: {
    id_sucursal: number;
    nombre: string;
    direccion: string;
    telefono: string;
    horario: string;
    ciudad: string;
  };
  resumen: {
    total_prendas: number;
    total_estimado: number;
  };
  items: ReservationReceiptItem[];
  instrucciones: string[];
}
