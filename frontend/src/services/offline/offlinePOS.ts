import axios from 'axios';
import { expireOfflinePreparation, listOfflineSales, listTerminalSales, prepareOfflineStorage, readOfflinePreparation, recordOfflineSale } from './offlineStorage';
import type { OfflineContext, OfflineSale } from './offlineStorage';
import { syncOfflineSales } from './syncEngine';
import { automaticPreparationAction } from './autoPreparation';
import type { OfflinePreparation } from './offlineStorage';
import type { CreatePresentialSalePayload, PaymentConfirmationResult } from '../../modules/sales-billing/types/presential-sale.types';

function identity() {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Inicia sesión para acceder a tus operaciones offline');
  const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const claims = JSON.parse(atob(encoded));
  if (!claims.tenant || !claims.sub) throw new Error('Sesión sin contexto de tienda');
  return { token, tenant: claims.tenant as string, user: Number(claims.sub) };
}
export function offlineContext(branch?: number): OfflineContext {
  const user = identity();
  let terminal = localStorage.getItem('offlineTerminal');
  if (!terminal) { terminal = crypto.randomUUID(); localStorage.setItem('offlineTerminal', terminal); }
  return { tenant: user.tenant, user: user.user, branch: branch ?? Number(localStorage.getItem(`offlineBranch:${user.tenant}:${user.user}`)), terminal };
}
function client() {
  const user = identity();
  // Nunca usar el fallback automático a otro servidor para operaciones offline.
  return axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 30000, headers: { Authorization: `Bearer ${user.token}`, 'x-tenant-id': user.tenant } });
}
export async function prepareOfflinePOS(branch: number, initialMinor = 0, catalogOnly = false) {
  if (import.meta.env.PROD && !navigator.serviceWorker?.controller) throw new Error('Espera a que la aplicación se prepare y recarga esta página antes de habilitar ventas sin conexión');
  const context = offlineContext(branch);
  const { data } = catalogOnly
    ? await client().get('/sales-billing/pos/offline/catalog', { params: { branch, terminal: context.terminal } })
    : await client().post('/sales-billing/pos/offline/prepare', { branch, terminal: context.terminal, initialMinor });
  await prepareOfflineStorage({ id: data.id, sessionId: data.sessionId, initialMinor: data.initialMinor, catalogOnly: data.catalogOnly === true, context, version: String(data.version), expiresAt: data.expiresAt, products: data.products, branches: data.branches, variants: data.products.flatMap((p: any) => p.variantes.map((v: any) => ({ variant: v.id_producto_variante, quantity: v.stock_disponible, priceMinor: Math.round(v.precio_final * 100) }))) });
  localStorage.setItem(`offlineBranch:${context.tenant}:${context.user}`, String(branch));
  if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false);
  window.dispatchEvent(new CustomEvent('offline-pos-prepared', { detail: { branch } }));
}

export interface AutomaticPOSState { status: 'ready' | 'catalog' | 'waiting' | 'unavailable' | 'blocked'; preparation?: OfflinePreparation }
const automaticRuns = new Map<string, Promise<AutomaticPOSState>>();
export function ensureOfflinePOS(branch: number): Promise<AutomaticPOSState> {
  const context = offlineContext(branch);
  const key = JSON.stringify(context);
  const active = automaticRuns.get(key);
  if (active) return active;
  const run = (async (): Promise<AutomaticPOSState> => {
    const preparation = await readOfflinePreparation(context);
    const pending = (await listOfflineSales(context)).filter(sale => sale.status !== 'CONFIRMED');
    const action = automaticPreparationAction(preparation, pending.length);
    if (action === 'reuse') return { status: preparation?.catalogOnly ? 'catalog' : 'ready', preparation };
    if (!navigator.onLine) return { status: 'unavailable', preparation };
    if (import.meta.env.PROD && !navigator.serviceWorker?.controller) return { status: 'waiting', preparation };
    if (action === 'blocked') return { status: 'blocked', preparation };
    await prepareOfflinePOS(branch, preparation?.initialMinor ?? 0, action === 'catalog');
    const saved = await readOfflinePreparation(context);
    return { status: saved?.catalogOnly ? 'catalog' : 'ready', preparation: saved };
  })();
  automaticRuns.set(key, run);
  void run.finally(() => { if (automaticRuns.get(key) === run) automaticRuns.delete(key); }).catch(() => {});
  return run;
}
export async function offlineCatalog(branch?: number) {
  const preparation = await readOfflinePreparation(offlineContext(branch));
  if (!preparation) throw new Error('Prepara esta terminal con conexión antes de vender offline');
  return preparation;
}
export async function syncOfflinePOS(branch?: number) {
  return syncOfflineSales(offlineContext(branch), async sale => {
    const { data } = await client().post('/sales-billing/pos/offline/sync', sale);
    return data;
  });
}
export async function offlinePending(branch?: number) { return listOfflineSales(offlineContext(branch)); }
export async function closeOfflineCash(branch: number, countedMinor: number) {
  const preparation = await offlineCatalog(branch);
  if (!preparation.sessionId) throw new Error('Prepara un turno con la versión actual antes de cerrarlo');
  const sales = (await offlinePending(branch)).filter(sale => sale.sessionId === preparation.sessionId);
  if (sales.some(sale => sale.status !== 'CONFIRMED')) throw new Error('Sincroniza y resuelve las ventas pendientes antes de cerrar');
  const { data } = await client().post(`/sales-billing/pos/offline/cash/${preparation.sessionId}/close`, { countedMinor, operationIds: sales.map(sale => sale.id) });
  await expireOfflinePreparation(preparation.context);
  return data;
}
export async function offlineIncidents() { return (await client().get('/sales-billing/pos/offline/incidents')).data; }
export async function administrativeTerminalBackup(branch: number) {
  await offlineIncidents(); // El servidor verifica el rol antes de exponer otras colas locales de la tienda.
  return listTerminalSales(offlineContext(branch));
}
export async function resolveOfflineIncident(id: string, note: string) { return (await client().post(`/sales-billing/pos/offline/operations/${id}/resolve`, { note })).data; }
export async function recoverOfflineOperation(operation: unknown, note: string) { return (await client().post('/sales-billing/pos/offline/recover', { operation, note })).data; }
export async function closeRecoveredOfflineCash(session: string, countedMinor: number, note: string) {
  const { data } = await client().get(`/sales-billing/pos/offline/cash/${session}`);
  return (await client().post(`/sales-billing/pos/offline/cash/${session}/close`, { countedMinor, operationIds: data.operationIds, note })).data;
}

export async function sellOffline(payload: CreatePresentialSalePayload, quotedTotal?: number): Promise<PaymentConfirmationResult> {
  if (payload.metodo_pago !== 'efectivo') throw new Error('Sin conexión solo se admiten ventas presenciales en efectivo');
  const preparation = await offlineCatalog(payload.id_sucursal);
  if (preparation.catalogOnly || preparation.closed) throw new Error('Abre el turno de caja con conexión antes de cobrar. Los datos offline ya se preparan automáticamente.');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const receiptItems = payload.items.map(item => {
    const product = preparation.products.find(p => p.variantes.some(v => v.id_producto_variante === item.id_producto_variante));
    const variant = product?.variantes.find(v => v.id_producto_variante === item.id_producto_variante);
    if (!product || !variant) throw new Error('Producto no preparado para venta offline');
    return { id_detalle_venta: 0, id_producto: product.id_producto, nombre_producto: product.nombre, sku: variant.sku, talla: variant.talla, color: variant.color, imagen: product.imagen, cantidad: item.cantidad, precio_unitario: variant.precio_final, subtotal: Math.round(variant.precio_final * 100) * item.cantidad / 100 };
  });
  const total = receiptItems.reduce((sum, i) => sum + Math.round(i.subtotal * 100), 0) / 100;
  if (quotedTotal !== undefined && Math.round(quotedTotal * 100) !== Math.round(total * 100)) throw new Error('Los precios cambiaron. Cierra el cobro y vuelve a agregar las prendas antes de confirmar.');
  const received = payload.monto_recibido ?? total;
  const sale: OfflineSale = { id, preparationId: preparation.id, sessionId: preparation.sessionId, context: preparation.context, createdAt: now, status: 'PENDING', receivedMinor: Math.round(received * 100), items: payload.items.map((item, index) => ({ variant: item.id_producto_variante, quantity: item.cantidad, priceMinor: Math.round(receiptItems[index].precio_unitario * 100) })) };
  sale.customer = { id: payload.id_cliente, ci: payload.cliente_ci, name: payload.cliente_nombre, nit: payload.nit_factura, businessName: payload.razon_social_factura, phone: payload.cliente_telefono };
  const receipt: PaymentConfirmationResult = { success: true, mensaje: 'Registrado localmente. Pendiente de sincronización.', id_venta: 0, codigo_factura: `OFFLINE-${id}`, estado_venta: 'PENDIENTE_SINCRONIZACION', fecha: now, cliente: { nombre_completo: payload.cliente_nombre || 'Cliente Mostrador', nit_ci: payload.cliente_ci || '0' }, pago: { metodo_pago: 'efectivo', monto_pagado: total, monto_recibido: received, cambio: Math.round((received - total) * 100) / 100, transaccion: id, fecha_pago: now }, liquidacion: { subtotal: total, descuento: 0, total }, factura: { numero_factura: '', numero_autorizacion: '', codigo_control: '', leyenda: 'COMPROBANTE PROVISIONAL — Pendiente de sincronización' }, items: receiptItems };
  receipt.cliente.nombre_completo = payload.razon_social_factura || payload.cliente_nombre || 'Cliente Mostrador';
  receipt.cliente.nit_ci = payload.nit_factura || payload.cliente_ci || '0';
  sale.receipt = receipt;
  await recordOfflineSale(sale);
  window.dispatchEvent(new Event('offline-sales-changed'));
  return receipt;
}
