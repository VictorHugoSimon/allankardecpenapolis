import type { Metadata } from 'next';
import Link from 'next/link';
import { formatarCentavos } from '@ceak/core/format';
import { painelConciliacao, referenciaDoMes } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { Indicadores } from '@/components/Pagina';
import { reais } from '@/lib/formato';
import { BotaoConfirmar } from './BotaoConfirmar';

export const metadata: Metadata = { title: 'Conciliação bancária' };
export const dynamic = 'force-dynamic';

function mesAdjacente(ref: Date, delta: number) {
  const d = new Date(ref.getFullYear(), ref.getMonth() + delta, 15);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const rotulos = {
  PENDENTE: 'Pendente',
  SUGERIDO: 'Sugerido',
  CONCILIADO: 'Conciliado',
  DIVERGENTE: 'Divergente',
} as const;

export default async function ConciliacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const s = await exigirModulo('financeiro');
  const params = await searchParams;
  const ref = referenciaDoMes(params.mes) ?? new Date();
  const dados = await painelConciliacao(contextoRls(s), ref);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 flex-1 text-lg font-semibold">Conciliação bancária</h2>
        <Link
          href={`/financeiro/conciliacao?mes=${mesAdjacente(ref, -1)}`}
          aria-label="Mês anterior"
          className="border-line-admin rounded-lg border bg-white px-3 py-2 no-underline"
        >
          ‹ Anterior
        </Link>
        <Link
          href={`/financeiro/conciliacao?mes=${mesAdjacente(ref, 1)}`}
          aria-label="Próximo mês"
          className="border-line-admin rounded-lg border bg-white px-3 py-2 no-underline"
        >
          Próximo ›
        </Link>
      </div>
      <p className="text-muted-2 m-0 text-sm">
        Conferência de extratos já cadastrados, sem alterar lançamentos ou confirmar automaticamente
        pagamentos. Uma sugestão não equivale a uma conciliação aprovada.
      </p>
      <Indicadores
        min={150}
        tamanho={23}
        itens={[
          { rotulo: 'Linhas do extrato', valor: String(dados.total) },
          { rotulo: 'Pendentes', valor: String(dados.pendentes) },
          { rotulo: 'Sugestões', valor: String(dados.sugeridas) },
          { rotulo: 'Conciliadas', valor: String(dados.conciliadas), tom: 'verde' },
          { rotulo: 'Atenções', valor: String(dados.divergentes), tom: 'ocre' },
        ]}
      />
      <p className="text-muted-2 m-0 text-sm">
        Créditos no extrato: <strong>{reais(dados.creditoCentavos)}</strong> · Débitos no extrato:{' '}
        <strong>{reais(dados.debitoCentavos)}</strong>
      </p>
      <div className="border-line rounded-xl border bg-white p-4">
        <h3 className="m-0 text-base font-semibold">Conciliação bancária: configuração futura</h3>
        <p className="text-muted-2 mt-2 mb-0 text-sm">
          O CEAK começa sem contas bancárias, extratos importados ou dados fictícios. O cadastro de
          contas e a importação de arquivos ficarão para uma etapa posterior. Esta tela permanece
          disponível apenas para consultar movimentações existentes.
        </p>
      </div>
      <div className="border-line overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <caption className="p-3 text-left font-semibold">
            Movimentações do extrato — {dados.periodo}
          </caption>
          <thead className="bg-surface-2">
            <tr>
              {[
                'Data',
                'Descrição',
                'Valor',
                'Status',
                'Lançamento vinculado',
                'Conferência',
                'Sugestão para revisão',
              ].map((h) => (
                <th key={h} scope="col" className="px-3 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.linhas.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted-2 p-5">
                  Nenhuma movimentação de extrato cadastrada neste mês. Não significa que o banco
                  não teve movimentação.
                </td>
              </tr>
            )}
            {dados.linhas.map((l) => (
              <tr key={l.id} className="border-line-soft border-t">
                <td className="px-3 py-3 whitespace-nowrap">
                  {l.data.toISOString().slice(0, 10).split('-').reverse().join('/')}
                </td>
                <td className="px-3 py-3">{l.descricao}</td>
                <td
                  className={`px-3 py-3 text-right tabular-nums ${l.valorCentavos < 0 ? 'text-danger' : ''}`}
                >
                  {formatarCentavos(l.valorCentavos)}
                </td>
                <td className="px-3 py-3">{rotulos[l.status]}</td>
                <td className="px-3 py-3">
                  {l.lancamento?.contraparte ?? l.referencia ?? 'Sem vínculo'}
                </td>
                <td className="px-3 py-3">
                  {l.alerta ?? (l.status === 'CONCILIADO' ? 'Conferido' : 'Aguardando validação')}
                </td>
                <td className="px-3 py-3">
                  {l.sugestao.candidato ? (
                    <span className="flex flex-col gap-2">
                      <span>
                        Possível: {l.sugestao.candidato.contraparte} (
                        {l.sugestao.candidato.dataPagamento})
                      </span>
                      <BotaoConfirmar
                        extratoId={l.id}
                        lancamentoId={l.sugestao.candidato.id}
                        descricao={l.descricao}
                      />
                    </span>
                  ) : (
                    l.sugestao.motivo
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
