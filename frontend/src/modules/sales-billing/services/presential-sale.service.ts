import api from '../../../services/api/api';
import type {
  POSBranch,
  POSProduct,
  POSClientResult,
  CreatePresentialSalePayload,
  PaymentConfirmationResult,
  POSSaleHistoryItem,
} from '../types/presential-sale.types';

export const presentialSaleService = {
  /**
   * Obtiene la lista de sucursales habilitadas para el cajero
   */
  async getBranches(): Promise<POSBranch[]> {
    const response = await api.get<POSBranch[]>('/sales-billing/pos/branches');
    return response.data;
  },

  /**
   * Consulta productos con existencias locales en la sucursal seleccionada
   */
  async getProducts(params: {
    id_sucursal: number;
    search?: string;
    id_categoria?: number;
  }): Promise<POSProduct[]> {
    const response = await api.get<POSProduct[]>('/sales-billing/pos/products', {
      params,
    });
    return response.data;
  },

  /**
   * Búsqueda ágil de clientes por CI, NIT o nombre
   */
  async searchClients(search: string): Promise<POSClientResult[]> {
    const response = await api.get<POSClientResult[]>('/sales-billing/pos/clients', {
      params: { search },
    });
    return response.data;
  },

  /**
   * Registra una venta física en mostrador, procesa el cobro y emite la factura
   */
  async registerSale(
    payload: CreatePresentialSalePayload,
  ): Promise<PaymentConfirmationResult> {
    const response = await api.post<PaymentConfirmationResult>(
      '/sales-billing/pos/sales',
      payload,
    );
    return response.data;
  },

  /**
   * Consulta el historial de ventas registradas (físicas y digitales)
   */
  async getSalesHistory(params?: {
    id_sucursal?: number;
    search?: string;
    tipo_venta?: string;
    limit?: number;
  }): Promise<POSSaleHistoryItem[]> {
    const response = await api.get<POSSaleHistoryItem[]>('/sales-billing/pos/history', {
      params,
    });
    return response.data;
  },
};

