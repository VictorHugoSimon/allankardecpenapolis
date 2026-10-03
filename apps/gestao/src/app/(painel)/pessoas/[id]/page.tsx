import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { iniciais } from '@ceak/core/format';
import { perfil360 } from '@ceak/db';
import { Pill } from '@ceak/ui';
import { Trilha } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';

export const metadata: Metadata = { title: 'Perfil 360°' };
export const dynamic = 'force-dynamic';

export default async function Perfil360Page({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirModulo('pessoas');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  // Com RLS: o Instrutor só abre o perfil dos próprios alunos.
  const p = await perfil360({ ...contextoRls(s), perfil: s.perfil }, id);
  if (!p) notFound();
  return (
    <div className="flex flex-col gap-4">
      <Trilha itens={[{ href: '/pessoas', texto: 'Pessoas' }, { texto: p.nome }]} />
      <section className="border-line rounded-card flex flex-wrap items-center gap-[18px] border bg-white p-[22px]">
        <span
          aria-hidden="true"
          className="bg-green-soft text-green flex size-16 items-center justify-center rounded-full font-serif text-2xl"
        >
          {iniciais(p.nome)}
        </span>
        <div className="min-w-[220px] flex-1">
          <h1 className="m-0 font-serif text-[28px] font-normal">{p.nome}</h1>
          <p className="text-muted-2 m-0 text-[13px]">{p.resumo}</p>
        </div>
        <Pill tone={p.status.tom}>{p.status.rotulo}</Pill>
      </section>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {p.blocos.map((b) => (
          <section
            key={b.titulo}
            aria-labelledby={`b-${b.titulo}`}
            className="border-line rounded-[14px] border bg-white p-4"
          >
            <h2
              id={`b-${b.titulo}`}
              className="text-muted-2 m-0 mb-2 text-xs font-semibold tracking-[.04em] uppercase"
            >
              {b.titulo}
            </h2>
            <ul className="m-0 list-none p-0">
              {b.linhas.map((l) => (
                <li
                  key={l}
                  className="border-b border-[#F4F0E7] py-[5px] text-[13px] last:border-b-0"
                >
                  {l}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
