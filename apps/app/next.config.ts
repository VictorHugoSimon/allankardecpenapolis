import withSerwistInit from '@serwist/next';
import { config as dotenv } from 'dotenv';
import type { NextConfig } from 'next';
import { resolve } from 'node:path';

// Variáveis do .env na raiz do monorepo.
dotenv({ path: resolve(process.cwd(), '../../.env'), quiet: true });

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // Em desenvolvimento (Turbopack) o service worker fica desligado.
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [{ url: '/offline', revision: process.env.SOURCE_COMMIT ?? 'v1' }],
});

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  htmlLimitedBots: /.*/,
  experimental: { optimizePackageImports: ['@ceak/ui'] },
  transpilePackages: ['@ceak/ui', '@ceak/core', '@ceak/db'],
  serverExternalPackages: ['pg', '@prisma/adapter-pg', 'web-push'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Câmera liberada só para o próprio app (leitura do QR Code do check-in).
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default withSerwist(config);
