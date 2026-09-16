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
    const response = await api.get<MyReservationListItem[]>('/reservations/my-reservations', {
      params: { filtro },
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
