import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { instituicao } from '@ceak/core';
import { Ficha, Secao, Trilha } from '@/components/Elementos';
import { produtoPorSlug } from '@/lib/dados';
import { JsonLd } from '@/lib/jsonld';
import { SITE_URL } from '@/lib/urls';
import { AdicionarCarrinho } from './AdicionarCarrinho';
import { Galeria } from './Galeria';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ produto: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await produtoPorSlug((await params).produto);
  if (!p) return { title: 'Produto não encontrado' };
  return {
    title: p.nome,
    description: `${p.preco} · ${p.estado} · ${p.descricao}`.slice(0, 160),
    alternates: { canonical: `/loja/${p.slug}` },
  };
}

export default async function ProdutoPage({ params }: Props) {
  const p = await produtoPorSlug((await params).produto);
  if (!p) notFound();
  return (
    <Secao className="pt-10 pb-20">
      <Trilha itens={[{ href: '/loja', texto: 'Loja' }, { texto: p.categoria }]} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-12">
        <Galeria nome={p.nome} imagens={p.imagens} />
        <div className="flex flex-col gap-[18px]">
          <span className="rounded-pill bg-green-soft text-green-dark self-start px-3 py-1.5 text-[13px] font-semibold">
            {p.origem}
          </span>
          <h1 className="m-0 font-serif text-[42px] leading-[1.1] font-medium">{p.nome}</h1>
          <p className="text-green m-0 font-serif text-[34px]">{p.preco}</p>
          <p className="text-ink-2 m-0 text-[17px] leading-[1.65]">{p.descricao}</p>
          <Ficha
            larguraRotulo={130}
            className="border-line border-y py-4 [&_dd]:font-normal"
            linhas={[
              ['Estado', p.estado],
              ['Estoque', p.disponibilidade],
              ['Origem', p.origem],
              ['Entrega', 'Retirada no CEAK, ter. a sáb., 19h às 21h30'],
            ]}
          />
          <AdicionarCarrinho
            disponivel={p.saldo > 0}
            item={{
              produtoId: p.id,
              slug: p.slug,
              nome: p.nome,
              estado: p.estado,
              precoCentavos: p.precoCentavos,
            }}
          />
          <p className="text-muted-2 m-0 text-sm">100% da renda vai para a assistência social.</p>
        </div>
      </div>
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.nome,
          description: p.descricao,
          category: p.categoria,
          offers: {
            '@type': 'Offer',
            price: (p.precoCentavos / 100).toFixed(2),
            priceCurrency: 'BRL',
            availability:
              p.saldo > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${SITE_URL}/loja/${p.slug}`,
            seller: { '@type': 'Organization', name: instituicao.nome },
          },
        }}
      />
    </Secao>
  );
}
