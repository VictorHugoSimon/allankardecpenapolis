'use client';

import { useEffect } from 'react';

/** Registra o service worker (gerado pelo Serwist no build de produção). */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Sem service worker o App continua funcionando, só sem a página offline.
    });
  }, []);
  return null;
}
