import type { Metadata } from 'next';
import Link from 'next/link';
import { fluxoCaixaFinanceiro, referenciaDoMes } from '@ceak/db';
import { formatarCentavos } from '@ceak/core/format';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { Barras } from '@/components/Graficos';
import { Cartao, Indicadores } from '@/components/Pagina';
import { reais } from '@/lib/formato';

export const metadata: Metadata = { title: 'Fluxo de caixa' };
export const dynamic = 'force-dynamic';

function mesAdjacente(d: Date, delta: number) {
  const x = new Date(d.getFullYear(), d.getMonth() + delta, 15);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
}

export default async function FluxoCaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const sessao = await exigirModulo('financeiro');
  const params = await searchParams;
  const ref = referenciaDoMes(params.mes) ?? new Date();
  const dados = await fluxoCaixaFinanceiro(contextoRls(sessao), ref);
  const atual = dados.meses[dados.meses.length - 1]!;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 flex-1 text-lg font-semibold">Fluxo de caixa</h2>
        <Link href={`/financeiro/fluxo?mes=${mesAdjacente(ref, -1)}`} aria-label="Mês anterior" className="border-line-admin rounded-lg border bg-white px-3 py-2 no-underline">‹ Anterior</Link>
        <Link href={`/financeiro/fluxo?mes=${mesAdjacente(ref, 1)}`} aria-label="Próximo mês" className="border-line-admin rounded-lg border bg-white px-3 py-2 no-underline">Próximo ›</Link>
      </div>
      <p className="text-muted-2 m-0 text-sm">
        Realizado por data de pagamento; previsto por vencimento de contas abertas. Valores em reais.
        O saldo acumulado abaixo é somente dos seis meses exibidos, não o saldo bancário conciliado.
      </p>
      <Indicadores min={170} tamanho={23} itens={[
        { rotulo: 'Entradas realizadas', valor: reais(atual.entradas), tom: 'verde' },
        { rotulo: 'Saídas realizadas', valor: reais(atual.saidas), tom: 'ocre' },
        { rotulo: 'Saldo realizado', valor: reais(atual.saldo), tom: atual.saldo < 0 ? 'erro' : undefined },
        { rotulo: 'A receber', valor: reais(atual.entradasPrevistas) },
        { rotulo: 'A pagar', valor: reais(atual.saidasPrevistas) },
      ]} />
      <Cartao titulo="Entradas e saídas realizadas" extra={dados.periodo}>
        <Barras titulo="Comparativo realizado por mês" altura={220} formatar={reais}
          rotulos={dados.meses.map((m) => m.rotulo)}
          series={[
            { nome: 'Entradas', valores: dados.meses.map((m) => m.entradas), cor: '#2F5D46' },
            { nome: 'Saídas', valores: dados.meses.map((m) => m.saidas), cor: '#B5833A' },
          ]} />
      </Cartao>
      <div className="border-line overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="p-3 text-left font-semibold">Fluxo de caixa por mês (R$)</caption>
          <thead className="bg-surface-2">
            <tr>{['Mês', 'Entradas', 'Saídas', 'Saldo', 'Acumulado do período', 'A receber', 'A pagar'].map((t) =>
              <th key={t} scope="col" className="px-3 py-3 font-semibold">{t}</th>)}</tr>
          </thead>
          <tbody>
            {dados.meses.map((m) => <tr key={m.rotulo} className="border-line-soft border-t">
              <th scope="row" className="px-3 py-3 font-medium">{m.rotulo}</th>
              {[m.entradas, m.saidas, m.saldo, m.acumuladoPeriodo, m.entradasPrevistas, m.saidasPrevistas].map((v, i) =>
                <td key={i} className={`px-3 py-3 text-right tabular-nums ${v < 0 ? 'text-danger' : ''}`}>{formatarCentavos(v)}</td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
