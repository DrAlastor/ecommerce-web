import api from '../../../services/api/api';
import type {
  ProcessPaymentPayload,
  PaymentConfirmationResult,
  PendingSale,
} from '../types/payment-billing.types';

export const paymentBillingService = {
  /**
   * Procesa el cobro y emite la factura de una venta
   */
  async processPayment(payload: ProcessPaymentPayload): Promise<PaymentConfirmationResult> {
    const response = await api.post<PaymentConfirmationResult>(
      '/sales-billing/payments/process',
      payload,
    );
    return response.data;
  },

  /**
   * Consulta las ventas pendientes de cobro
   */
  async getPendingSales(): Promise<PendingSale[]> {
    const response = await api.get<PendingSale[]>('/sales-billing/payments/pending');
    return response.data;
  },

  /**
   * Obtiene la factura fiscal de una venta
   */
  async getInvoice(idVenta: number): Promise<any> {
    const response = await api.get(`/sales-billing/payments/invoice/${idVenta}`);
    return response.data;
  },
};
