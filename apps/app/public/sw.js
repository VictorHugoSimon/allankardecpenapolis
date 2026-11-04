/* CEAK App — service worker de produção, versionado junto ao aplicativo.
 * Offline: somente a tela pública /offline é armazenada; dados privados nunca.
 * Mantém notificações push sem depender de geração pós-build. */
const OFFLINE_CACHE = 'ceak-offline-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE);
      // Uma falha temporária na página offline não deve impedir o registro do PWA.
      try {
        await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      } catch (error) {
        console.warn('[CEAK PWA] Não foi possível preparar a tela offline:', error);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('ceak-offline-') && key !== OFFLINE_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// Jamais guarde navegações, APIs ou dados de membro. Quando não houver rede,
// responda somente com a tela pública que foi colocada no cache na instalação.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const fallback = await caches.match(OFFLINE_URL);
      return fallback || Response.error();
    }),
  );
});

// Só permitir navegação para URLs da própria aplicação.
// Caminhos como /\\dominio.com são interpretados pelo URL parser como externos.
function caminhoSeguro(valor, fallback = '/notificacoes') {
  if (typeof valor !== 'string' || !valor.startsWith('/') || valor.startsWith('//')) {
    return fallback;
  }
  try {
    const destino = new URL(valor, self.location.origin);
    if (
      destino.origin !== self.location.origin ||
      !['http:', 'https:'].includes(destino.protocol)
    ) {
      return fallback;
    }
    return `${destino.pathname}${destino.search}${destino.hash}`;
  } catch {
    return fallback;
  }
}

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = { corpo: event.data ? event.data.text() : '' };
  }
  const path = caminhoSeguro(message.url);
  event.waitUntil(
    self.registration.showNotification(message.titulo || 'CEAK', {
      body: message.corpo || '',
      icon: '/icons/192',
      badge: '/icons/badge',
      lang: 'pt-BR',
      data: { path },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = event.notification.data && event.notification.data.path;
  const safePath = caminhoSeguro(path);
  const url = new URL(safePath, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const pages = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = pages.find((page) => page.url.startsWith(self.location.origin));
      if (existing) {
        await existing.focus();
        await existing.navigate(url).catch(() => undefined);
      } else {
        await self.clients.openWindow(url);
      }
    })(),
  );
});
