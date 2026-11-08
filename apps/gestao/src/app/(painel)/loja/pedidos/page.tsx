import type { Metadata } from 'next';
import Link from 'next/link';
import { comRls } from '@ceak/db';
import { TituloPagina } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { confirmarRetirada } from './actions';

export const metadata: Metadata = { title: 'Pedidos da Loja' };
export const dynamic = 'force-dynamic';

const reais = (n: number) =>
  (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (d: Date) => d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

export default async function PedidosDaLoja() {
  const sessao = await exigirModulo('loja');
  const podeEntregar = ['ADMINISTRADOR', 'DIRETORIA'].includes(sessao.perfil);
  const pedidos = await comRls(contextoRls(sessao), (tx) =>
    tx.pedido.findMany({
      take: 100,
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        numero: true,
        clienteNome: true,
        status: true,
        statusPagamento: true,
        totalCentavos: true,
        criadoEm: true,
        pagoEm: true,
        retiradoEm: true,
        itens: { select: { quantidade: true, produto: { select: { nome: true } } } },
      },
    }),
  );
  const pagos = pedidos.filter((p) => p.statusPagamento === 'PAGO');
  const pendentes = pagos.filter((p) => p.status === 'AGUARDANDO_RETIRADA');
  return (
    <div className="flex flex-col gap-5">
      <TituloPagina
        sub="Últimos 100 pedidos · dados reais"
        acoes={
          <Link
            href="/loja"
            className="border-line rounded-input border bg-white px-4 py-2 text-sm"
          >
            Voltar à Loja
          </Link>
        }
      >
        Pedidos e retiradas
      </TituloPagina>
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumo de pedidos">
        {[
          { nome: 'Pedidos listados', valor: String(pedidos.length) },
          { nome: 'Aguardando retirada', valor: String(pendentes.length) },
          {
            nome: 'Valor dos pedidos pagos',
            valor: reais(pagos.reduce((a, p) => a + p.totalCentavos, 0)),
          },
        ].map((k) => (
          <div key={k.nome} className="border-line rounded-card border bg-white p-4">
            <p className="text-muted-2 m-0 text-sm">{k.nome}</p>
            <p className="mt-2 mb-0 font-serif text-3xl">{k.valor}</p>
          </div>
        ))}
      </section>
      <p className="border-line rounded-card m-0 border bg-white p-4 text-sm">
        Somente pedidos com pagamento confirmado pelo provedor autorizado podem ser marcados como
        retirados. Este painel não gera cobranças nem permite aprovar PIX manualmente.
      </p>
      <section className="border-line rounded-card overflow-x-auto border bg-white">
        <h2 className="m-0 p-4 text-lg font-semibold">Histórico de pedidos</h2>
        {pedidos.length === 0 ? (
          <p className="text-muted-2 m-0 p-5">
            Nenhum pedido registrado. Não foram criados pedidos de exemplo.
          </p>
        ) : (
          <table className="w-full min-w-[730px] text-left text-sm">
            <thead className="bg-[#f5f1e8]">
              <tr>
                <th className="p-3">Pedido</th>
                <th className="p-3">Cliente e itens</th>
                <th className="p-3">Total</th>
                <th className="p-3">Pagamento</th>
                <th className="p-3">Situação / operação</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-line border-t align-top">
                  <td className="p-3">
                    <strong>#{p.numero}</strong>
                    <span className="text-muted-2 mt-1 block text-xs">{data(p.criadoEm)}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-medium">{p.clienteNome}</span>
                    <span className="text-muted-2 mt-1 block text-xs">
                      {p.itens.map((i) => `${i.quantidade} × ${i.produto.nome}`).join(' · ') ||
                        'Sem itens'}
                    </span>
                  </td>
                  <td className="p-3">{reais(p.totalCentavos)}</td>
                  <td className="p-3">{p.statusPagamento}</td>
                  <td className="p-3">
                    <strong className="block">{p.status.replaceAll('_', ' ')}</strong>
                    {p.retiradoEm && (
                      <span className="text-muted-2 mt-1 block text-xs">
                        Retirado em {data(p.retiradoEm)}
                      </span>
                    )}
                    {podeEntregar &&
                    p.status === 'AGUARDANDO_RETIRADA' &&
                    p.statusPagamento === 'PAGO' ? (
                      <form action={confirmarRetirada} className="mt-2">
                        <input type="hidden" name="pedidoId" value={p.id} />
                        <button
                          type="submit"
                          className="border-line rounded-input min-h-11 border bg-white px-3 text-sm font-medium"
                        >
                          Confirmar retirada
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
