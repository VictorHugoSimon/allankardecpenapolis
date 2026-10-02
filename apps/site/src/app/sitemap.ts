import type { MetadataRoute } from 'next';
import { SERVICOS_AJUDA } from '@ceak/core/regras';
import { prisma } from '@ceak/db';
import { urlEvento } from '@/lib/urls';
import { SITE_URL } from '@/lib/urls';

export const dynamic = 'force-dynamic';

const FIXAS = [
  ['/', 1, 'daily'],
  ['/o-ceak', 0.6, 'yearly'],
  ['/agenda', 0.9, 'daily'],
  ['/palestras', 0.9, 'daily'],
  ['/lives', 0.7, 'daily'],
  ['/estudos', 0.8, 'monthly'],
  ['/biblioteca', 0.6, 'weekly'],
  ['/blog', 0.7, 'weekly'],
  ['/preciso-de-ajuda', 0.9, 'monthly'],
  ['/quero-ajudar', 0.9, 'weekly'],
  ['/doar', 0.8, 'monthly'],
  ['/loja', 0.7, 'weekly'],
  ['/transparencia', 0.6, 'monthly'],
  ['/contato', 0.6, 'yearly'],
  ['/privacidade', 0.2, 'yearly'],
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [eventos, posts, produtos, campanhas] = await Promise.all([
    prisma.evento.findMany({
      where: { publico: true, status: { in: ['CONFIRMADO', 'EM_ANDAMENTO', 'ENCERRADO'] } },
      select: { slug: true, tipo: true, atualizadoEm: true },
    }),
    prisma.conteudo.findMany({
      where: { status: 'PUBLICADO', slug: { not: null } },
      select: { slug: true, atualizadoEm: true },
    }),
    prisma.produto.findMany({ where: { status: 'ATIVO' }, select: { slug: true } }),
    prisma.campanha.findMany({ where: { status: 'ATIVA' }, select: { slug: true } }),
  ]);
  return [
    ...FIXAS.map(([rota, priority, changeFrequency]) => ({
      url: `${SITE_URL}${rota}`,
      priority,
      changeFrequency,
    })),
    ...SERVICOS_AJUDA.map((s) => ({
      url: `${SITE_URL}/preciso-de-ajuda/${s.slug}`,
      priority: 0.7,
    })),
    ...eventos.map((e) => ({
      url: `${SITE_URL}${urlEvento(e)}`,
      lastModified: e.atualizadoEm,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.atualizadoEm,
      priority: 0.5,
    })),
    ...produtos.map((p) => ({ url: `${SITE_URL}/loja/${p.slug}`, priority: 0.4 })),
    ...campanhas.map((c) => ({ url: `${SITE_URL}/campanhas/${c.slug}`, priority: 0.7 })),
  ];
}
