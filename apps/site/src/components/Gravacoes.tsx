import { type EventoSite } from '@/lib/dados';

/** Grade de gravações recentes (cards escuros com ▶ e duração). */
export function Gravacoes({ itens }: { itens: EventoSite[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[18px] p-0">
      {itens.map((r) => (
        <li key={r.id}>
          <a
            href={r.gravacaoUrl ?? r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink flex flex-col gap-2 no-underline hover:no-underline"
          >
            <span className="rounded-card-sm bg-green-dark text-green-on-dark relative flex aspect-video items-center justify-center text-lg">
              <span aria-hidden="true">▶</span>
              {r.gravacaoDuracaoMin ? (
                <span className="absolute right-2.5 bottom-2 rounded bg-black/35 px-1.5 py-0.5 text-[11px]">
                  {r.gravacaoDuracaoMin} min
                </span>
              ) : null}
            </span>
            <span className="text-base font-medium hover:underline">{r.tituloCurto}</span>
            <span className="text-muted-2 text-[13px]">
              {r.quem} · {r.dataNumerica}
            </span>
            <span className="sr-only">(abre a gravação no YouTube em nova aba)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
