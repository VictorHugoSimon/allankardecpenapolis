import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/urls';

export default function robots(): MetadataRoute.Robots {
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
