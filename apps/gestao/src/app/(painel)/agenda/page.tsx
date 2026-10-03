import Link from 'next/link';
import type { Metadata } from 'next';
import { podeEditarAgenda } from '@ceak/core/rbac';
import { categoryColors } from '@ceak/ui/tokens';
import { agendaDoMes, referenciaDoMes } from '@ceak/db';
import { buttonClasses, cn, Pill, Table } from '@ceak/ui';
import { TituloPagina } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';

export const metadata: Metadata = { title: 'Agenda' };
export const dynamic = 'force-dynamic';

const COR_TIPO: Record<string, string> = {
  PALESTRA: categoryColors.Palestras,
  ESTUDO: categoryColors.Estudos,
  CURSO: categoryColors.Cursos,
  EVENTO: categoryColors.Eventos,
  ASSISTENCIA: categoryColors['Assistência'],
  CAMPANHA: categoryColors.Campanhas,
};
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const chave = (ano: number, mes: number) => `${ano}-${String(mes + 1).padStart(2, '0')}`;

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; criada?: string }>;
}) {
  const s = await exigirModulo('agenda');
  const { mes, criada } = await searchParams;
  const a = await agendaDoMes(referenciaDoMes(mes) ?? new Date());
  const ant = a.mes === 0 ? chave(a.ano - 1, 11) : chave(a.ano, a.mes - 1);
  const prox = a.mes === 11 ? chave(a.ano + 1, 0) : chave(a.ano, a.mes + 1);
  const celulas = [
    ...Array.from({ length: a.primeiroDiaSemana }, () => null),
    ...Array.from({ length: a.diasNoMes }, (_, i) => i + 1),
  ];
  while (celulas.length % 7) celulas.push(null);
  return (
    <div className="flex flex-col gap-[18px]">
      <TituloPagina
        acoes={
          podeEditarAgenda(s.perfil) ? (
            <Link href="/agenda/nova" className={buttonClasses({ shape: 'rounded', size: 'sm' })}>
              Nova atividade
            </Link>
          ) : undefined
        }
      >
        Agenda
      </TituloPagina>
      {criada ? (
        <p
          role="status"
          className="bg-green-soft text-green-dark rounded-input m-0 px-3.5 py-3 text-sm"
        >
          Atividade criada e registrada na auditoria.
        </p>
      ) : null}
      <section
        aria-labelledby="mes-titulo"
        className="border-line rounded-card overflow-x-auto border bg-white p-4"
      >
        <div className="min-w-[640px]">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/agenda?mes=${ant}`}
                aria-label="Mês anterior"
                className="border-line-admin text-ink flex size-9 items-center justify-center rounded-lg border no-underline"
              >
                ‹
              </Link>
              <h2 id="mes-titulo" className="m-0 font-serif text-[22px] font-normal">
                {a.rotulo}
              </h2>
              <Link
                href={`/agenda?mes=${prox}`}
                aria-label="Próximo mês"
                className="border-line-admin text-ink flex size-9 items-center justify-center rounded-lg border no-underline"
              >
                ›
              </Link>
            </div>
            <p className="text-muted-2 m-0 text-xs">
              Palestras · Estudos · Cursos · Assistência · Eventos · Campanhas
            </p>
          </div>
          <div aria-hidden="true" className="text-muted-2 mb-1.5 grid grid-cols-7 gap-1.5 text-xs">
            {SEMANA.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <ol className="m-0 grid list-none grid-cols-7 gap-1.5 p-0">
            {celulas.map((dia, i) => {
              const evs = dia ? a.atividades.filter((e) => e.dia === dia) : [];
              return (
                <li
                  key={i}
                  aria-hidden={dia ? undefined : true}
                  className={cn(
                    'flex min-h-[86px] flex-col gap-[3px] rounded-[10px] border p-1.5',
                    dia ? 'border-line-soft bg-surface-2' : 'border-transparent bg-transparent',
                  )}
                >
                  {dia ? (
                    <>
                      <span className="text-xs font-semibold">
                        {dia}
                        <span className="sr-only">
                          {' '}
                          de {a.rotulo}:{' '}
                          {evs.length ? evs.map((e) => e.titulo).join('; ') : 'sem atividades'}
                        </span>
                      </span>
                      {evs.map((e) => (
                        <span
                          key={e.id}
                          aria-hidden="true"
                          className="text-ink-2 border-l-2 pl-1 text-[10px] leading-[1.25]"
                          style={{ borderColor: COR_TIPO[e.tipo] }}
                        >
                          {e.titulo}
                        </span>
                      ))}
                    </>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </section>
      <Table
        caption={`Atividades de ${a.rotulo}`}
        rows={a.atividades}
        rowKey={(e) => e.id}
        empty="Nenhuma atividade neste mês."
        columns={[
          { key: 'atividade', header: 'Atividade', cell: (e) => e.titulo },
          { key: 'tipo', header: 'Tipo', cell: (e) => e.tipoLabel },
          { key: 'data', header: 'Data', cell: (e) => e.data, className: 'whitespace-nowrap' },
          { key: 'local', header: 'Local', cell: (e) => e.local },
          { key: 'resp', header: 'Responsável', cell: (e) => e.responsavel },
          { key: 'insc', header: 'Inscritos', cell: (e) => e.inscritos },
          { key: 'status', header: 'Status', cell: (e) => <Pill tone={e.tom}>{e.status}</Pill> },
        ]}
      />
    </div>
  );
}
