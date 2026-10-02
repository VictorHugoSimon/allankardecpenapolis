import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatarCentavos } from '@ceak/core/format';
import { prisma } from '@ceak/db';
import { Secao } from '@/components/Elementos';
import { PagamentoPix } from '@/components/PagamentoPix';
import { Sucesso } from '@/components/Sucesso';
import { BotaoJaFizPix } from '../../doar/BotaoJaFizPix';
import { jaFizPixPedido } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Pedido', robots: { index: false } };

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const p = await prisma.pedido.findUnique({
    where: { id },
    select: {
      id: true,
      numero: true,
      totalCentavos: true,
      status: true,
      statusPagamento: true,
      brCode: true,
      itens: { select: { quantidade: true, produto: { select: { nome: true } } } },
    },
  });
  if (!p) notFound();
  const total = formatarCentavos(p.totalCentavos);

  if (p.statusPagamento === 'PAGO') {
    return (
      <Secao estreita={640} className="pt-[72px] pb-20">
        <Sucesso titulo={`Pedido nº ${p.numero} confirmado`}>
          <p className="text-muted m-0 max-w-[460px] text-[17px] leading-[1.6]">
            {p.status === 'RETIRADO'
              ? 'Pedido já retirado. Obrigado por apoiar a assistência social do CEAK.'
              : `Pagamento de ${total} recebido. Seu pedido estará separado na recepção a partir de amanhã, 19h.`}
          </p>
          <Link
            href="/loja"
            className="rounded-pill border-line-3 text-ink mt-2.5 inline-flex min-h-11 items-center border bg-white px-[22px] py-3 text-[15px] no-underline hover:no-underline"
          >
            Continuar na loja
          </Link>
        </Sucesso>
      </Secao>
    );
  }

  return (
    <Secao estreita={640} className="pt-14 pb-20">
      <h1 className="m-0 mb-2 font-serif text-[40px] font-medium">Pedido nº {p.numero}</h1>
      <p className="text-muted m-0 mb-6 text-[17px]">
        Abra o app do seu banco e escaneie o código.
      </p>
      <ul className="border-line m-0 mb-4 list-none rounded-[18px] border bg-white px-6 py-4">
        {p.itens.map((i, k) => (
          <li key={k} className="flex justify-between py-1 text-[15px]">
            <span>{i.produto.nome}</span>
            <span className="text-muted">× {i.quantidade}</span>
          </li>
        ))}
      </ul>
      <div className="border-line rounded-card-lg flex flex-col items-center gap-4 border bg-white p-[26px]">
        <p className="text-muted m-0 text-[15px]">Total via PIX</p>
        <p className="m-0 font-serif text-[38px]">{total}</p>
        {p.brCode ? (
          <PagamentoPix brCode={p.brCode} tamanho={200} rotulo={`pedido de ${total}`} />
        ) : null}
        <BotaoJaFizPix id={p.id} acao={jaFizPixPedido} />
      </div>
    </Secao>
  );
}
