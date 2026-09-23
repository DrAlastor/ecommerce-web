/**
 * @caso-de-uso CU17 — Realizar reserva de prendas
 * @subsistema Reservas
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Cliente -> formulario de reserva -> controlador de reservas -> servicio de disponibilidad -> Reserva/DetalleReserva/Inventario/Sucursal.
 */
import api from '../../../../../services/api/api';
import type {
  VariantAvailabilityResponse,
  CreateReservationPayload,
  ReservationReceipt,
} from '../types/reservation.types';

export const reservationService = {
  /**
   * Consulta las sucursales disponibles y su stock para una variante específica.
   */
  getBranchAvailability: async (variantId: number): Promise<VariantAvailabilityResponse> => {
    const response = await api.get<VariantAvailabilityResponse>(
      `/reservations/branch-availability/${variantId}`,
    );
    return response.data;
  },

  /**
   * Crea una nueva reserva para el cliente autenticado.
   */
  createReservation: async (
    payload: CreateReservationPayload,
  ): Promise<ReservationReceipt> => {
    const response = await api.post<ReservationReceipt>('/reservations', payload);
    return response.data;
  },

  /**
   * Obtiene el comprobante detallado de una reserva por su ID.
   */
  getReservationReceipt: async (id: number): Promise<ReservationReceipt> => {
    const response = await api.get<ReservationReceipt>(`/reservations/${id}`);
    return response.data;
  },

  /**
   * Consulta el comprobante por código de reserva.
   */
  getReservationByCode: async (code: string): Promise<ReservationReceipt> => {
    const response = await api.get<ReservationReceipt>(`/reservations/code/${code}`);
    return response.data;
  },
};
