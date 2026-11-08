import type { Metadata } from 'next';
import Link from 'next/link';
import { comRls } from '@ceak/db';
import { TituloPagina } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';

export const metadata: Metadata = { title: 'Relatórios de BI' };
export const dynamic = 'force-dynamic';

const dinheiro = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function periodos() {
  const agora = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const inicio = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - 5 + i, 1, 3));
    const fim = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - 4 + i, 1, 3));
    const titulo = new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(inicio);
    return { inicio, fim, titulo };
  });
}

export default async function RelatoriosBi() {
  const sessao = await exigirModulo('bi');
  const meses = periodos();
  const serie = await comRls(contextoRls(sessao), async (tx) =>
    Promise.all(
      meses.map(async (periodo) => {
        const [doacoes, pedidos, presencas, eventos] = await Promise.all([
          tx.doacao.aggregate({
            where: { pagoEm: { gte: periodo.inicio, lt: periodo.fim }, statusPagamento: 'PAGO' },
            _sum: { valorCentavos: true },
          }),
          tx.pedido.aggregate({
            where: { pagoEm: { gte: periodo.inicio, lt: periodo.fim }, statusPagamento: 'PAGO' },
            _sum: { totalCentavos: true },
          }),
          tx.checkin.count({ where: { criadoEm: { gte: periodo.inicio, lt: periodo.fim } } }),
          tx.evento.count({ where: { inicio: { gte: periodo.inicio, lt: periodo.fim } } }),
        ]);
        return {
          mes: periodo.titulo,
          doacoes: doacoes._sum.valorCentavos ?? 0,
          pedidos: pedidos._sum.totalCentavos ?? 0,
          presencas,
          eventos,
        };
      }),
    ),
  );
  const total = (chave: 'doacoes' | 'pedidos' | 'presencas' | 'eventos') =>
    serie.reduce((soma, linha) => soma + linha[chave], 0);
  const maxPresencas = Math.max(1, ...serie.map((linha) => linha.presencas));
  const maxEventos = Math.max(1, ...serie.map((linha) => linha.eventos));
  return (
    <div className="flex flex-col gap-5">
      <TituloPagina
        sub="Últimos seis meses · registros reais"
        acoes={
          <Link href="/bi" className="border-line rounded-input border bg-white px-4 py-2 text-sm">
            Voltar ao BI
          </Link>
        }
      >
        Relatório operacional
      </TituloPagina>
      <p className="border-line rounded-card m-0 border bg-white p-4 text-sm">
        Consolidação dos registros confirmados no CEAK. Períodos mensais no horário de São Paulo,
        sem projeções ou dados de demonstração. Valores financeiros representam recebimentos
        registrados e não comprovam conciliação bancária.
      </p>
      <section
        aria-label="Totais dos seis meses"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          { nome: 'Doações financeiras recebidas', valor: dinheiro(total('doacoes')) },
          { nome: 'Pedidos pagos', valor: dinheiro(total('pedidos')) },
          { nome: 'Check-ins registrados', valor: String(total('presencas')) },
          { nome: 'Eventos programados', valor: String(total('eventos')) },
        ].map((item) => (
          <div key={item.nome} className="border-line rounded-card border bg-white p-4">
            <p className="text-muted-2 m-0 text-sm">{item.nome}</p>
            <p className="mt-2 mb-0 font-serif text-2xl">{item.valor}</p>
          </div>
        ))}
      </section>
      <section className="border-line rounded-card border bg-white p-5">
        <h2 className="mt-0 text-lg font-semibold">Presenças e eventos por mês</h2>
        <div
          className="flex h-52 items-end justify-between gap-3"
          role="img"
          aria-label="Barras de presenças e eventos por mês; os valores exatos estão na tabela abaixo"
        >
          {serie.map((item) => (
            <div
              key={item.mes}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="flex h-36 w-full items-end justify-center gap-1" aria-hidden="true">
                <div
                  className="bg-green w-1/3 rounded-t"
                  style={{ height: `${(100 * item.presencas) / maxPresencas}%` }}
                />
                <div
                  className="w-1/3 rounded-t bg-[#be9961]"
                  style={{ height: `${(100 * item.eventos) / maxEventos}%` }}
                />
              </div>
              <span className="text-muted-2 text-center text-[11px]">{item.mes}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <span>● Presenças registradas</span>
          <span>◆ Eventos cadastrados</span>
        </div>
      </section>
      <section className="border-line rounded-card overflow-x-auto border bg-white">
        <h2 className="m-0 p-4 text-lg font-semibold">Detalhamento mensal</h2>
        <table className="w-full min-w-[660px] text-left text-sm">
          <thead className="bg-[#f5f1e8]">
            <tr>
              <th className="p-3">Mês</th>
              <th className="p-3">Doações recebidas</th>
              <th className="p-3">Pedidos pagos</th>
              <th className="p-3">Presenças</th>
              <th className="p-3">Eventos</th>
            </tr>
          </thead>
          <tbody>
            {serie.map((item) => (
              <tr key={item.mes} className="border-line border-t">
                <th scope="row" className="p-3">
                  {item.mes}
                </th>
                <td className="p-3">{dinheiro(item.doacoes)}</td>
                <td className="p-3">{dinheiro(item.pedidos)}</td>
                <td className="p-3">{item.presencas}</td>
                <td className="p-3">{item.eventos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
