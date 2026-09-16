import api from '../../../../../services/api/api';
import type {
  StaffBranch,
  BranchReservationsResponse,
  QueryBranchReservationsParams,
  UpdateBranchReservationStatusPayload,
  UpdateBranchReservationStatusResponse,
} from '../types/branch-reservations.types';

export const branchReservationsService = {
  /**
   * Obtiene la lista de sucursales a las que el empleado o admin tiene acceso
   */
  getMyBranches: async (): Promise<StaffBranch[]> => {
    const response = await api.get<StaffBranch[]>('/reservations/branch/my-branches');
    return response.data;
  },

  /**
   * Consulta el listado paginado de reservas de la sucursal con métricas
   */
  getBranchReservations: async (
    params?: QueryBranchReservationsParams,
  ): Promise<BranchReservationsResponse> => {
    const response = await api.get<BranchReservationsResponse>('/reservations/branch/list', {
      params,
    });
    return response.data;
  },

  /**
   * Actualiza el estado de una reserva en sucursal (Preparada, Atendida, Completada, Cancelada)
   */
  updateReservationStatus: async (
    id: number,
    payload: UpdateBranchReservationStatusPayload,
  ): Promise<UpdateBranchReservationStatusResponse> => {
    const response = await api.patch<UpdateBranchReservationStatusResponse>(
      `/reservations/branch/${id}/status`,
      payload,
    );
    return response.data;
  },
};
