import { acknowledgeOfflineSale, listOfflineSales } from './offlineStorage';
import type { OfflineContext, OfflineSale } from './offlineStorage';

export interface OfflineSyncResult {
  id: string;
  status: 'CONFIRMED' | 'REVIEW';
  result: unknown;
}

/** El servidor conserva la garantía idempotente incluso entre pestañas o dispositivos. */
export async function syncOfflineSales(
  context: OfflineContext,
  send: (sale: OfflineSale) => Promise<OfflineSyncResult>,
): Promise<{ confirmed: number; review: number; pending: number }> {
  const summary = { confirmed: 0, review: 0, pending: 0 };
  const sales = (await listOfflineSales(context)).filter(s => s.status !== 'CONFIRMED');
  for (const sale of sales) {
    try {
      const response = await send(sale);
      if (response.id !== sale.id || !['CONFIRMED', 'REVIEW'].includes(response.status)) throw new Error('Confirmación inválida');
      await acknowledgeOfflineSale(context, sale.id, response.status, response.result);
      if (response.status === 'CONFIRMED') summary.confirmed++;
      else summary.review++;
    } catch {
      // Incluye respuesta perdida: conservar el mismo UUID para el siguiente intento.
      summary.pending++;
    }
  }
  return summary;
}
