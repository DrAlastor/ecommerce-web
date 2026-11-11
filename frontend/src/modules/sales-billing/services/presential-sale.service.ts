import api from '../../../services/api/api';
import { offlineCatalog, offlineContext, offlinePending, sellOffline, syncOfflinePOS } from '../../../services/offline/offlinePOS';
import { readOfflinePreparation } from '../../../services/offline/offlineStorage';
import type {
  POSBranch,
  POSProduct,
  POSClientResult,
  CreatePresentialSalePayload,
  PaymentConfirmationResult,
  POSSaleHistoryItem,
} from '../types/presential-sale.types';

function preferredBranches(branches: POSBranch[]): POSBranch[] {
  const preferred = offlineContext().branch;
  return [...branches].sort((a, b) => Number(b.id_sucursal === preferred) - Number(a.id_sucursal === preferred));
}

export const presentialSaleService = {
  /**
   * Obtiene la lista de sucursales habilitadas para el cajero
   */
  async getBranches(): Promise<POSBranch[]> {
    if (!navigator.onLine) return preferredBranches((await offlineCatalog()).branches);
    try {
      const response = await api.get<POSBranch[]>('/sales-billing/pos/branches');
      return preferredBranches(response.data);
    } catch (error) {
      if (!(error as { response?: unknown }).response) return preferredBranches((await offlineCatalog()).branches);
      throw error;
    }
  },

  /**
   * Consulta productos con existencias locales en la sucursal seleccionada
   */
  async getProducts(params: {
    id_sucursal: number;
    search?: string;
    id_categoria?: number;
  }): Promise<POSProduct[]> {
    const prepared = await readOfflinePreparation(offlineContext(params.id_sucursal));
    if (!navigator.onLine || prepared && Date.parse(prepared.expiresAt) > Date.now()) {
      const data = await offlineCatalog(params.id_sucursal);
      return data.products.filter(p => (!params.id_categoria || p.id_categoria === params.id_categoria) && (!params.search || `${p.nombre} ${p.variantes.map(v => v.sku).join(' ')}`.toLowerCase().includes(params.search.toLowerCase())));
    }
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
    quotedTotal?: number,
  ): Promise<PaymentConfirmationResult> {
    const prepared = await readOfflinePreparation(offlineContext(payload.id_sucursal));
    if (payload.metodo_pago === 'efectivo' && (!prepared || prepared.catalogOnly || prepared.closed)) throw new Error('Abre el turno de caja antes de cobrar en efectivo. La preparación offline es automática.');
    if (!navigator.onLine || prepared && payload.metodo_pago === 'efectivo') {
      const temporary = await sellOffline(payload, quotedTotal);
      if (navigator.onLine) {
        await syncOfflinePOS(payload.id_sucursal).catch(() => {});
        const sale = (await offlinePending(payload.id_sucursal)).find(item => item.id === temporary.pago.transaccion);
        if (sale?.status === 'CONFIRMED') return sale.result as PaymentConfirmationResult;
      }
      return temporary;
    }
    const response = await api.post<PaymentConfirmationResult>(
      '/sales-billing/pos/sales',
      payload,
    );
    return response.data;
  },

  /**
   * Genera una sesión de cobro oficial con Stripe para mostrador/POS
   */
  async createStripePOSSession(data: { total: number; sucursalNombre?: string; clienteNombre?: string }): Promise<{ url: string; sessionId: string; amount: number }> {
    const response = await api.post<{ url: string; sessionId: string; amount: number }>(
      '/sales-billing/pos/stripe-session',
      data,
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

