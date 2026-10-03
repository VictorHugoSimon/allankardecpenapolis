import type { Metadata } from 'next';
import { formatarHora, mesmoDia } from '@ceak/core/format';
import { jornada } from '@ceak/db';
import { cn } from '@ceak/ui';
import { Tela } from '@/components/Tela';
import { diaMes } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';

export const metadata: Metadata = { title: 'Minha jornada' };
export const dynamic = 'force-dynamic';

export default async function JornadaPage() {
  const s = await exigirSessao();
  const agora = new Date();
  const j = await jornada(s.pessoaId, agora);
  const stats = [
    [j.mes.visitas, j.mes.visitas === 1 ? 'visita' : 'visitas'],
    [j.mes.estudos, j.mes.estudos === 1 ? 'estudo' : 'estudos'],
    [j.mes.voluntariados, j.mes.voluntariados === 1 ? 'voluntariado' : 'voluntariados'],
    [j.mes.campanhas, j.mes.campanhas === 1 ? 'campanha apoiada' : 'campanhas apoiadas'],
  ] as const;

  return (
    <Tela titulo="Minha jornada">
      <div className="flex flex-col gap-3.5">
        <section aria-labelledby="mes-titulo">
          <h2 id="mes-titulo" className="text-muted m-0 mb-3.5 text-sm font-normal">
            Este mês
          </h2>
          <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0">
            {stats.map(([v, l]) => (
              <li key={l} className="border-line rounded-[18px] border bg-white p-4">
                <span className="block font-serif text-[32px] leading-none">{v}</span>
                <span className="text-muted mt-1.5 block text-[13px]">{l}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="conquistas-titulo">
          <h2 id="conquistas-titulo" className="m-0 mt-2 mb-3.5 text-[15px] font-semibold">
            Conquistas
          </h2>
          <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
            {j.conquistas.map((c) => (
              <li key={c.chave} className="flex flex-col items-center gap-1.5 text-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    'border-green text-green flex size-12 items-center justify-center rounded-full border-[1.5px] font-serif text-base',
                    c.obtida ? 'bg-green-soft' : 'bg-transparent opacity-40',
                  )}
                >
                  {c.icone}
                </span>
                <span className={cn('text-[11px] leading-[1.3]', !c.obtida && 'text-muted-2')}>
                  {c.titulo}
                  <span className="sr-only">
                    {c.obtida ? ' (conquistada)' : ' (ainda não conquistada)'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="linha-titulo">
          <h2 id="linha-titulo" className="m-0 mt-2 mb-3.5 text-[15px] font-semibold">
            Linha do tempo
          </h2>
          {j.linhaDoTempo.length ? (
            <ol className="m-0 list-none p-0">
              {j.linhaDoTempo.map((t, i) => {
                const quando = mesmoDia(t.quando, agora)
                  ? `Hoje, ${formatarHora(t.quando)}`
                  : diaMes(t.quando);
                const sufixo = 'sufixo' in t && t.sufixo ? ` · ${t.sufixo}` : '';
                return (
                  <li key={i} className="grid grid-cols-[14px_minmax(0,1fr)] gap-3">
                    <span aria-hidden="true" className="flex flex-col items-center">
                      <span className="bg-green mt-1.5 size-[9px] rounded-full" />
                      <span className="bg-line-2 w-px flex-1" />
                    </span>
                    <span className="pb-4">
                      <span className="block text-sm font-medium">{t.texto}</span>
                      <span className="text-muted-2 mt-0.5 block text-xs">
                        {quando}
                        {sufixo}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-muted m-0 text-sm">
              Sua linha do tempo começa no primeiro check-in ou estudo.
            </p>
          )}
        </section>

        <p className="bg-beige text-muted-2 m-0 rounded-xl p-3 text-xs leading-normal">
          Sua jornada é pessoal e visível apenas para você. O CEAK não mantém rankings entre
          participantes.
        </p>
      </div>
    </Tela>
  );
}
