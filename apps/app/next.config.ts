import { config as dotenv } from 'dotenv';
import type { NextConfig } from 'next';
import { resolve } from 'node:path';

// Variáveis do .env na raiz do monorepo.
dotenv({ path: resolve(process.cwd(), '../../.env'), quiet: true });

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { optimizePackageImports: ['@ceak/ui'] },
  transpilePackages: ['@ceak/ui', '@ceak/core'],
};

export default config;
