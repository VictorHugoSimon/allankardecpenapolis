import Link from 'next/link';
import { formatarCentavos } from '@ceak/core/format';
import { contas, referenciaDoMes } from '@ceak/db';
import { buttonClasses, Pill, Table } from '@ceak/ui';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { AcoesLancamento } from './AcoesLancamento';

const chave = (d: Date, delta: number) => {
  const x = new Date(d.getFullYear(), d.getMonth() + delta, 15);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
};

/** Lista de contas a pagar ou a receber do mês. */
export async function Contas({ tipo, mes }: { tipo: 'PAGAR' | 'RECEBER'; mes?: string }) {
  const s = await exigirModulo('financeiro');
  const ref = referenciaDoMes(mes) ?? new Date();
  const c = await contas(contextoRls(s), tipo, ref);
  const base = tipo === 'PAGAR' ? '/financeiro/pagar' : '/financeiro/receber';
  const pagar = tipo === 'PAGAR';
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`${base}?mes=${chave(ref, -1)}`}
          aria-label="Mês anterior"
          className="border-line-admin text-ink flex size-9 items-center justify-center rounded-lg border bg-white no-underline"
        >
          ‹
        </Link>
        <Link
          href={`${base}?mes=${chave(ref, 1)}`}
          aria-label="Próximo mês"
          className="border-line-admin text-ink flex size-9 items-center justify-center rounded-lg border bg-white no-underline"
        >
          ›
        </Link>
        <p className="text-muted-2 m-0 flex-1 text-sm">
          {c.mes} · {c.linhas.length} {c.linhas.length === 1 ? 'lançamento' : 'lançamentos'} ·{' '}
          {formatarCentavos(c.total)}
        </p>
        <Link
          href={`/financeiro/novo?tipo=${tipo}`}
          className={buttonClasses({ shape: 'rounded', size: 'sm' })}
        >
          Novo lançamento
        </Link>
      </div>
      <Table
        caption={`${pagar ? 'Contas a pagar' : 'Contas a receber'} · ${c.mes}`}
        rows={c.linhas}
        rowKey={(l) => l.id}
        empty="Nenhum lançamento neste mês."
        className="[&_table]:min-w-[1180px]"
        columns={[
          { key: 'cp', header: pagar ? 'Fornecedor' : 'Origem', cell: (l) => l.contraparte },
          { key: 'desc', header: 'Descrição', cell: (l) => l.descricao },
          { key: 'cat', header: 'Categoria', cell: (l) => l.categoria },
          ...(pagar
            ? [
                {
                  key: 'cc',
                  header: 'Centro de custo',
                  cell: (l: (typeof c.linhas)[number]) => l.centroCusto,
                },
              ]
            : []),
          { key: 'venc', header: 'Vencimento', cell: (l) => l.vencimento },
          {
            key: 'valor',
            header: 'Valor',
            align: 'right' as const,
            cell: (l) => (
              <span className="whitespace-nowrap tabular-nums">
                {formatarCentavos(l.valorCentavos)}
              </span>
            ),
          },
          { key: 'status', header: 'Status', cell: (l) => <Pill tone={l.tom}>{l.rotulo}</Pill> },
          ...(pagar
            ? [
                {
                  key: 'resp',
                  header: 'Responsável',
                  cell: (l: (typeof c.linhas)[number]) => l.responsavel,
                },
              ]
            : []),
          {
            key: 'acoes',
            header: 'Ações',
            cell: (l) => (
              <AcoesLancamento
                id={l.id}
                acoes={l.acoes}
                descricao={`${l.contraparte} — ${l.descricao}`}
                receber={!pagar}
              />
            ),
          },
        ]}
      />
    </>
  );
}
