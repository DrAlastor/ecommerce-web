/**
 * @caso-de-uso CU19 — Gestionar reserva en sucursal
 * @subsistema Reservas
 * @capa Entity/DTO — Frontend web
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Encargado o Cajero -> bandeja de reservas -> controlador de atención -> servicio de reservas -> Reserva/DetalleReserva/Inventario/Bitácora.
 */
export type BranchReservationStatus =
  | 'Pendiente'
  | 'Preparada'
  | 'Atendida'
  | 'Completada'
  | 'Cancelada'
  | 'Expirada';

export interface StaffBranch {
  id_sucursal: number;
  nombre: string;
  direccion: string;
  ciudad: {
    nombre: string;
  };
}

export interface BranchReservationItem {
  id_detalle_reserva: number;
  id_producto_variante: number;
  cantidad: number;
  estado: string;
  producto_id: number;
  producto_nombre: string;
  sku: string;
  talla: string;
  color_nombre: string;
  color_hex: string | null;
  imagen_url: string | null;
  precio_estimado: number;
  subtotal_estimado: number;
}

export interface BranchReservation {
  id_reserva: number;
  codigo: string;
  estado: BranchReservationStatus;
  fecha_reserva: string;
  horario_estimado: string | null;
  observaciones: string | null;
  cliente: {
    id_cliente: number;
    nombre_completo: string;
    ci: string | null;
  };
  sucursal: {
    id_sucursal: number;
    nombre: string;
    direccion: string;
    ciudad: string;
  };
  items: BranchReservationItem[];
  total_prendas: number;
  total_estimado: number;
  acciones_disponibles: ('preparar' | 'atender' | 'completar' | 'cancelar')[];
}

export interface BranchReservationsMetrics {
  pendientes: number;
  preparadas: number;
  atendidas: number;
  completadas: number;
  canceladas: number;
  total: number;
}

export interface BranchReservationsResponse {
  data: BranchReservation[];
  total: number;
  page: number;
  limit: number;
  metrics: BranchReservationsMetrics;
}

export interface QueryBranchReservationsParams {
  sucursalId?: number;
  estado?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateBranchReservationStatusPayload {
  nuevo_estado: BranchReservationStatus;
  motivo?: string;
}

export interface UpdateBranchReservationStatusResponse {
  success: boolean;
  mensaje: string;
  id_reserva: number;
  codigo: string;
  estado: BranchReservationStatus;
}
