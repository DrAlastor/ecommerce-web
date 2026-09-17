import api from '../../../services/api/api';
import type {
  OrderReceipt,
  PaymentIntentResponse,
  ProcessPurchasePayload,
} from '../types/checkout.types';

export const checkoutService = {
  /**
   * Crea un PaymentIntent de Stripe o simula sesión de pago para el monto del carrito
   */
  async createPaymentIntent(): Promise<PaymentIntentResponse> {
    const response = await api.post<PaymentIntentResponse>(
      '/sales-billing/checkout/payment-intent',
    );
    return response.data;
  },

  /**
   * Procesa la compra digital de forma atómica en backend
   */
  async processPurchase(payload: ProcessPurchasePayload): Promise<OrderReceipt> {
    const response = await api.post<OrderReceipt>(
      '/sales-billing/checkout/process',
      payload,
    );
    return response.data;
  },

  /**
   * Consulta el comprobante / recibo oficial de una venta
   */
  async getReceipt(idVenta: number): Promise<OrderReceipt> {
    const response = await api.get<OrderReceipt>(
      `/sales-billing/checkout/receipt/${idVenta}`,
    );
    return response.data;
  },

  /**
   * Obtiene las sucursales disponibles para retiro en tienda
   */
  async getBranches() {
    try {
      const res = await api.get('/branches-inventory/public/branches');
      return res.data;
    } catch {
      return [];
    }
  },

  /**
   * Obtiene las ciudades disponibles
   */
  async getCities() {
    try {
      const res = await api.get('/branches-inventory/public/cities');
      return res.data;
    } catch {
      return [
        { id_ciudad: 1, nombre: 'Santa Cruz de la Sierra' },
        { id_ciudad: 2, nombre: 'La Paz' },
        { id_ciudad: 3, nombre: 'Cochabamba' },
        { id_ciudad: 4, nombre: 'Sucre' },
      ];
    }
  },
};
