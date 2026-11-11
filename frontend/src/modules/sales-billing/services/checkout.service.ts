import api from '../../../services/api/api';
import type {
  OrderReceipt,
  PaymentIntentResponse,
  ProcessPurchasePayload,
} from '../types/checkout.types';

export const checkoutService = {
  async getBankQr(): Promise<string> {
    const tenant = localStorage.getItem('tenantKey') || 'dressly';
    const res = await api.get('/users-security/company/public/' + encodeURIComponent(tenant));
    return res.data.qr_imagen_url || '';
  },
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
   * Crea una sesión oficial de Stripe Checkout con redirección a Stripe
   */
  async createStripeCheckoutSession(dto: any): Promise<{ url: string; sessionId: string; amount: number }> {
    const response = await api.post<{ url: string; sessionId: string; amount: number }>(
      '/sales-billing/checkout/create-stripe-session',
      dto,
    );
    return response.data;
  },

  /**
   * Confirma la sesión de Stripe una vez el cliente regresa de Stripe Checkout
   */
  async confirmStripeCheckoutSession(sessionId: string): Promise<OrderReceipt> {
    const response = await api.post<OrderReceipt>(
      '/sales-billing/checkout/confirm-stripe-session',
      { sessionId },
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
