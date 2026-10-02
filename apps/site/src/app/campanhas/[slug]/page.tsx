import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ImagePlaceholder, ProgressBar } from '@ceak/ui';
import { Secao, Trilha } from '@/components/Elementos';
import { campanhaPorSlug } from '@/lib/dados';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await campanhaPorSlug((await params).slug);
  if (!c) return { title: 'Campanha não encontrada' };
  return {
    title: c.titulo,
    description: c.descricao.slice(0, 160),
    alternates: { canonical: `/campanhas/${c.slug}` },
  };
}

export default async function CampanhaPage({ params }: Props) {
  const c = await campanhaPorSlug((await params).slug);
  if (!c) notFound();
  return (
    <Secao className="pt-14 pb-20">
      <Trilha itens={[{ href: '/quero-ajudar', texto: 'Quero ajudar' }, { texto: 'Campanha' }]} />
      <div className="flex flex-wrap items-start gap-9">
        <div className="flex min-w-0 flex-[1.4_1_440px] flex-col gap-5">
          <ImagePlaceholder caption="foto da triagem de agasalhos" radius="lg" />
          <h1 className="m-0 font-serif text-[clamp(36px,5vw,52px)] font-medium">{c.titulo}</h1>
          <p className="text-ink-2 m-0 text-lg leading-[1.7]">{c.descricao}</p>
          {c.itens.length ? (
            <div className="border-line rounded-[18px] border bg-white p-6">
              <h2 className="m-0 mb-3 text-[15px] font-semibold">O que mais precisamos</h2>
              <ul className="m-0 list-none p-0">
                {c.itens.map((n) => (
                  <li key={n.nome} className="py-2">
                    <div className="flex justify-between text-sm">
                      <span>{n.nome}</span>
                      <span>
                        {n.recebido} de {n.meta}
                      </span>
                    </div>
                    <ProgressBar
                      label={n.nome}
                      value={n.recebido}
                      max={n.meta}
                      valueText={`${n.recebido} de ${n.meta}`}
                      className="mt-1.5"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <aside
          className="rounded-card-lg bg-green-dark text-bg sticky top-24 flex flex-[1_1_300px] flex-col gap-3.5 p-7"
          aria-label="Andamento da campanha"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-green-on-dark-2 m-0 text-[13px]">Arrecadado</p>
              <p className="m-0 font-serif text-5xl leading-none">{c.arrecadado}</p>
            </div>
            <div className="text-right">
              <p className="text-green-on-dark-2 m-0 text-[13px]">Meta</p>
              <p className="m-0 text-xl">{c.meta}</p>
            </div>
          </div>
          <div
            role="progressbar"
            aria-label="Meta da campanha"
            aria-valuenow={c.percentual}
            aria-valuemin={0}
            aria-valuemax={100}
            className="bg-green-mid h-2 rounded-[9px]"
          >
            <div className="bg-bg h-2 rounded-[9px]" style={{ width: `${c.percentual}%` }} />
          </div>
          <p className="m-0 text-[15px]">
            {c.percentual}%{c.ate ? ` · até ${c.ate}` : ''}
          </p>
          {c.pontosColeta.length ? (
            <p className="text-green-on-dark border-green-mid m-0 border-t pt-3.5 text-sm leading-[1.6]">
              {c.pontosColeta.map((p, i) => (
                <span key={p}>
                  {i > 0 ? <br /> : null}
                  {p}
                </span>
              ))}
            </p>
          ) : null}
          <Link
            href="/quero-ajudar?opcao=roupas#detalhe"
            className="rounded-pill bg-bg text-green-dark min-h-12 p-3.5 text-center text-[15px] font-semibold no-underline hover:bg-white hover:no-underline"
          >
            Quero ajudar
          </Link>
          <Link
            href="/doar"
            className="rounded-pill border-green-line text-bg hover:text-bg min-h-12 border p-[13px] text-center text-[15px] no-underline hover:bg-white/5 hover:no-underline"
          >
            Contribuir via PIX
          </Link>
        </aside>
      </div>
    </Secao>
  );
}
