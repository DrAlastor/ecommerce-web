/**
 * @caso-de-uso CU18 — Consultar y cancelar reserva
 * @subsistema Reservas
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Cliente -> listado de reservas -> controlador de reservas -> servicio de cancelación -> Reserva/DetalleReserva/Inventario.
 */
import api from '../../../../../services/api/api';
import type {
  MyReservationListItem,
  CancelReservationPayload,
  CancelReservationResponse,
  ReservationReceipt,
} from '../types/my-reservations.types';

export const myReservationsService = {
  /**
   * Obtiene la lista de reservas del cliente autenticado.
   */
  getMyReservations: async (filtro?: 'activas' | 'historico' | string): Promise<MyReservationListItem[]> => {
    const tipo = filtro === 'historico' ? 'historicas' : (filtro || 'activas');
    const response = await api.get<MyReservationListItem[]>('/reservations/my-reservations', {
      params: { tipo, filtro },
    });
    return response.data;
  },

  /**
   * Cancela una reserva que se encuentre en estado susceptible de cancelación.
   */
  cancelReservation: async (
    id: number,
    payload?: CancelReservationPayload,
  ): Promise<CancelReservationResponse> => {
    const response = await api.patch<CancelReservationResponse>(
      `/reservations/${id}/cancel`,
      payload || {},
    );
    return response.data;
  },

  /**
   * Obtiene el comprobante completo de una reserva por ID.
   */
  getReservationReceipt: async (id: number): Promise<ReservationReceipt> => {
    const response = await api.get<ReservationReceipt>(`/reservations/${id}`);
    return response.data;
  },
};
