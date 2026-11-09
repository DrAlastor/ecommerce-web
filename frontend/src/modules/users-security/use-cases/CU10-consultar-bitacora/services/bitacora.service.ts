/**
 * @caso-de-uso CU07 — Consultar bitácora
 * @subsistema Usuarios y Seguridad
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Administrador -> vista de bitácora -> controlador de auditoría -> servicio de bitácora -> Bitácora/Usuario.
 */
import api from '../../../../../services/api/api';

const API_URL = '/users-security/bitacora';

export interface BitacoraParams {
  page?: number;
  limit?: number;
  search?: string;
  id_usuario?: number;
}

export interface BitacoraItem {
  id_bitacora: number;
  accion: string;
  fecha_hora: string;
  entidad_afectada: string;
  ip: string | null;
  id_usuario: number;
  usuario: {
    email: string;
    nombre: string;
    rol: string;
  };
}

export interface BitacoraResponse {
  data: BitacoraItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const bitacoraService = {
  getLogs: async (params: BitacoraParams): Promise<BitacoraResponse> => {
    const { data } = await api.get(API_URL, {
      params,
    });
    return data;
  },
};
