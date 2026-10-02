import type { Metadata } from 'next';
import Link from 'next/link';
import { formatarDataCurta } from '@ceak/core/format';
import { ImagePlaceholder } from '@ceak/ui';
import { ChipsLink, Secao, Subtitulo, TituloPagina } from '@/components/Elementos';
import { CATEGORIAS_BLOG, posts } from '@/lib/dados';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Notícias e blog',
  description:
    'Resumos de palestras, comunicados e notícias do Centro Espírita Allan Kardec de Penápolis.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const ativa = (CATEGORIAS_BLOG as readonly string[]).includes(categoria ?? '')
    ? categoria!
    : 'Todos';
  const lista = await posts(ativa);
  return (
    <Secao className="pt-14 pb-20">
      <TituloPagina>Notícias e blog</TituloPagina>
      <Subtitulo>Resumos de palestras, comunicados e notícias da casa.</Subtitulo>
      <div className="mb-6">
        <ChipsLink
          rotulo="Categorias"
          opcoes={CATEGORIAS_BLOG}
          ativo={ativa}
          href={(c) => (c === 'Todos' ? '/blog' : `/blog?categoria=${encodeURIComponent(c)}`)}
        />
      </div>
      {lista.length === 0 ? (
        <p className="text-muted-2 p-7 text-center">Nenhum artigo nesta categoria por enquanto.</p>
      ) : null}
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-6 p-0">
        {lista.map((p) => (
          <li key={p.slug}>
            <article>
              <Link
                href={`/blog/${p.slug}`}
                className="text-ink flex flex-col gap-2.5 no-underline hover:no-underline"
              >
                <ImagePlaceholder caption={p.foto} />
                <span className="text-muted-2 text-[13px]">
                  <time dateTime={p.publicadoEm.toISOString()}>
                    {formatarDataCurta(p.publicadoEm)}
                  </time>{' '}
                  · {p.categoria}
                </span>
                <h2 className="m-0 font-serif text-[23px] leading-[1.25] font-normal hover:underline">
                  {p.titulo}
                </h2>
                <span className="text-muted text-[15px] leading-normal">{p.lead}</span>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </Secao>
  );
}
