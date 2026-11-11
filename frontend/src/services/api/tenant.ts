const aliases: Record<string, string> = {
  subversive: 'urbanly',
  'subversive-urban': 'urbanly',
  aura: 'aura-sport',
  fashionstore: 'dressly',
};

export function normalizeTenant(value?: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(normalized)) return undefined;
  return aliases[normalized] || normalized;
}

/** La URL de la tienda prevalece sobre el contexto que dejó otra pestaña. */
export function resolveTenant(pathname: string, search = '', stored?: string | null): string {
  const scoped = pathname.match(/^\/(?:store|tenant)\/([^/]+)/i)?.[1];
  if (scoped) return normalizeTenant(scoped) || 'dressly';
  const first = pathname.split('/')[1]?.toLowerCase();
  if (['dressly', 'urbanly', 'aura-sport', ...Object.keys(aliases)].includes(first)) return normalizeTenant(first)!;
  return normalizeTenant(new URLSearchParams(search).get('tenant')) || normalizeTenant(stored) || 'dressly';
}

export function activeTenant(): string {
  return resolveTenant(window.location.pathname, window.location.search, localStorage.getItem('tenantKey'));
}

export function storePath(tenant: string, suffix = ''): string {
  return `/store/${encodeURIComponent(normalizeTenant(tenant) || 'dressly')}${suffix}`;
}

export function customerLoginPath(pathname: string, search = '', stored?: string | null): string {
  return storePath(resolveTenant(pathname, search, stored), '/login');
}

export function isLoginRequest(url = ''): boolean {
  return /\/(?:auth\/login|saas\/auth\/login)(?:\?|$)/.test(url);
}

export function loginDestination(tenant: string, requested?: string, roleName?: string, employee = false): string {
  const role = (roleName || '').trim().toLowerCase();
  const staff = employee || Boolean(role && role !== 'cliente');
  const fallback = staff ? '/admin' : storePath(tenant);
  if (!requested || !requested.startsWith('/') || requested.startsWith('//') || requested.includes('\\')) return fallback;
  if (/^\/saas(?:-|\/|$)/.test(requested) || /\/login(?:[/?]|$)/.test(requested)) return fallback;
  if (/^\/(?:admin|pos)(?:[/?]|$)/.test(requested)) return staff ? requested : fallback;
  const scoped = requested.match(/^\/store\/([^/]+)/)?.[1];
  if (scoped && normalizeTenant(scoped) !== normalizeTenant(tenant)) return fallback;
  if (requested === '/') return fallback;
  if (/^\/(?:catalog|cart|checkout|product\/|virtual-fitting\/|sucursales|recommendations)(?:[/?]|$)/.test(requested) || /^\/(?:product|virtual-fitting)\//.test(requested)) return storePath(tenant, requested);
  return requested;
}
