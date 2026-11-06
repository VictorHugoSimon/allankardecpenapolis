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
  // Navegações externas não pertencem ao PWA e não devem receber o fallback CEAK.
  // Também ignoramos URLs inválidas e esquemas que não sejam HTTP(S).
  try {
    const destino = new URL(event.request.url);
    if (destino.origin !== self.location.origin || !['http:', 'https:'].includes(destino.protocol)) return;
  } catch {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(async () => {
      // O HTML do Next.js pode depender de bundles que não ficam em cache.
      // Em navegação offline, responda um documento isolado, sem JavaScript
      // ou conteúdo privado. Evita erro de hidratação quando a rede cai.
      const pagina = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#2F5D46"><title>Sem conexão · CEAK App</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#F7F4EE;color:#1F2A24}main{max-width:30rem;padding:2rem}h1{font-size:2rem}p{line-height:1.6}button{border:0;border-radius:12px;background:#2F5D46;color:#fff;padding:1rem;font:inherit;cursor:pointer}</style></head><body><main><h1>Você está sem conexão</h1><p>Assim que a internet voltar, o CEAK App mostrará sua agenda e seus estudos. Dados pessoais não ficam guardados no aparelho.</p><form method="GET" action="/"><button type="submit">Tentar novamente</button></form></main></body></html>`;
      return new Response(pagina, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
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
