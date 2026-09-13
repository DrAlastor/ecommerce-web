import axios from 'axios';

const API_URL = '/api/users-security/bitacora';

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
    const token = localStorage.getItem('accessToken');
    const { data } = await axios.get(API_URL, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
};
