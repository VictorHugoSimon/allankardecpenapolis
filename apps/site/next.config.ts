import { config as dotenv } from 'dotenv';
import type { NextConfig } from 'next';
import { resolve } from 'node:path';

// Variáveis do .env na raiz do monorepo.
dotenv({ path: resolve(process.cwd(), '../../.env'), quiet: true });

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Metadata sempre no <head> (sem streaming), para buscadores e prévias de links.
  htmlLimitedBots: /.*/,
  experimental: { optimizePackageImports: ['@ceak/ui'] },
  transpilePackages: ['@ceak/ui', '@ceak/core', '@ceak/db'],
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production' ? csp : '',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    // Rotas curtas usadas nos protótipos.
    return [
      { source: '/sobre', destination: '/o-ceak', permanent: true },
      { source: '/ajuda', destination: '/preciso-de-ajuda', permanent: true },
      { source: '/ajudar', destination: '/quero-ajudar', permanent: true },
    ];
  },
};

export default config;
