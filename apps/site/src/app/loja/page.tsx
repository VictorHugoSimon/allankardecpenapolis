import type { Metadata } from 'next';
import Link from 'next/link';
import { cn, ImagePlaceholder } from '@ceak/ui';
import { ChipsLink, Secao } from '@/components/Elementos';
import { CATEGORIAS_LOJA, produtos } from '@/lib/dados';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Loja solidária',
  description:
    'Livros, artesanato feito por voluntárias e itens doados. Toda a renda vai para a assistência social do CEAK. Retirada no CEAK.',
  alternates: { canonical: '/loja' },
};

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const ativa = (CATEGORIAS_LOJA as readonly string[]).includes(categoria ?? '')
    ? categoria!
    : 'Todos';
  const lista = await produtos(ativa);
  return (
    <Secao className="pt-14 pb-20">
      <h1 className="m-0 mb-2 font-serif text-[48px] font-medium">Loja solidária</h1>
      <p className="text-muted m-0 mb-6 text-[17px]">
        Livros, artesanato feito por voluntárias e itens doados. Retirada no CEAK.
      </p>
      <div className="mb-7">
        <ChipsLink
          rotulo="Categorias"
          opcoes={CATEGORIAS_LOJA}
          ativo={ativa}
          href={(c) => (c === 'Todos' ? '/loja' : `/loja?categoria=${encodeURIComponent(c)}`)}
        />
      </div>
      {lista.length === 0 ? (
        <p className="text-muted-2 p-7 text-center">Nenhum produto nesta categoria no momento.</p>
      ) : null}
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-[22px] p-0">
        {lista.map((p) => (
          <li key={p.id}>
            <Link
              href={`/loja/${p.slug}`}
              className="text-ink flex flex-col gap-2 no-underline hover:no-underline"
            >
              <ImagePlaceholder
                caption="foto do produto"
                ratio="1"
                badge={p.origem}
                className="rounded-[18px]"
              />
              <span className="text-muted-2 text-xs">
                {p.categoria} · {p.estado}
              </span>
              <span className="text-base leading-[1.3] font-medium hover:underline">{p.nome}</span>
              <span className="flex items-center justify-between">
                <span className="text-green text-base font-semibold">{p.preco}</span>
                <span className={cn('text-xs', p.alerta ? 'text-danger' : 'text-muted-2')}>
                  {p.disponibilidade}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Secao>
  );
}
