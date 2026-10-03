'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ceak/ui';

const JORNADA = [
  ['Login', '/entrar'],
  ['Home', '/'],
  ['Check-in', '/checkin'],
  ['Estudo', '/estudos'],
  ['Palestra', '/palestra'],
  ['Avaliação', '/avaliacao'],
] as const;

const OUTRAS = [
  ['Lives', '/lives'],
  ['Quero ajudar', '/quero-ajudar'],
  ['Doação PIX', '/doar'],
  ['Preciso de ajuda', '/preciso-de-ajuda'],
  ['Loja', '/loja'],
  ['Minha jornada', '/jornada'],
  ['Meus estudos', '/estudos'],
  ['CEAK IA', '/ia'],
  ['Agenda', '/agenda'],
  ['Biblioteca', '/biblioteca'],
  ['Notificações', '/notificacoes'],
  ['Perfil', '/perfil'],
] as const;

function Atalhos({
  itens,
  atual,
}: {
  itens: readonly (readonly [string, string])[];
  atual: string;
}) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {itens.map(([rotulo, href]) => {
        const ativo = href === '/' ? atual === '/' : atual.startsWith(href);
        return (
          <li key={rotulo}>
            <Link
              href={href}
              aria-current={ativo ? 'page' : undefined}
              className={cn(
                'rounded-pill border-line-2 inline-flex min-h-8 items-center border px-3 py-[7px] text-[13px] whitespace-nowrap no-underline hover:no-underline',
                ativo
                  ? 'bg-green text-white hover:text-white'
                  : 'text-ink hover:border-green bg-white',
              )}
            >
              {rotulo}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Painel de atalhos ao lado da moldura (somente desktop). */
export function PainelLateral({ siteUrl, gestaoUrl }: { siteUrl: string; gestaoUrl: string }) {
  const atual = usePathname();
  return (
    <aside
      aria-label="Atalhos do CEAK App"
      className="hidden flex-[0_1_340px] flex-col gap-5 min-[600px]:flex"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-green text-bg flex size-11 items-center justify-center rounded-xl font-serif text-[17px] font-semibold"
        >
          AK
        </span>
        <div>
          <p className="m-0 font-serif text-[26px]">CEAK App</p>
          <p className="text-muted m-0 text-[13px]">Aplicativo instalável (PWA) · área do membro</p>
        </div>
      </div>
      <nav aria-label="Telas do App" className="bg-bg flex flex-col gap-3 rounded-[18px] p-5">
        <h2 className="label-caps text-green m-0">Jornada do membro</h2>
        <Atalhos itens={JORNADA} atual={atual} />
        <h2 className="label-caps text-green m-0 mt-1.5">Outras telas</h2>
        <Atalhos itens={OUTRAS} atual={atual} />
      </nav>
      <div className="flex gap-3.5 text-sm">
        <a href={siteUrl}>Site público</a>
        <a href={gestaoUrl}>CEAK Gestão</a>
      </div>
    </aside>
  );
}
