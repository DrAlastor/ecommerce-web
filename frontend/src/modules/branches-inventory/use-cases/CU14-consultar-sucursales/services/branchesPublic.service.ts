import api from '../../../../../services/api/api';
import type {
  PublicBranch,
  PublicCity,
  BranchQueryParams,
} from '../types/branchesPublic.types';

const baseUrl = '/branches-inventory/public';

export const branchesPublicService = {
  /**
   * Obtiene la lista de sucursales activas, con soporte para filtrado por ciudad o búsqueda
   */
  async getActiveBranches(params?: BranchQueryParams): Promise<PublicBranch[]> {
    const res = await api.get<PublicBranch[]>(`${baseUrl}/branches`, {
      params: {
        id_ciudad: params?.id_ciudad || undefined,
        search: params?.search?.trim() || undefined,
      },
    });
    return res.data;
  },

  /**
   * Obtiene el detalle de una sucursal específica
   */
  async getBranchDetail(id: number): Promise<PublicBranch> {
    const res = await api.get<PublicBranch>(`${baseUrl}/branches/${id}`);
    return res.data;
  },

  /**
   * Obtiene la lista de ciudades con sucursales activas
   */
  async getActiveCities(): Promise<PublicCity[]> {
    const res = await api.get<PublicCity[]>(`${baseUrl}/cities`);
    return res.data;
  },
};
