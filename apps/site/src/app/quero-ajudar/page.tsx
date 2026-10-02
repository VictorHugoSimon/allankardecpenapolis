import type { Metadata } from 'next';
import Link from 'next/link';
import { HABILIDADES, OPCOES_AJUDAR } from '@ceak/core/regras';
import { cn } from '@ceak/ui';
import { Secao } from '@/components/Elementos';
import { campanhaEmDestaque } from '@/lib/dados';
import { FormAjuda } from './FormAjuda';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Quero ajudar',
  description:
    'Doe alimentos, roupas, produtos ou dinheiro, seja voluntário ou ofereça uma habilidade. Tudo o que chega ao CEAK é registrado e prestado contas.',
  alternates: { canonical: '/quero-ajudar' },
};

export default async function QueroAjudarPage({
  searchParams,
}: {
  searchParams: Promise<{ opcao?: string }>;
}) {
  const { opcao } = await searchParams;
  const campanha = await campanhaEmDestaque();
  const sel = OPCOES_AJUDAR.find((o) => o.chave === opcao && o.tipo);

  return (
    <Secao className="pt-16 pb-20">
      <h1 className="m-0 mb-3 font-serif text-[clamp(38px,5vw,56px)] font-medium">Quero ajudar</h1>
      <p className="text-muted m-0 mb-9 max-w-[620px] text-lg leading-[1.6]">
        Escolha a forma que combina com você. Tudo o que chega ao CEAK é registrado e prestado
        contas.
      </p>
      {campanha ? (
        <section
          aria-labelledby="campanha-ativa"
          className="rounded-hero bg-green-dark text-bg mb-7 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center gap-7 p-8"
        >
          <div>
            <p className="text-green-on-dark-2 m-0 text-[13px] font-semibold tracking-[.12em]">
              CAMPANHA ATIVA
            </p>
            <h2 id="campanha-ativa" className="my-2 font-serif text-4xl font-normal">
              {campanha.titulo}
            </h2>
            <p className="text-green-on-dark m-0 text-base leading-[1.55]">
              Casacos, cobertores e meias para as 126 famílias acompanhadas pela assistência social.
              {campanha.ate ? ` Até ${campanha.ate}.` : ''}
            </p>
          </div>
          <div>
            <div className="mb-2.5 flex items-end justify-between">
              <div>
                <p className="text-green-on-dark-2 m-0 text-[13px]">Arrecadado</p>
                <p className="m-0 font-serif text-[44px] leading-none">{campanha.arrecadado}</p>
              </div>
              <div className="text-right">
                <p className="text-green-on-dark-2 m-0 text-[13px]">Meta</p>
                <p className="m-0 text-xl">{campanha.meta}</p>
              </div>
            </div>
            <div
              role="progressbar"
              aria-label="Meta da campanha"
              aria-valuenow={campanha.percentual}
              aria-valuemin={0}
              aria-valuemax={100}
              className="bg-green-mid h-2 rounded-[9px]"
            >
              <div
                className="bg-bg h-2 rounded-[9px]"
                style={{ width: `${campanha.percentual}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-[15px]">
                {campanha.percentual}% ·{' '}
                <Link
                  href={`/campanhas/${campanha.slug}`}
                  className="text-bg hover:text-bg underline"
                >
                  ver campanha
                </Link>
              </span>
              <Link
                href="/quero-ajudar?opcao=roupas#detalhe"
                scroll={false}
                className="rounded-pill bg-bg text-green-dark inline-flex min-h-11 items-center px-5 py-[11px] text-[15px] font-semibold no-underline hover:bg-white hover:no-underline"
              >
                Quero ajudar
              </Link>
            </div>
          </div>
        </section>
      ) : null}
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,270px),1fr))] gap-3.5 p-0">
        {OPCOES_AJUDAR.map((h) => {
          const on = sel?.chave === h.chave;
          return (
            <li key={h.chave}>
              <Link
                href={h.chave === 'financeira' ? '/doar' : `/quero-ajudar?opcao=${h.chave}#detalhe`}
                scroll={h.chave === 'financeira'}
                aria-current={on ? 'true' : undefined}
                className={cn(
                  'text-ink flex h-full flex-col gap-1.5 rounded-[18px] border p-[22px] no-underline hover:no-underline',
                  on ? 'border-green bg-green-soft' : 'border-line hover:border-green bg-white',
                )}
              >
                <span className="font-serif text-[22px]">{h.titulo}</span>
                <span className="text-muted text-sm leading-normal">{h.resumo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {sel ? (
        <section
          id="detalhe"
          aria-labelledby="titulo-detalhe"
          className="border-green rounded-card-lg mt-5 flex scroll-mt-28 flex-col gap-3.5 border bg-white p-7"
        >
          <h2 id="titulo-detalhe" className="m-0 font-serif text-[26px] font-normal">
            {sel.titulo}
          </h2>
          <p className="text-ink-2 m-0 text-base leading-[1.6]">{sel.detalhe}</p>
          <FormAjuda
            key={sel.chave}
            tipo={sel.tipo!}
            cta={sel.cta}
            habilidades={sel.chave === 'habilidade' ? HABILIDADES : undefined}
          />
        </section>
      ) : null}
    </Secao>
  );
}
