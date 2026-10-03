import type { Metadata } from 'next';
import Link from 'next/link';
import { formatarCentavos } from '@ceak/core/format';
import { prisma } from '@ceak/db';
import { Pill } from '@ceak/ui';
import { Tela } from '@/components/Tela';
import { diaMes } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';

export const metadata: Metadata = { title: 'Minhas contribuições' };
export const dynamic = 'force-dynamic';

const STATUS = {
  PAGO: ['Recebida', 'ok'],
  AGUARDANDO: ['Aguardando PIX', 'warn'],
  CANCELADO: ['Cancelada', 'neutral'],
  ESTORNADO: ['Estornada', 'neutral'],
  EXPIRADO: ['PIX expirado', 'neutral'],
} as const;

export default async function ContribuicoesPage() {
  const s = await exigirSessao();
  const doacoes = await prisma.doacao.findMany({
    where: { pessoaId: s.pessoaId },
    orderBy: { criadoEm: 'desc' },
    take: 30,
    select: {
      id: true,
      criadoEm: true,
      valorCentavos: true,
      itemDescricao: true,
      destino: true,
      statusPagamento: true,
    },
  });
  return (
    <Tela titulo="Minhas contribuições" voltar="/perfil">
      <div className="flex flex-col gap-3">
        {doacoes.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {doacoes.map((d) => {
              const [rotulo, tom] = STATUS[d.statusPagamento];
              const corpo = (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {d.valorCentavos ? formatarCentavos(d.valorCentavos) : d.itemDescricao}
                    </span>
                    <span className="text-muted-2 block text-xs">
                      {d.destino} · {diaMes(d.criadoEm)}
                    </span>
                  </span>
                  <Pill tone={tom}>{rotulo}</Pill>
                </>
              );
              const classe =
                'border-line text-ink hover:text-ink flex items-center gap-3 rounded-[14px] border bg-white px-3.5 py-3 no-underline hover:no-underline';
              return (
                <li key={d.id}>
                  {d.statusPagamento === 'AGUARDANDO' && d.valorCentavos ? (
                    <Link href={`/doar/${d.id}`} className={`${classe} hover:border-green`}>
                      {corpo}
                    </Link>
                  ) : (
                    <div className={classe}>{corpo}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted m-0 text-sm">Nenhuma contribuição registrada ainda.</p>
        )}
        <Link
          href="/doar"
          className="rounded-pill bg-green hover:bg-green-dark flex min-h-12 items-center justify-center p-[15px] text-[15px] font-medium text-white no-underline hover:text-white hover:no-underline"
        >
          Fazer uma doação
        </Link>
      </div>
    </Tela>
  );
}
