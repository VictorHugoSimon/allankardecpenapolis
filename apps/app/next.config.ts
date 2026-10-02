import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { optimizePackageImports: ['@ceak/ui'] },
  transpilePackages: ['@ceak/ui', '@ceak/core'],
};

export default config;
