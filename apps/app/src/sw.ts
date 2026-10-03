/// <reference lib="webworker" />
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
  type SerwistGlobalConfig,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

/**
 * Service worker do CEAK App.
 * - Guarda só arquivos estáticos (JS, CSS, fontes, ícones) e a página /offline.
 * - Páginas e dados da área do membro NUNCA vão para o cache (são pessoais):
 *   sem rede, a navegação cai na página /offline.
 * - Recebe as notificações push e abre o App no link da notificação.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/_next/static/'),
      handler: new CacheFirst({
        cacheName: 'ceak-estaticos',
        plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 86_400 })],
      }),
    },
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest'),
      handler: new StaleWhileRevalidate({ cacheName: 'ceak-icones' }),
    },
  ],
  fallbacks: {
    entries: [{ url: '/offline', matcher: ({ request }) => request.destination === 'document' }],
  },
});

serwist.addEventListeners();

interface DadosPush {
  titulo?: string;
  corpo?: string;
  url?: string;
}

self.addEventListener('push', (event) => {
  let dados: DadosPush = {};
  try {
    dados = (event.data?.json() as DadosPush) ?? {};
  } catch {
    dados = { corpo: event.data?.text() };
  }
  event.waitUntil(
    self.registration.showNotification(dados.titulo ?? 'CEAK', {
      body: dados.corpo ?? '',
      icon: '/icons/192',
      badge: '/icons/badge',
      lang: 'pt-BR',
      data: { url: dados.url && dados.url.startsWith('/') ? dados.url : '/notificacoes' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(
    (event.notification.data as { url?: string })?.url ?? '/',
    self.location.origin,
  ).href;
  event.waitUntil(
    (async () => {
      const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const aberta = janelas.find((c) => c.url.startsWith(self.location.origin));
      if (aberta) {
        await aberta.focus();
        await aberta.navigate(url).catch(() => undefined);
      } else {
        await self.clients.openWindow(url);
      }
    })(),
  );
});
