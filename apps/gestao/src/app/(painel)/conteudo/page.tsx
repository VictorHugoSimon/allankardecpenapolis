import Link from 'next/link';
import type { Metadata } from 'next';
import { ETAPAS_PUBLICACAO } from '@ceak/core/regras';
import { channelColors } from '@ceak/ui/tokens';
import { painelConteudo } from '@ceak/db';
import { buttonClasses, cn, Pill, Table } from '@ceak/ui';
import { Indicadores, TituloPagina } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';

export const metadata: Metadata = { title: 'Conteúdo' };
export const dynamic = 'force-dynamic';

const FILTROS = [
  'Todos',
  'Blog',
  'Facebook',
  'Instagram',
  'Google',
  'Eventos',
  'Campanhas',
] as const;
const COR: Record<string, string> = channelColors;

export default async function ConteudoPage({
  searchParams,
}: {
  searchParams: Promise<{ canal?: string }>;
}) {
  await exigirModulo('conteudo');
  const { canal } = await searchParams;
  const filtro = FILTROS.includes(canal as (typeof FILTROS)[number]) ? canal! : 'Todos';
  const c = await painelConteudo({ canal: filtro });
  return (
    <div className="flex flex-col gap-[18px]">
      <TituloPagina
        acoes={
          <Link href="/conteudo/novo" className={buttonClasses({ shape: 'rounded', size: 'sm' })}>
            Novo conteúdo
          </Link>
        }
      >
        CEAK Conteúdo
      </TituloPagina>
      <Indicadores
        min={170}
        tamanho={30}
        itens={[
          { rotulo: 'Posts publicados', valor: String(c.kpis.publicados) },
          { rotulo: 'Aguardando aprovação', valor: String(c.kpis.aguardando), tom: 'ocre' },
          { rotulo: 'Agendados', valor: String(c.kpis.agendados) },
          { rotulo: 'Falhas', valor: String(c.kpis.falhas), tom: 'erro' },
        ]}
      />
      <section
        className="bg-green-soft rounded-card flex flex-col gap-3 px-5 py-[18px]"
        aria-labelledby="fluxo-pub"
      >
        <h2 id="fluxo-pub" className="text-green-dark m-0 text-[13px] font-semibold">
          Fluxo de publicação · nenhum conteúdo institucional é publicado sem revisão e aprovação
          humana
        </h2>
        <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
          {ETAPAS_PUBLICACAO.map((t, i) => (
            <li key={t} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'border-green rounded-pill border px-3 py-1.5 text-[13px] font-medium whitespace-nowrap',
                  i === 2 || i === 3 ? 'bg-green text-white' : 'text-green-dark bg-white',
                )}
              >
                {t}
              </span>
              {i < ETAPAS_PUBLICACAO.length - 1 ? (
                <span aria-hidden="true" className="text-green-line">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
      <Table
        caption="Conteúdos"
        rows={c.conteudos}
        rowKey={(r) => r.id}
        className="[&_table]:min-w-[860px]"
        columns={[
          { key: 'titulo', header: 'Título', cell: (r) => r.titulo },
          {
            key: 'fonte',
            header: 'Fonte',
            cell: (r) => <span className="text-muted">{r.fonte}</span>,
            emphasis: false,
          },
          { key: 'canal', header: 'Canal', cell: (r) => r.canais },
          { key: 'status', header: 'Status', cell: (r) => <Pill tone={r.tom}>{r.status}</Pill> },
          { key: 'data', header: 'Data', cell: (r) => r.data, className: 'whitespace-nowrap' },
          { key: 'resp', header: 'Responsável', cell: (r) => r.responsavel },
          {
            key: 'cta',
            header: <span className="sr-only">Ação</span>,
            cell: (r) => (
              <Link
                href={`/conteudo/${r.id}`}
                className="font-semibold whitespace-nowrap"
                aria-label={`${r.revisar ? 'Revisar' : 'Abrir'}: ${r.titulo}`}
              >
                {r.revisar ? 'Revisar ›' : 'Abrir ›'}
              </Link>
            ),
          },
        ]}
      />
      <section
        aria-labelledby="cal-ed"
        className="border-line rounded-card flex flex-col gap-3.5 border bg-white p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h2 id="cal-ed" className="m-0 text-[15px] font-semibold">
            Calendário editorial · {c.semana.rotulo}
          </h2>
          <nav aria-label="Filtrar por canal">
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {FILTROS.map((f) => (
                <li key={f}>
                  <Link
                    href={f === 'Todos' ? '/conteudo' : `/conteudo?canal=${f}`}
                    scroll={false}
                    aria-current={filtro === f ? 'true' : undefined}
                    className={cn(
                      'rounded-pill inline-flex min-h-8 items-center border px-[11px] py-[5px] text-xs no-underline hover:no-underline',
                      filtro === f
                        ? 'bg-green border-green text-white hover:text-white'
                        : 'border-line-2 text-ink hover:text-ink bg-white',
                    )}
                  >
                    {f}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="overflow-x-auto">
          <ol className="m-0 grid min-w-[790px] list-none grid-cols-7 gap-2 p-0">
            {c.semana.dias.map((d) => (
              <li
                key={d.rotulo}
                className="bg-surface-2 flex min-h-[150px] flex-col gap-1.5 rounded-xl border border-[#F0EBE0] p-2.5"
              >
                <span className="text-muted-2 text-xs">{d.rotulo}</span>
                {d.itens.map((p, i) => (
                  <span
                    key={i}
                    className="rounded-md border-l-[3px] bg-white px-2 py-1.5 text-xs leading-[1.35]"
                    style={{ borderColor: COR[p.canal] }}
                  >
                    <span
                      className="block text-[11px] font-semibold"
                      style={{ color: COR[p.canal] }}
                    >
                      {p.canal} · {p.hora}
                    </span>
                    {p.titulo}
                  </span>
                ))}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
