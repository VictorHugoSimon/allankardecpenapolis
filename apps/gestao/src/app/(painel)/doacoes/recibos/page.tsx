import type { Metadata } from 'next';
import Link from 'next/link';
import { comRls } from '@ceak/db';
import { TituloPagina } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';

export const metadata: Metadata = { title: 'Conferência de doações e agradecimentos' };
export const dynamic = 'force-dynamic';

const dataBR = (data: Date) => data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const dinheiroBR = (centavos: number) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function ConferenciaDoacoesPage() {
  const sessao = await exigirModulo('doacoes');
  if (!['ADMINISTRADOR', 'TESOURARIA'].includes(sessao.perfil)) {
    return <p className="border-line rounded-card border bg-white p-5">Acesso restrito à administração e tesouraria.</p>;
  }
  const resultado = await comRls(contextoRls(sessao), async tx => {
    const [confirmadas, pendentes] = await Promise.all([
      tx.doacao.findMany({
        where: { statusPagamento: 'PAGO', pagoEm: { not: null } },
        orderBy: { pagoEm: 'desc' },
        take: 100,
        select: { id: true, doadorNome: true, pessoaId: true, forma: true,
          valorCentavos: true, itemDescricao: true, destino: true, pagoEm: true, reciboEmitidoEm: true },
      }),
      tx.doacao.count({ where: { statusPagamento: { not: 'PAGO' } } }),
    ]);
    return { confirmadas, pendentes };
  });
  return (
    <div className="flex flex-col gap-5">
      <TituloPagina
        sub="Registros reais · sem confirmação bancária simulada"
        acoes={<Link href="/doacoes" className="border-line rounded-input border bg-white px-4 py-2 text-sm">Voltar a Doações</Link>}
      >
        Conferência de doações e agradecimentos
      </TituloPagina>
      <section className="border-line rounded-card border bg-white p-4 text-sm">
        São exibidas apenas doações registradas como PAGAS e com data de confirmação.
        A prévia de agradecimento não emite recibo, não altera o status financeiro e não envia mensagens.
        Para comprovação bancária ou fiscal, utilize os documentos oficiais adequados.
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border-line rounded-card border bg-white p-4">
          <p className="text-muted-2 text-sm">Confirmadas na lista</p>
          <p className="font-serif text-3xl">{resultado.confirmadas.length}</p>
        </div>
        <div className="border-line rounded-card border bg-white p-4">
          <p className="text-muted-2 text-sm">Ainda sem recibo registrado</p>
          <p className="font-serif text-3xl">{resultado.confirmadas.filter(d => !d.reciboEmitidoEm).length}</p>
        </div>
        <div className="border-line rounded-card border bg-white p-4">
          <p className="text-muted-2 text-sm">Outros estados de pagamento</p>
          <p className="font-serif text-3xl">{resultado.pendentes}</p>
        </div>
      </div>
      {resultado.confirmadas.length === 0
        ? <p className="border-line rounded-card border bg-white p-5">Nenhuma doação confirmada para conferência.</p>
        : <section className="border-line rounded-card overflow-x-auto border bg-white">
            <h2 className="m-0 p-4 text-lg font-semibold">Doações confirmadas — até 100 registros</h2>
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-[#f5f1e8]">
                <tr><th className="p-3">Identificação</th><th className="p-3">Valor ou item</th>
                  <th className="p-3">Confirmação</th><th className="p-3">Recibo</th><th className="p-3">Ação</th></tr>
              </thead>
              <tbody>
                {resultado.confirmadas.map(d => (
                  <tr key={d.id} className="border-line border-t">
                    <td className="p-3">{d.doadorNome ?? (d.pessoaId ? 'Doador cadastrado' : 'Não identificado')}</td>
                    <td className="p-3">{d.valorCentavos != null ? dinheiroBR(d.valorCentavos) : d.itemDescricao ?? 'Doação de itens'}</td>
                    <td className="p-3">{d.pagoEm ? dataBR(d.pagoEm) : '—'}</td>
                    <td className="p-3">{d.reciboEmitidoEm ? dataBR(d.reciboEmitidoEm) : 'Não registrado'}</td>
                    <td className="p-3">
                      <Link href={`/doacoes/recibos/${d.id}`} className="underline">Conferir agradecimento</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>}
    </div>
  );
}
