import type { ReservationReceipt } from '../../CU17-realizar-reserva-prendas/types/reservation.types';

export type ReservationTab = 'activas' | 'historico';

export interface MyReservationItem {
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

export interface MyReservationListItem {
  id_reserva: number;
  codigo: string;
  estado: string;
  fecha_reserva: string;
  horario_estimado: string | null;
  fecha_limite: string;
  es_cancelable: boolean;
  observaciones: string | null;
  sucursal: {
    id_sucursal: number;
    nombre: string;
    direccion: string;
    telefono: string | null;
    horario: string;
    ciudad: string;
  };
  items: MyReservationItem[];
  total_prendas: number;
  total_estimado: number;
}

export interface CancelReservationPayload {
  motivo?: string;
}

export interface CancelReservationResponse {
  success: boolean;
  mensaje: string;
  id_reserva: number;
  codigo: string;
  estado: string;
  prendas_liberadas: number;
}

export type { ReservationReceipt };
