/**
 * @caso-de-uso CU13 — Gestionar ciudades y sucursales
 * @subsistema Sucursales e Inventario
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Administrador -> vista de sucursales -> controlador geográfico -> servicio de sucursales -> Ciudad/Sucursal.
 */
import api from '../../../../../services/api/api';
import type {
  Branch,
  BranchDetail,
  BranchesMetadata,
  City,
  CreateBranchPayload,
  CreateCityPayload,
  PaginationMeta,
  UpdateBranchPayload,
  UpdateCityPayload,
} from '../types/branchesAdmin.types';

const baseUrl = '/branches-inventory/admin';

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export const branchesAdminService = {
  // --- METADATA ---
  async getMetadata(): Promise<BranchesMetadata> {
    const res = await api.get<BranchesMetadata>(`${baseUrl}/branches/metadata`);
    return res.data;
  },

  // --- SUCURSALES ---
  async getBranches(params?: {
    search?: string;
    id_ciudad?: number;
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Branch>> {
    const res = await api.get<PaginatedResult<Branch>>(`${baseUrl}/branches`, {
      params,
    });
    return res.data;
  },

  async getBranchById(id: number): Promise<BranchDetail> {
    const res = await api.get<BranchDetail>(`${baseUrl}/branches/${id}`);
    return res.data;
  },

  async createBranch(
    payload: CreateBranchPayload,
  ): Promise<{ message: string; data: Branch }> {
    const res = await api.post<{ message: string; data: Branch }>(
      `${baseUrl}/branches`,
      payload,
    );
    return res.data;
  },

  async updateBranch(
    id: number,
    payload: UpdateBranchPayload,
  ): Promise<{ message: string; data: Branch }> {
    const res = await api.put<{ message: string; data: Branch }>(
      `${baseUrl}/branches/${id}`,
      payload,
    );
    return res.data;
  },

  async updateBranchStatus(
    id: number,
    estado: 'activo' | 'inactivo',
  ): Promise<{ message: string; data: Branch }> {
    const res = await api.patch<{ message: string; data: Branch }>(
      `${baseUrl}/branches/${id}/status`,
      { estado },
    );
    return res.data;
  },

  async deleteBranch(id: number): Promise<{ message: string }> {
    const res = await api.delete<{ message: string }>(`${baseUrl}/branches/${id}`);
    return res.data;
  },

  // --- CIUDADES ---
  async getCities(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<City>> {
    const res = await api.get<PaginatedResult<City>>(`${baseUrl}/cities`, {
      params,
    });
    return res.data;
  },

  async getCitiesSimple(): Promise<City[]> {
    const res = await api.get<City[]>(`${baseUrl}/cities/simple`);
    return res.data;
  },

  async getCityById(
    id: number,
  ): Promise<City & { sucursales: Branch[] }> {
    const res = await api.get<City & { sucursales: Branch[] }>(
      `${baseUrl}/cities/${id}`,
    );
    return res.data;
  },

  async createCity(
    payload: CreateCityPayload,
  ): Promise<{ message: string; data: City }> {
    const res = await api.post<{ message: string; data: City }>(
      `${baseUrl}/cities`,
      payload,
    );
    return res.data;
  },

  async updateCity(
    id: number,
    payload: UpdateCityPayload,
  ): Promise<{ message: string; data: City }> {
    const res = await api.put<{ message: string; data: City }>(
      `${baseUrl}/cities/${id}`,
      payload,
    );
    return res.data;
  },

  async deleteCity(id: number): Promise<{ message: string }> {
    const res = await api.delete<{ message: string }>(`${baseUrl}/cities/${id}`);
    return res.data;
  },
};
