/** Persistencia transaccional. El contexto nunca se obtiene de una tienda por defecto. */
export interface OfflineContext {
  tenant: string;
  user: number;
  branch: number;
  terminal: string;
}
export interface OfflineSale {
  preparationId: string;
  sessionId?: string;
  customer?: { id?: number; ci?: string; name?: string; nit?: string; businessName?: string; phone?: string };
  id: string;
  context: OfflineContext;
  createdAt: string;
  items: { variant: number; quantity: number; priceMinor: number }[];
  receivedMinor: number;
  status: 'PENDING' | 'CONFIRMED' | 'REVIEW';
  result?: unknown;
  receipt?: import('../../modules/sales-billing/types/payment-billing.types').PaymentConfirmationResult;
}
interface Stock { key: string; quantity: number }
export interface OfflinePreparation {
  id: string;
  sessionId?: string;
  initialMinor?: number;
  catalogOnly?: boolean;
  closed?: boolean;
  products: import('../../modules/sales-billing/types/presential-sale.types').POSProduct[];
  branches: import('../../modules/sales-billing/types/presential-sale.types').POSBranch[];
  context: OfflineContext;
  version: string;
  expiresAt: string;
  variants: { variant: number; quantity: number; priceMinor: number }[];
}

export async function expireOfflinePreparation(context: OfflineContext): Promise<void> {
  const key = scope(context);
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('preparation', 'readwrite');
      const store = tx.objectStore('preparation');
      const request = store.get(key);
      request.onsuccess = () => { if (request.result) store.put({ ...request.result, closed: true, expiresAt: '1970-01-01T00:00:00.000Z' }); };
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export async function readOfflinePreparation(context: OfflineContext): Promise<OfflinePreparation | undefined> {
  const key = scope(context);
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(['preparation', 'stock'], 'readonly');
      const request = tx.objectStore('preparation').get(key);
      let data: OfflinePreparation | undefined;
      const resolveStock = (preparation: OfflinePreparation | undefined) => {
        data = preparation;
        if (data) for (const product of data.products) for (const variant of product.variantes) {
          const stock = tx.objectStore('stock').get(`${key}:${variant.id_producto_variante}`);
          stock.onsuccess = () => { variant.stock_disponible = stock.result?.quantity ?? 0; };
        }
      };
      request.onsuccess = () => {
        const authorized = request.result as OfflinePreparation | undefined;
        if (authorized && !authorized.closed && Date.parse(authorized.expiresAt) !== 0) { resolveStock(authorized); return; }
        const catalog = tx.objectStore('preparation').get(`catalog:${key}`);
        catalog.onsuccess = () => resolveStock(catalog.result ?? authorized);
      };
      tx.oncomplete = () => resolve(data);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

function scope(context: OfflineContext): string {
  if (!context.tenant || !context.terminal || !Number.isSafeInteger(context.user) || context.user <= 0 || !Number.isSafeInteger(context.branch) || context.branch <= 0) {
    throw new Error('Contexto offline inválido');
  }
  return JSON.stringify([context.tenant, context.user, context.branch, context.terminal]);
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DresslyOffline', 3);
    request.onupgradeneeded = () => {
      for (const name of ['sales', 'stock', 'preparation', 'cashCounts']) {
        if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: name === 'sales' ? 'id' : 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Cierra otras pestañas para actualizar el almacenamiento offline'));
  });
}

/** Arqueo provisional: conserva evidencia local y nunca afirma un cierre central. */
export async function saveOfflineCashCount(context: OfflineContext, initialMinor: number, countedMinor: number): Promise<void> {
  const key = scope(context);
  if (![initialMinor, countedMinor].every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error('Importes de arqueo inválidos');
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sales', 'cashCounts', 'preparation'], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      const prepared = tx.objectStore('preparation').get(key);
      prepared.onsuccess = () => {
        const preparation = prepared.result as OfflinePreparation | undefined;
        if (!preparation?.sessionId) { tx.abort(); return; }
        const request = tx.objectStore('sales').getAll();
        request.onsuccess = () => {
          const sales = (request.result as OfflineSale[]).filter(sale => scope(sale.context) === key && sale.sessionId === preparation.sessionId);
          const opening = preparation.initialMinor ?? initialMinor;
          const expectedMinor = opening + sales.reduce((sum, sale) => sum + sale.items.reduce((total, item) => total + item.quantity * item.priceMinor, 0), 0);
          tx.objectStore('cashCounts').add({ key: crypto.randomUUID(), sessionId: preparation.sessionId, context, createdAt: new Date().toISOString(), initialMinor: opening, countedMinor, expectedMinor, differenceMinor: countedMinor - expectedMinor, saleIds: sales.map(sale => sale.id), provisional: true });
        };
      };
    });
  } finally { db.close(); }
}

/** Se confirma al terminar la transacción, nunca al recibir el primer request exitoso. */
export async function recordOfflineSale(sale: OfflineSale): Promise<void> {
  const prefix = scope(sale.context);
  if (!sale.id || sale.status !== 'PENDING' || !sale.items.length) throw new Error('Venta offline inválida');
  let total = 0;
  const quantities = new Map<number, number>();
  for (const item of sale.items) {
    if (!Number.isSafeInteger(item.variant) || item.variant <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || !Number.isSafeInteger(item.priceMinor) || item.priceMinor < 0) throw new Error('Detalle offline inválido');
    total += item.quantity * item.priceMinor;
    quantities.set(item.variant, (quantities.get(item.variant) ?? 0) + item.quantity);
  }
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(sale.receivedMinor) || sale.receivedMinor < total) throw new Error('Efectivo insuficiente o importe inválido');
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sales', 'stock', 'preparation'], 'readwrite');
      let failure: Error | undefined;
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(failure ?? tx.error ?? new Error('No se guardó la venta'));
      const preparation = tx.objectStore('preparation').get(prefix);
      preparation.onsuccess = () => {
        const data = preparation.result as (OfflinePreparation & { key: string }) | undefined;
        if (!data || data.catalogOnly || data.closed || data.id !== sale.preparationId || Date.parse(data.expiresAt) <= Date.now() || sale.items.some(item => !data.variants.some(variant => variant.variant === item.variant && variant.priceMinor === item.priceMinor))) {
          failure = new Error('Preparación vencida o precios no autorizados');
          tx.abort();
        }
      };
      tx.objectStore('sales').add(sale);
      for (const [variant, quantity] of quantities) {
        const key = `${prefix}:${variant}`;
        const stock = tx.objectStore('stock');
        const request = stock.get(key);
        request.onsuccess = () => {
          const existing = request.result as Stock | undefined;
          if (!existing || existing.quantity < quantity) {
            failure = new Error('Stock local insuficiente o terminal sin preparar');
            tx.abort();
            return;
          }
          stock.put({ key, quantity: existing.quantity - quantity });
        };
      }
    });
  } finally { db.close(); }
}

/** No reemplaza existencias mientras haya ventas por conciliar. */
export async function prepareOfflineStorage(preparation: OfflinePreparation): Promise<void> {
  const key = scope(preparation.context);
  if (!preparation.version || !Number.isFinite(Date.parse(preparation.expiresAt)) || Date.parse(preparation.expiresAt) <= Date.now() || new Set(preparation.variants.map(v => v.variant)).size !== preparation.variants.length || preparation.variants.some(v => !Number.isSafeInteger(v.variant) || v.variant <= 0 || !Number.isSafeInteger(v.quantity) || v.quantity < 0 || !Number.isSafeInteger(v.priceMinor) || v.priceMinor < 0)) throw new Error('Preparación inválida');
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sales', 'stock', 'preparation'], 'readwrite');
      let failure: Error | undefined;
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(failure ?? tx.error);
      const request = tx.objectStore('sales').getAll();
      request.onsuccess = () => {
        if ((request.result as OfflineSale[]).some(s => scope(s.context) === key && s.status !== 'CONFIRMED')) {
          failure = new Error('Sincroniza y concilia las ventas antes de preparar de nuevo');
          tx.abort();
          return;
        }
        const existing = tx.objectStore('preparation').get(key);
        existing.onsuccess = () => {
          const current = existing.result as OfflinePreparation | undefined;
          if (preparation.catalogOnly && current?.sessionId && !current.catalogOnly && !current.closed && Date.parse(current.expiresAt) !== 0) return;
          // Una pestaña anterior no debe confundir el catálogo automático con autorización de cobro.
          const target = preparation.catalogOnly ? `catalog:${key}` : key;
          tx.objectStore('preparation').put({ ...preparation, key: target });
          if (!preparation.catalogOnly) tx.objectStore('preparation').delete(`catalog:${key}`);
          for (const variant of preparation.variants) tx.objectStore('stock').put({ key: `${key}:${variant.variant}`, quantity: variant.quantity });
        };
      };
    });
  } finally { db.close(); }
}

export async function acknowledgeOfflineSale(context: OfflineContext, id: string, status: 'CONFIRMED' | 'REVIEW', result: unknown): Promise<void> {
  const key = scope(context);
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sales', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? new Error('Operación inexistente o contexto incorrecto'));
      const store = tx.objectStore('sales');
      const request = store.get(id);
      request.onsuccess = () => {
        const sale = request.result as OfflineSale | undefined;
        if (!sale || scope(sale.context) !== key || sale.status === 'CONFIRMED') { tx.abort(); return; }
        store.put({ ...sale, status, result });
      };
    });
  } finally { db.close(); }
}

export async function listOfflineSales(context: OfflineContext): Promise<OfflineSale[]> {
  const prefix = scope(context);
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('sales', 'readonly');
      const request = tx.objectStore('sales').getAll();
      tx.oncomplete = () => resolve((request.result as OfflineSale[]).filter(sale => scope(sale.context) === prefix));
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export async function listTerminalSales(context: OfflineContext): Promise<OfflineSale[]> {
  scope(context);
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('sales', 'readonly');
      const request = tx.objectStore('sales').getAll();
      tx.oncomplete = () => resolve((request.result as OfflineSale[]).filter(sale => sale.context.tenant === context.tenant && sale.context.terminal === context.terminal));
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
