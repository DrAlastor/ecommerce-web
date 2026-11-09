/**
 * @caso-de-uso CU14 — Consultar sucursales
 * @subsistema Sucursales e Inventario
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Cliente -> listado de sucursales -> controlador de consulta -> servicio de sucursales -> Ciudad/Sucursal/Disponibilidad.
 */
import api from '../../../../../services/api/api';
import type { Branch } from '../types/branch.types';

export const branchService = {
  async getBranches(): Promise<Branch[]> {
    try {
      const response = await api.get('/branches');
      return response.data;
    } catch {
      return [];
    }
  },
};
