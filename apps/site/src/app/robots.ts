import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/urls';

export default function robots(): MetadataRoute.Robots {
  // Homologação jamais deve ser rastreada ou promovida como site oficial.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.includes('git-preview')) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/carrinho', '/checkout', '/pedido/', '/doar/', '/inscricao'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
