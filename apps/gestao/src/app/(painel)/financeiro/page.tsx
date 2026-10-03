import type { Metadata } from 'next';
import { dashboardFinanceiro } from '@ceak/db';
import { Barras, BarrasHorizontais } from '@/components/Graficos';
import { Cartao, Indicadores } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { reais } from '@/lib/formato';

export const metadata: Metadata = { title: 'Financeiro' };
export const dynamic = 'force-dynamic';

export default async function DashboardFinanceiroPage() {
  const s = await exigirModulo('financeiro');
  const d = await dashboardFinanceiro(contextoRls(s));
  const k = d.kpis;
  return (
    <>
      <p className="text-muted-2 m-0 text-[13px]">Realizado em {d.mes} (último mês fechado)</p>
      <Indicadores
        min={170}
        tamanho={28}
        itens={[
          { rotulo: 'Receitas', valor: reais(k.receitas), tom: 'verde' },
          { rotulo: 'Despesas', valor: reais(k.despesas), tom: 'ocre' },
          { rotulo: 'Saldo', valor: reais(k.saldo), tom: k.saldo < 0 ? 'erro' : undefined },
          { rotulo: 'Doações', valor: reais(k.doacoes) },
          { rotulo: 'Loja', valor: reais(k.loja) },
        ]}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        <Cartao
          titulo="Receita × despesa"
          extra={
            <span className="flex gap-3">
              <span className="text-green">■ Receita</span>
              <span className="text-[#7A5A1E]">■ Despesa</span>
            </span>
          }
        >
          <Barras
            titulo="Receita e despesa por mês"
            altura={180}
            rotulos={d.serie.map((m) => m.rotulo)}
            formatar={reais}
            series={[
              { nome: 'Receita', valores: d.serie.map((m) => m.receitas), cor: '#2F5D46' },
              { nome: 'Despesa', valores: d.serie.map((m) => m.despesas), cor: '#B5833A' },
            ]}
          />
        </Cartao>
        <Cartao titulo="Fluxo de caixa · saldo do mês" extra={d.periodo}>
          <Barras
            titulo="Saldo de cada mês"
            altura={180}
            mostrarValor
            formatar={reais}
            rotulos={d.serie.map((m) => m.rotulo)}
            series={[
              {
                nome: 'Saldo',
                valores: d.serie.map((m) => Math.max(0, m.receitas - m.despesas)),
                cor: '#7FA08C',
              },
            ]}
          />
        </Cartao>
        <Cartao titulo="Receita por origem">
          <BarrasHorizontais
            titulo="Receita por origem"
            itens={d.receitasPorOrigem}
            cor="verde"
            formatar={reais}
          />
        </Cartao>
        <Cartao titulo="Despesa por categoria">
          <BarrasHorizontais
            titulo="Despesa por categoria"
            itens={d.despesasPorCategoria}
            cor="ocre"
            formatar={reais}
          />
        </Cartao>
      </div>
    </>
  );
}
