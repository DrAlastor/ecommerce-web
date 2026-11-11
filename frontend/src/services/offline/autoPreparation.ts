import type { OfflinePreparation } from './offlineStorage';

/** Descargar datos no debe abrir una caja ni reemplazar una cola sin conciliar. */
export function automaticPreparationAction(preparation: OfflinePreparation | undefined, unresolved: number, now = Date.now()): 'reuse' | 'catalog' | 'renew' | 'blocked' {
  const valid = preparation && !preparation.closed && Date.parse(preparation.expiresAt) > now;
  if (valid) return 'reuse';
  if (unresolved > 0) return 'blocked';
  if (!preparation || preparation.catalogOnly || preparation.closed || Date.parse(preparation.expiresAt) === 0) return 'catalog';
  return 'renew';
}
