import { config as dotenv } from 'dotenv';
import type { NextConfig } from 'next';
import { resolve } from 'node:path';

// Variáveis do .env na raiz do monorepo.
dotenv({ path: resolve(process.cwd(), '../../.env'), quiet: true });

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { optimizePackageImports: ['@ceak/ui'] },
  transpilePackages: ['@ceak/ui', '@ceak/core', '@ceak/db'],
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default config;
