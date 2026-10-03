import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatarCentavos } from '@ceak/core/format';
import { prisma } from '@ceak/db';
import { PagamentoPix } from '@/components/PagamentoPix';
import { Sucesso } from '@/components/Sucesso';
import { Tela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';
import { BotaoJaFizPix } from './BotaoJaFizPix';

export const metadata: Metadata = { title: 'Doação' };
export const dynamic = 'force-dynamic';

export default async function DoacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirSessao();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const d = await prisma.doacao.findFirst({
    where: { id, pessoaId: s.pessoaId },
    select: { id: true, valorCentavos: true, statusPagamento: true, brCode: true },
  });
  if (!d || !d.valorCentavos) notFound();
  const valor = formatarCentavos(d.valorCentavos);

  return (
    <Tela titulo="Doação" voltar="/doar">
      {d.statusPagamento === 'PAGO' ? (
        <Sucesso titulo="Doação recebida">
          <p className="text-muted m-0 max-w-[280px] text-[15px] leading-normal">
            {valor} · o recibo foi enviado por e-mail e a contribuição aparece em Minha jornada.
          </p>
        </Sucesso>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="m-0 font-serif text-[32px] font-normal">{valor}</h2>
          <p className="text-muted m-0 text-sm">Abra o app do seu banco e escaneie o código.</p>
          {d.brCode ? (
            <PagamentoPix brCode={d.brCode} tamanho={200} rotulo={`doação de ${valor}`} />
          ) : null}
          <BotaoJaFizPix id={d.id} />
        </div>
      )}
    </Tela>
  );
}
