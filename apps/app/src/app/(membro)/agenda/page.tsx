import type { Metadata } from 'next';
import Link from 'next/link';
import { Tela } from '@/components/Tela';
import { agenda } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';

export const metadata: Metadata = { title: 'Agenda' };
export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  await exigirSessao();
  const eventos = await agenda();
  return (
    <Tela titulo="Agenda">
      {eventos.length ? (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {eventos.map((e) => (
            <li key={e.id}>
              <Link
                href={`/agenda/${e.slug}`}
                className="border-line text-ink hover:text-ink hover:border-green flex items-center gap-3.5 rounded-2xl border bg-white p-3.5 no-underline hover:no-underline"
              >
                <span className="min-w-11 text-center">
                  <span className="text-muted-2 block text-[11px]">{e.diaSemanaCurto}</span>
                  <span className="block font-serif text-2xl leading-[1.1]">{e.dia}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-[11px] font-semibold tracking-[.04em]"
                    style={{ color: e.cor }}
                  >
                    {e.categoria}
                  </span>
                  <span className="mt-0.5 block text-sm font-medium">{e.titulo}</span>
                  <span className="text-muted-2 mt-0.5 block text-xs">
                    {e.horario} · {e.local}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted m-0 text-sm">Nenhuma atividade agendada nos próximos dias.</p>
      )}
    </Tela>
  );
}
