import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/** Precarga exclusivamente el código de la aplicación; las respuestas de API no se cachean. */
export function offlinePwa(): Plugin {
  return {
    name: 'dressly-offline-shell',
    apply: 'build',
    generateBundle(_, bundle) {
      const assets = Object.keys(bundle).filter(name => /\.(js|css|woff2?)$/.test(name));
      const version = createHash('sha256').update(assets.sort().join('|')).digest('hex').slice(0, 16);
      this.emitFile({ type: 'asset', fileName: 'offline-worker.js', source: `
const CACHE = 'dressly-shell-${version}';
const FILES = ${JSON.stringify(['./index.html', ...assets.map(name => `./${name}`)])};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dressly-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then(cache => cache.match('./index.html'))));
    return;
  }
  const known = FILES.some(file => new URL(file, self.registration.scope).href === url.href);
  if (known) event.respondWith(caches.open(CACHE).then(cache => cache.match(request)).then(response => response || fetch(request)));
});
` });
    },
  };
}
