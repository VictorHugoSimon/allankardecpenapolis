import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatarDataCurta } from '@ceak/core/format';
import { instituicao } from '@ceak/core';
import { ImagePlaceholder } from '@ceak/ui';
import { AcoesEvento } from '@/components/AcoesEvento';
import { Secao, Trilha } from '@/components/Elementos';
import { postPorSlug, posts } from '@/lib/dados';
import { JsonLd } from '@/lib/jsonld';
import { SITE_URL } from '@/lib/urls';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await postPorSlug((await params).slug);
  if (!p) return { title: 'Artigo não encontrado' };
  return {
    title: p.seoTitulo ?? p.titulo,
    description: p.seoDescricao ?? p.lead,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: {
      type: 'article',
      title: p.titulo,
      description: p.lead,
      publishedTime: p.publicadoEm.toISOString(),
      url: `/blog/${p.slug}`,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const p = await postPorSlug((await params).slug);
  if (!p) notFound();
  const relacionados = (await posts(undefined, 4)).filter((x) => x.slug !== p.slug).slice(0, 3);
  return (
    <Secao estreita={800} className="pt-14 pb-20">
      <article>
        <Trilha itens={[{ href: '/blog', texto: 'Blog' }, { texto: p.categoria }]} />
        <h1 className="m-0 mb-3.5 font-serif text-[clamp(34px,5vw,50px)] leading-[1.1] font-medium text-balance">
          {p.titulo}
        </h1>
        <p className="text-muted-2 m-0 mb-7 text-[15px]">
          <time dateTime={p.publicadoEm.toISOString()}>{formatarDataCurta(p.publicadoEm)}</time> ·{' '}
          {p.autor}
        </p>
        <ImagePlaceholder caption={p.foto} ratio="16/9" radius="lg" />
        <p className="mt-8 mb-5 font-serif text-[23px] leading-normal">{p.lead}</p>
        {p.paragrafos.map((t, i) => (
          <p key={i} className="text-ink-2 m-0 mb-[18px] text-lg leading-[1.75]">
            {t}
          </p>
        ))}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <AcoesEvento slug={p.slug} titulo={p.titulo} url={`/blog/${p.slug}`} calendario={false} />
          <Link
            href="/blog"
            className="rounded-pill border-line-2 text-ink hover:border-green inline-flex min-h-11 items-center border bg-white px-3.5 py-2 text-[13px] no-underline hover:no-underline"
          >
            Voltar ao blog
          </Link>
        </div>
      </article>
      {relacionados.length ? (
        <aside aria-labelledby="leia">
          <h2 id="leia" className="mt-12 mb-5 font-serif text-[32px] font-medium">
            Leia também
          </h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-[18px] p-0">
            {relacionados.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/blog/${r.slug}`}
                  className="text-ink flex flex-col gap-1.5 no-underline hover:no-underline"
                >
                  <span className="text-muted-2 text-xs">{formatarDataCurta(r.publicadoEm)}</span>
                  <span className="font-serif text-[19px] leading-[1.3] hover:underline">
                    {r.titulo}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: p.titulo,
          description: p.lead,
          datePublished: p.publicadoEm.toISOString(),
          author: { '@type': 'Organization', name: p.autor },
          publisher: {
            '@type': 'Organization',
            name: instituicao.nome,
            '@id': `${SITE_URL}/#organizacao`,
          },
          mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`,
        }}
      />
    </Secao>
  );
}
