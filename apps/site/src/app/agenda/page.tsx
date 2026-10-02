import type { Metadata } from 'next';
import Link from 'next/link';
import { partesData } from '@ceak/core/format';
import { cn } from '@ceak/ui';
import { AcoesEvento } from '@/components/AcoesEvento';
import { Categoria, ChipsLink, Secao, Subtitulo } from '@/components/Elementos';
import { eventosDoMes, FILTROS_AGENDA } from '@/lib/dados';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agenda',
  description:
    'Palestras, estudos, cursos, eventos, assistência e campanhas do CEAK. Todas as atividades são gratuitas e abertas ao público.',
  alternates: { canonical: '/agenda' },
};

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function lerMes(v: string | undefined, hoje: ReturnType<typeof partesData>) {
  const m = v?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const mes = Number(m[2]) - 1;
    if (mes >= 0 && mes < 12) return { ano: Number(m[1]), mes };
  }
  return { ano: hoje.ano, mes: hoje.mes };
}

const chaveMes = (ano: number, mes: number) => `${ano}-${String(mes + 1).padStart(2, '0')}`;

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  const hoje = partesData(new Date());
  const { ano, mes } = lerMes(sp.mes, hoje);
  const filtro = (FILTROS_AGENDA as readonly string[]).includes(sp.filtro ?? '')
    ? sp.filtro!
    : 'Todos';
  const eventos = await eventosDoMes(ano, mes, filtro);

  const primeiroDiaSemana = new Date(Date.UTC(ano, mes, 1)).getUTCDay();
  const diasNoMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  const celulas = Array.from(
    { length: Math.ceil((primeiroDiaSemana + diasNoMes) / 7) * 7 },
    (_, i) => {
      const n = i - primeiroDiaSemana + 1;
      return n >= 1 && n <= diasNoMes ? n : null;
    },
  );
  const ehMesAtual = ano === hoje.ano && mes === hoje.mes;
  const anterior = mes === 0 ? chaveMes(ano - 1, 11) : chaveMes(ano, mes - 1);
  const proximo = mes === 11 ? chaveMes(ano + 1, 0) : chaveMes(ano, mes + 1);
  const qs = (f: string, m = chaveMes(ano, mes)) => {
    const p = new URLSearchParams();
    if (f !== 'Todos') p.set('filtro', f);
    if (m !== chaveMes(hoje.ano, hoje.mes)) p.set('mes', m);
    const s = p.toString();
    return `/agenda${s ? `?${s}` : ''}`;
  };

  return (
    <Secao className="pt-14 pb-20">
      <h1 className="m-0 mb-2 font-serif text-[48px] font-medium">Agenda</h1>
      <Subtitulo className="mb-6">
        {MESES[mes]} de {ano} · todas as atividades são gratuitas e abertas ao público.
      </Subtitulo>
      <div className="mb-7">
        <ChipsLink
          rotulo="Filtrar por categoria"
          opcoes={FILTROS_AGENDA}
          ativo={filtro}
          href={(f) => qs(f)}
        />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-7">
        <div className="border-line rounded-card-lg border bg-white p-[22px]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Link
              href={qs(filtro, anterior)}
              scroll={false}
              className="text-green inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-lg"
              aria-label="Mês anterior"
            >
              ‹
            </Link>
            <h2 className="m-0 font-serif text-2xl font-normal">
              {MESES[mes]} {ano}
            </h2>
            <span className="flex items-center gap-1">
              {ehMesAtual ? (
                <span className="text-muted-2 text-[13px]">
                  Hoje: {hoje.diaSemanaCurto.toLowerCase()}, {String(hoje.dia).padStart(2, '0')}
                </span>
              ) : null}
              <Link
                href={qs(filtro, proximo)}
                scroll={false}
                className="text-green inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-lg"
                aria-label="Próximo mês"
              >
                ›
              </Link>
            </span>
          </div>
          <table
            className="w-full table-fixed border-separate border-spacing-1"
            aria-label={`Calendário de ${MESES[mes]} de ${ano}`}
          >
            <thead>
              <tr className="text-muted-2 text-xs">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <th key={i} scope="col" className="font-normal">
                    <abbr
                      title={
                        ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][i]
                      }
                      className="no-underline"
                    >
                      {d}
                    </abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: celulas.length / 7 }, (_, s) => (
                <tr key={s}>
                  {celulas.slice(s * 7, s * 7 + 7).map((n, i) => {
                    const evs = n ? eventos.filter((e) => e.dia === n) : [];
                    const hojeCel = ehMesAtual && n === hoje.dia;
                    return (
                      <td key={i} className="p-0">
                        {n ? (
                          <div
                            className={cn(
                              'flex aspect-square flex-col items-center justify-center gap-1 rounded-[10px] border text-sm',
                              hojeCel
                                ? 'border-green bg-green-soft'
                                : evs.length
                                  ? 'bg-surface-2 border-transparent'
                                  : 'border-transparent',
                            )}
                            aria-current={hojeCel ? 'date' : undefined}
                          >
                            <span>
                              {n}
                              {evs.length ? (
                                <span className="sr-only">
                                  : {evs.map((e) => e.titulo).join('; ')}
                                </span>
                              ) : null}
                            </span>
                            <span aria-hidden="true" className="flex h-[5px] gap-[3px]">
                              {evs.map((e) => (
                                <span
                                  key={e.id}
                                  className="size-[5px] rounded-full"
                                  style={{ background: e.cor }}
                                />
                              ))}
                            </span>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {eventos.length === 0 ? (
            <li className="rounded-card border-line-2 text-muted border border-dashed p-8 text-center">
              Nenhuma atividade neste período.
            </li>
          ) : null}
          {eventos.map((e) => (
            <li
              key={e.id}
              className="border-line grid grid-cols-[64px_minmax(0,1fr)] gap-[18px] rounded-[18px] border bg-white p-5"
            >
              <div className="border-line-soft border-r pr-3.5 text-center" aria-hidden="true">
                <div className="text-muted-2 text-xs uppercase">{e.diaSemanaCurto}</div>
                <div className="font-serif text-[32px] leading-[1.1]">{e.dia}</div>
                <div className="text-muted-2 text-xs">{e.mesCurto}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Categoria cor={e.cor}>{e.categoria}</Categoria>
                <h2 className="m-0 font-serif text-[21px] leading-[1.25] font-normal">
                  {e.titulo}
                </h2>
                <p className="sr-only">
                  {e.diaSemana}, {e.dia} de {e.mesLongo}
                </p>
                <p className="text-muted m-0 text-sm">
                  {e.horario} · {e.local} · {e.quem}
                </p>
                <p className="text-muted m-0 text-sm leading-normal">{e.descricao}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <Link
                    href={e.url}
                    aria-label={`Detalhes e inscrição: ${e.titulo}`}
                    className="rounded-pill bg-green hover:bg-green-dark inline-flex min-h-11 items-center px-3.5 py-2 text-[13px] font-medium text-white no-underline hover:text-white hover:no-underline"
                  >
                    Detalhes e inscrição
                  </Link>
                  <AcoesEvento slug={e.slug} titulo={e.titulo} url={e.url} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Secao>
  );
}
