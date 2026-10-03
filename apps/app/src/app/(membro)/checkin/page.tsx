import type { Metadata } from 'next';
import { formatarHora, mesmoDia } from '@ceak/core/format';
import { checkinAberto } from '@ceak/core/regras';
import { atividadeParaCheckin, prisma } from '@ceak/db';
import { Tela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';
import { FluxoCheckin, type AtividadeCheckin } from './FluxoCheckin';

export const metadata: Metadata = { title: 'Check-in' };
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function descrever(
  e: { titulo: string; tipo: string; inicio: Date; fim: Date | null; local: string | null },
  agora: Date,
): AtividadeCheckin['descricao'] {
  const quando = mesmoDia(e.inicio, agora)
    ? `hoje, ${formatarHora(e.inicio)}`
    : formatarHora(e.inicio);
  return [e.tipo === 'PALESTRA' ? 'Palestra Pública' : e.titulo, quando, e.local]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Check-in por QR Code (câmera do App ou do celular, que abre
 * `/checkin?evento=…&t=…`) ou confirmação manual da atividade de hoje.
 */
export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string; t?: string }>;
}) {
  await exigirSessao();
  const { evento, t } = await searchParams;
  const agora = new Date();

  let doQr: AtividadeCheckin | null = null;
  if (evento && UUID.test(evento)) {
    const e = await prisma.evento.findUnique({
      where: { id: evento },
      select: { id: true, titulo: true, tipo: true, inicio: true, fim: true, local: true },
    });
    if (e) {
      doQr = {
        id: e.id,
        descricao: descrever(e, agora),
        aberto: checkinAberto(e.inicio, e.fim, agora),
        token: t ?? '',
      };
    }
  }
  const hoje = doQr ? null : await atividadeParaCheckin(agora);
  const atividade: AtividadeCheckin | null =
    doQr ?? (hoje ? { id: hoje.id, descricao: descrever(hoje, agora), aberto: hoje.aberto } : null);

  return (
    <Tela titulo="Check-in">
      <FluxoCheckin atividade={atividade} doQr={!!doQr} />
    </Tela>
  );
}
