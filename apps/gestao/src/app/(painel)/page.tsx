import Link from 'next/link';
import type { Metadata } from 'next';
import { formatarDataExtenso, formatarHora } from '@ceak/core/format';
import { podeAcessar } from '@ceak/core/rbac';
import { alertasDoPainel, painelGeral, quadrosDoPainel } from '@ceak/db';
import { cn } from '@ceak/ui';
import { Barras } from '@/components/Graficos';
import { Cartao, Indicadores } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { numero, reais } from '@/lib/formato';

export const metadata: Metadata = { title: 'Visão Geral' };
export const dynamic = 'force-dynamic';

const COR = { err: 'bg-danger', warn: 'bg-ochre', ok: 'bg-green' } as const;

export default async function VisaoGeralPage() {
  const s = await exigirModulo('dashboard');
  const agora = new Date();
  const [p, alertas, quadros] = await Promise.all([
    painelGeral({ ...contextoRls(s), perfil: s.perfil }, agora),
    alertasDoPainel(s.perfil, agora),
    quadrosDoPainel(s.perfil, agora),
  ]);
  const k = p.kpis;
  const e = p.engajamento;
  const fmt1 = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const podeAprovar = podeAcessar(s.perfil, 'aprovacoes');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-2 m-0 text-[13px]">{formatarDataExtenso(agora)}</p>
          <h1 className="mt-1 mb-0 font-serif text-4xl font-medium">CEAK Command Center</h1>
        </div>
        <p className="text-muted-2 m-0 text-[13px]">Dados atualizados às {formatarHora(agora)}</p>
      </div>

      <Indicadores
        itens={[
          {
            rotulo: 'Pessoas',
            valor: numero(k.pessoas),
            detalhe: `+${k.pessoasNoMes} no mês`,
            tom: 'positivo',
          },
          {
            rotulo: 'Membros ativos',
            valor: numero(k.membros),
            detalhe: `+${k.membrosNoMes}`,
            tom: 'positivo',
          },
          { rotulo: 'Visitantes', valor: numero(k.visitantes), detalhe: 'últimos 30 dias' },
          { rotulo: 'Check-ins', valor: numero(k.checkins30), detalhe: 'últimos 30 dias' },
          { rotulo: 'Eventos', valor: numero(k.eventosMes), detalhe: 'no mês' },
          { rotulo: 'Alunos', valor: numero(k.alunos), detalhe: `${k.turmasAtivas} turmas` },
          { rotulo: 'Voluntários', valor: numero(k.voluntarios), detalhe: `${k.areas} áreas` },
        ]}
      />

      <div className="flex flex-wrap items-stretch gap-4">
        <Cartao
          className="flex-[2_1_520px]"
          titulo="Engajamento · check-ins por semana"
          extra="últimas 12 semanas"
        >
          <Barras
            titulo="Check-ins por semana nas últimas 12 semanas"
            rotulos={e.porSemana.map((_, i) => (i === 11 ? 'atual' : `-${11 - i}`))}
            series={[{ nome: 'Check-ins', valores: e.porSemana, cor: '#9DB8A6' }]}
            mostrarValor
            destaqueUltimo
          />
          <dl className="m-0 mt-4 grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-3">
            {[
              ['Visitantes', numero(k.visitantes)],
              ['Taxa de retorno', e.taxaRetorno === null ? '—' : `${e.taxaRetorno}%`],
              [
                'Frequência média',
                e.frequenciaMedia === null ? '—' : `${fmt1(e.frequenciaMedia)}/mês`,
              ],
              ['NPS', e.nps === null ? '—' : String(e.nps)],
              ['Avaliação média', e.mediaNotas === null ? '—' : `${fmt1(e.mediaNotas)} / 5`],
            ].map(([l, v]) => (
              <div key={l} className="flex flex-col-reverse">
                <dt className="text-muted-2 text-xs">{l}</dt>
                <dd className="m-0 text-xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </Cartao>
        <Cartao className="flex flex-[1_1_300px] flex-col" titulo="Alertas">
          {alertas.length ? (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {alertas.map((a) => (
                <li key={a.titulo + a.detalhe}>
                  <Link
                    href={a.href}
                    className="bg-surface-2 text-ink hover:text-ink flex gap-2.5 rounded-[10px] border border-[#F0EBE0] p-2.5 no-underline hover:no-underline"
                  >
                    <span
                      aria-hidden="true"
                      className={cn('mt-1.5 size-2 flex-none rounded-full', COR[a.tom])}
                    />
                    <span>
                      <span className="block text-sm font-medium">{a.titulo}</span>
                      <span className="text-muted-2 block text-[13px]">{a.detalhe}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-2 m-0 text-sm">Nenhum alerta no momento.</p>
          )}
        </Cartao>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
        {p.financeiro ? (
          <Link
            href="/financeiro"
            className="bg-green-dark text-bg hover:text-bg rounded-card block p-5 no-underline hover:no-underline"
          >
            <span className="flex justify-between text-[15px] font-semibold">
              <span>Financeiro · {p.financeiro.mes}</span>
              <span className="text-green-on-dark-2 text-xs" aria-hidden="true">
                Abrir ›
              </span>
            </span>
            <span className="mt-4 grid grid-cols-3 gap-2.5">
              {[
                ['Receitas', p.financeiro.receitas],
                ['Despesas', p.financeiro.despesas],
                ['Saldo', p.financeiro.receitas - p.financeiro.despesas],
              ].map(([l, v]) => (
                <span key={l as string}>
                  <span className="text-green-on-dark-2 block text-xs">{l}</span>
                  <span className="block text-[19px] font-semibold">{reais(v as number)}</span>
                </span>
              ))}
            </span>
          </Link>
        ) : null}
        <Cartao
          titulo="Aguardando aprovação"
          extra={podeAprovar ? <Link href="/aprovacoes">Central ›</Link> : undefined}
        >
          <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
            {p.aprovacoes.map((c) => {
              const corpo = (
                <>
                  <span className="block text-xl font-semibold">{c.total}</span>
                  <span className="text-muted-2 block text-xs">{c.rotulo}</span>
                </>
              );
              return (
                <li key={c.tipo}>
                  {podeAprovar ? (
                    <Link
                      href={`/aprovacoes?tipo=${c.tipo}`}
                      className="bg-bg text-ink hover:text-ink block rounded-[10px] p-2.5 no-underline hover:no-underline"
                    >
                      {corpo}
                    </Link>
                  ) : (
                    <div className="bg-bg rounded-[10px] p-2.5">{corpo}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Cartao>
        <Cartao
          titulo="Saúde do sistema"
          extra={(() => {
            const n = p.saude.filter((x) => !x.ok).length;
            return n ? (
              <span className="text-[#7A5A1E]">
                {n} {n === 1 ? 'atenção' : 'atenções'}
              </span>
            ) : (
              'tudo em ordem'
            );
          })()}
        >
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 p-0">
            {p.saude.map((h) => (
              <li key={h.nome} className="flex items-center gap-1.5 text-[13px]">
                <span
                  aria-hidden="true"
                  className={cn('size-2 rounded-full', h.ok ? 'bg-ok-strong' : 'bg-ochre')}
                />
                {h.nome}
                <span className="sr-only">: {h.ok ? 'online' : 'atenção'}</span>
              </li>
            ))}
          </ul>
        </Cartao>
      </div>

      {quadros.loja || quadros.conteudo || quadros.automacoes ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {quadros.loja ? (
            <Quadro
              titulo={`Loja · ${quadros.loja.mes}`}
              href="/loja"
              itens={[
                ['Produtos ativos', numero(quadros.loja.produtosAtivos)],
                ['Pedidos', numero(quadros.loja.pedidos)],
                ['Vendas', reais(quadros.loja.vendas)],
                [
                  'Ticket médio',
                  (quadros.loja.ticket / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }),
                ],
              ]}
            />
          ) : null}
          {quadros.conteudo ? (
            <Quadro
              titulo="Conteúdo"
              href="/conteudo"
              itens={[
                ['Publicados', numero(quadros.conteudo.publicados)],
                ['Aguardando aprovação', numero(quadros.conteudo.aguardando), 'ocre'],
                ['Agendados', numero(quadros.conteudo.agendados)],
                ['Falhas', numero(quadros.conteudo.falhas), 'erro'],
              ]}
            />
          ) : null}
          {quadros.automacoes ? (
            <Quadro
              titulo="Automações · últimas 24h"
              href="/automacoes"
              itens={[
                ['Execuções', numero(quadros.automacoes.execucoes)],
                [
                  'Taxa de sucesso',
                  quadros.automacoes.sucesso === null
                    ? '—'
                    : `${fmt1(quadros.automacoes.sucesso)}%`,
                ],
                ['Falhas', numero(quadros.automacoes.falhas), 'erro'],
              ]}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Quadro({
  titulo,
  href,
  itens,
}: {
  titulo: string;
  href: string;
  itens: (readonly [string, string, ('ocre' | 'erro')?])[];
}) {
  return (
    <Link
      href={href}
      className="border-line text-ink hover:text-ink hover:border-green rounded-card block border bg-white p-5 no-underline hover:no-underline"
    >
      <span className="mb-3 block text-[15px] font-semibold">{titulo}</span>
      <span className="grid grid-cols-2 gap-3">
        {itens.map(([l, v, tom]) => (
          <span key={l}>
            <span className="text-muted-2 block text-xs">{l}</span>
            <span
              className={cn(
                'block text-xl font-semibold',
                tom === 'ocre' && 'text-[#7A5A1E]',
                tom === 'erro' && 'text-danger',
              )}
            >
              {v}
            </span>
          </span>
        ))}
      </span>
    </Link>
  );
}
