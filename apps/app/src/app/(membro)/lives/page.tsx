import type { Metadata } from 'next';
import { mesmoDia } from '@ceak/core/format';
import { Tela } from '@/components/Tela';
import { diaMes, diaRelativo, gravacoes, palestrasFuturas } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';

export const metadata: Metadata = { title: 'Lives' };
export const dynamic = 'force-dynamic';

export default async function LivesPage() {
  await exigirSessao();
  const agora = new Date();
  const [proximas, recs] = await Promise.all([palestrasFuturas(agora, 4), gravacoes(4)]);
  const destaque = proximas[0];
  const aoVivo = destaque?.status === 'EM_ANDAMENTO';
  const cartao = 'border-line rounded-[18px] border bg-white';
  return (
    <Tela titulo="Lives">
      <div className="flex flex-col gap-3">
        {destaque ? (
          <div className="bg-green-dark text-green-on-dark relative flex aspect-video flex-col items-center justify-center gap-2 rounded-[18px]">
            {mesmoDia(destaque.inicio, agora) ? (
              <span className="text-bg absolute top-2.5 left-3 rounded bg-[#A4473A] px-1.5 py-0.5 text-[11px] font-semibold tracking-[.1em]">
                {aoVivo ? 'AO VIVO' : `AO VIVO ${destaque.hora}`}
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className="border-green-on-dark flex size-[50px] items-center justify-center rounded-full border-[1.5px]"
            >
              ▶
            </span>
            {aoVivo && destaque.transmissaoUrl ? (
              <a
                href={destaque.transmissaoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-bg text-xs"
              >
                Assistir: {destaque.tituloCurto} · {destaque.quem}
              </a>
            ) : (
              <p className="m-0 px-4 text-center text-xs">
                {destaque.tituloCurto} · {destaque.quem}
              </p>
            )}
          </div>
        ) : null}

        <h2 className="m-0 mt-1.5 text-[15px] font-semibold">Próximas transmissões</h2>
        {proximas.length ? (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {proximas.map((p) => (
              <li key={p.id} className={`${cartao} px-3.5 py-3`}>
                <span className="text-muted-2 block text-xs">
                  {diaRelativo(p.inicio, agora)} · {p.hora}
                </span>
                <span className="mt-0.5 block text-sm font-medium">
                  {p.tituloCurto} — {p.quem}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted m-0 text-sm">Nenhuma transmissão agendada.</p>
        )}

        <h2 className="m-0 mt-1.5 text-[15px] font-semibold">Gravações</h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {recs.map((r) => (
            <li key={r.id}>
              <a
                href={r.gravacaoUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cartao} text-ink hover:text-ink hover:border-green flex items-center gap-3 p-2.5 no-underline hover:no-underline`}
              >
                <span
                  aria-hidden="true"
                  className="bg-green-dark text-green-on-dark flex aspect-video w-[84px] flex-none items-center justify-center rounded-lg text-xs"
                >
                  ▶
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{r.tituloCurto}</span>
                  <span className="text-muted-2 block text-xs">
                    {[
                      r.quem,
                      diaMes(r.inicio),
                      r.gravacaoDuracaoMin ? `${r.gravacaoDuracaoMin} min` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Tela>
  );
}
