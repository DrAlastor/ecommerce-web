/**
 * @caso-de-uso Módulo heredado — Gestión de devoluciones
 * @subsistema Ventas, Pagos y Compras
 * @capa Service/Gateway — Frontend web
 * @responsabilidad Encapsula la comunicación con la API o integración externa y transforma su respuesta para la capa de presentación.
 * @secuencia Usuario autorizado -> vista de devoluciones -> controlador -> servicio de devoluciones -> Devolución/DetalleDevolución/Venta/Inventario.
 * Nota: módulo heredado; su numeración no corresponde al catálogo oficial de CU del informe.
 */
import api from '../../../../../services/api/api';
import type {
  CreateReturnPayload,
  ReturnRecord,
  ReturnsListResponse,
  UpdateReturnStatusPayload,
} from '../types/returns.types';

export const returnsApi = {
  /**
   * Crea una solicitud de devolución o registra una devolución en tienda
   */
  async createReturn(payload: CreateReturnPayload): Promise<{ message: string; data: any }> {
    const response = await api.post('/sales-billing/returns', payload);
    return response.data;
  },

  /**
   * Obtiene las solicitudes de devolución del cliente autenticado
   */
  async getMyReturns(): Promise<ReturnRecord[]> {
    const response = await api.get<ReturnRecord[]>('/sales-billing/returns/my-returns');
    return response.data;
  },

  /**
   * Obtiene la lista completa de devoluciones para Staff / Administradores
   */
  async getAllReturns(params?: {
    estado?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ReturnsListResponse> {
    const response = await api.get<ReturnsListResponse>('/sales-billing/returns', { params });
    return response.data;
  },

  /**
   * Obtiene el detalle de una devolución por su ID
   */
  async getReturnById(id: number): Promise<ReturnRecord> {
    const response = await api.get<ReturnRecord>(`/sales-billing/returns/${id}`);
    return response.data;
  },

  /**
   * Actualiza el estado de una devolución (Aprobar / Rechazar)
   */
  async updateReturnStatus(
    id: number,
    payload: UpdateReturnStatusPayload,
  ): Promise<{ message: string; data: any }> {
    const response = await api.patch(`/sales-billing/returns/${id}/status`, payload);
    return response.data;
  },

  /**
   * Busca ventas y sucursales disponibles para registrar una devolución presencial en tienda
   */
  async lookupSale(term: string): Promise<import('../types/returns.types').SaleLookupResponse> {
    const response = await api.get(`/sales-billing/returns/lookup-sale/${encodeURIComponent(term)}`);
    return response.data;
  },
};

