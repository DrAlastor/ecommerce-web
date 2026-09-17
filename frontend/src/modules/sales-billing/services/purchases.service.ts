import api from '../../../services/api/api';
import type {
  PurchaseDetail,
  PurchaseFilterParams,
  PurchasesListResponse,
} from '../types/purchases.types';

export const purchasesService = {
  /**
   * Consulta el historial de compras del cliente
   */
  async getPurchases(params?: PurchaseFilterParams): Promise<PurchasesListResponse> {
    const response = await api.get<PurchasesListResponse>('/sales-billing/purchases', {
      params,
    });
    return response.data;
  },

  /**
   * Obtiene el detalle completo y comprobante de una compra específica
   */
  async getPurchaseById(idVenta: number): Promise<PurchaseDetail> {
    const response = await api.get<PurchaseDetail>(`/sales-billing/purchases/${idVenta}`);
    return response.data;
  },
};
