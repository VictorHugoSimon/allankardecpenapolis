import { instituicao } from '@ceak/core';
import { EmptyState, LogoMark } from '@ceak/ui';

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 py-16">
      <div className="flex items-center gap-3">
        <LogoMark />
        <div className="leading-[1.15]">
          <div className="font-serif text-lg font-semibold">{instituicao.nome}</div>
          <div className="text-muted text-[11px] tracking-[.1em]">
            PENÁPOLIS · DESDE {instituicao.fundacao}
          </div>
        </div>
      </div>
      <h1 className="m-0 max-w-[760px] font-serif text-[clamp(38px,5vw,60px)] leading-[1.05] font-medium">
        Ecossistema digital do Centro Espírita Allan Kardec — Penápolis
      </h1>
      <p className="text-muted m-0 max-w-[640px] text-lg leading-[1.6]">{instituicao.principio}</p>
      <EmptyState title="Site em construção" description="As páginas públicas chegam na Fase 1." />
    </main>
  );
}
