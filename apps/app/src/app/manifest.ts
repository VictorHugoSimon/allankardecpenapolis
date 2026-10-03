import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'CEAK App — Centro Espírita Allan Kardec',
    short_name: 'CEAK',
    description:
      'Agenda, check-in, estudos e comunicados do Centro Espírita Allan Kardec — Penápolis.',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7F4EE',
    theme_color: '#2F5D46',
    categories: ['lifestyle', 'education'],
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Check-in', url: '/checkin', icons: [{ src: '/icons/192', sizes: '192x192' }] },
      { name: 'Agenda', url: '/agenda', icons: [{ src: '/icons/192', sizes: '192x192' }] },
      { name: 'Meus estudos', url: '/estudos', icons: [{ src: '/icons/192', sizes: '192x192' }] },
    ],
  };
}
