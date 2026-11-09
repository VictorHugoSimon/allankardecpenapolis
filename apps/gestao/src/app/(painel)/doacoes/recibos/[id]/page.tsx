import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { comRls } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';

export const metadata: Metadata = { title: 'Prévia de agradecimento de doação' };
export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dataBR = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const dinheiroBR = (n: number) => (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function PreviaAgradecimentoPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const sessao = await exigirModulo('doacoes');
  if (!['ADMINISTRADOR', 'TESOURARIA'].includes(sessao.perfil)) notFound();
  const { id } = await params;
  if (!uuid.test(id)) notFound();

  const doacao = await comRls(contextoRls(sessao), async tx =>
    tx.doacao.findFirst({
      where: { id, statusPagamento: 'PAGO', pagoEm: { not: null } },
      select: {
        id: true, doadorNome: true, pessoaId: true, pessoa: { select: { nome: true } },
        forma: true, valorCentavos: true, itemDescricao: true, destino: true,
        pagoEm: true, reciboEmitidoEm: true, campanha: { select: { titulo: true } },
      },
    }),
  );
  if (!doacao?.pagoEm) notFound();
  const nome = doacao.doadorNome || doacao.pessoa?.nome || 'Apoiador(a) do CEAK';
  const descricao = doacao.valorCentavos != null
    ? `contribuição de ${dinheiroBR(doacao.valorCentavos)}`
    : `doação de itens: ${doacao.itemDescricao || 'itens recebidos'}`;
  return (
    <div className="flex flex-col gap-5">
      <Link href="/doacoes/recibos" className="text-sm underline">Voltar à conferência de doações</Link>
      <section className="border-line rounded-card border bg-white p-6">
        <p className="text-muted-2 text-xs font-semibold uppercase tracking-wide">
          Prévia administrativa · não emitida · não enviada
        </p>
        <h1 className="mt-3 font-serif text-2xl">Agradecimento por contribuição solidária</h1>
        <p>Olá, {nome}.</p>
        <p>
          O Centro Espírita Allan Kardec agradece sua contribuição. Consta em nossos
          registros uma {descricao}, com data de confirmação de {dataBR(doacao.pagoEm)}.
        </p>
        <p>Destinação registrada: {doacao.destino}.</p>
        {doacao.campanha && <p>Campanha vinculada: {doacao.campanha.titulo}.</p>}
        <p>Sua colaboração fortalece as atividades solidárias do CEAK. Muito obrigado!</p>
        <p className="text-muted-2 text-xs">
          Referência administrativa: {doacao.id}. Este texto é uma prévia de agradecimento,
          não representa comprovante bancário, nota fiscal, recibo fiscal ou certificação
          de dedutibilidade tributária. A confirmação decorre exclusivamente do registro
          interno e deve ser conciliada com a documentação correspondente.
        </p>
        <p className="text-muted-2 text-xs">
          Recibo emitido no sistema: {doacao.reciboEmitidoEm ? dataBR(doacao.reciboEmitidoEm) : 'não registrado'}.
        </p>
      </section>
      <p className="text-muted-2 text-sm">
        A simples visualização não marca o recibo como emitido, não atualiza pagamento
        e não envia e-mail, WhatsApp ou notificação.
      </p>
    </div>
  );
}
