import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatarCentavos } from '@ceak/core/format';
import { prisma } from '@ceak/db';
import { Secao } from '@/components/Elementos';
import { PagamentoPix } from '@/components/PagamentoPix';
import { Sucesso } from '@/components/Sucesso';
import { jaFizPix } from '../actions';
import { BotaoJaFizPix } from '../BotaoJaFizPix';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Doação', robots: { index: false } };

export default async function DoacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const d = await prisma.doacao.findUnique({
    where: { id },
    select: {
      id: true,
      valorCentavos: true,
      statusPagamento: true,
      brCode: true,
      doadorEmail: true,
    },
  });
  if (!d || !d.valorCentavos) notFound();
  const valor = formatarCentavos(d.valorCentavos);

  if (d.statusPagamento === 'PAGO') {
    return (
      <Secao estreita={640} className="pt-14 pb-20">
        <Sucesso titulo="Obrigado pela sua doação">
          <p className="text-muted m-0 max-w-[440px] text-[17px] leading-[1.6]">
            Recebemos {valor}.{d.doadorEmail ? ' O comprovante foi enviado por e-mail e a' : ' A'}{' '}
            doação aparece no relatório de transparência do mês.
          </p>
          <div className="mt-2.5 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/"
              className="rounded-pill bg-green hover:bg-green-dark inline-flex min-h-11 items-center px-[22px] py-3 text-[15px] text-white no-underline hover:text-white"
            >
              Voltar ao início
            </Link>
            <Link
              href="/quero-ajudar"
              className="rounded-pill border-line-3 text-ink inline-flex min-h-11 items-center border bg-white px-[22px] py-3 text-[15px] no-underline"
            >
              Outras formas de ajudar
            </Link>
          </div>
        </Sucesso>
      </Secao>
    );
  }

  return (
    <Secao estreita={640} className="pt-14 pb-20">
      <h1 className="m-0 mb-2 font-serif text-[40px] font-medium">Pague com PIX</h1>
      <p className="text-muted m-0 mb-6 text-[17px]">
        Abra o app do seu banco e escaneie o código.
      </p>
      <div className="border-line rounded-card-lg flex flex-col items-center gap-[18px] border bg-white p-7">
        <p className="m-0 font-serif text-[38px]">{valor}</p>
        {d.brCode ? <PagamentoPix brCode={d.brCode} rotulo={`doação de ${valor}`} /> : null}
        <BotaoJaFizPix id={d.id} acao={jaFizPix} />
      </div>
    </Secao>
  );
}
