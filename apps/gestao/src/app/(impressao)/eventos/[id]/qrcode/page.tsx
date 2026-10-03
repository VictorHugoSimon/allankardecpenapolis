import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { urlCheckin } from '@ceak/core/checkin';
import { instituicao } from '@ceak/core';
import { detalheEvento } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { APP_URL, checkinSecret } from '@/lib/servidor';
import { BotaoImprimir } from './BotaoImprimir';

export const metadata: Metadata = { title: 'QR Code do check-in' };
export const dynamic = 'force-dynamic';

/** Cartaz para a entrada do salão: QR Code assinado do check-in desta atividade. */
export default async function QrCheckinPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirModulo('eventos');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const ev = await detalheEvento(id);
  if (!ev || !ev.checkinDisponivel) notFound();
  const url = urlCheckin(APP_URL, ev.id, checkinSecret());
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#1F2A24', light: '#FFFFFF' },
  });
  return (
    <div className="mx-auto flex min-h-screen max-w-[640px] flex-col items-center justify-center gap-5 p-8 text-center">
      <p className="text-green m-0 text-sm font-semibold tracking-[.1em] uppercase">Check-in</p>
      <h1 className="m-0 font-serif text-[40px] leading-[1.1] font-normal">{ev.titulo}</h1>
      <p className="text-muted m-0 text-lg">
        {ev.data} · {ev.local}
      </p>
      <div
        role="img"
        aria-label={`QR Code do check-in de ${ev.tituloCurto}`}
        className="border-line w-[320px] max-w-full rounded-2xl border p-3 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
        // SVG gerado localmente a partir da URL assinada do check-in.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="m-0 text-lg">Aponte a câmera do celular ou use o CEAK App.</p>
      <p className="text-muted-2 m-0 text-sm">
        {instituicao.nome} · o check-in registra sua presença na sua jornada pessoal.
      </p>
      <p className="text-muted-2 m-0 font-mono text-[11px] break-all print:hidden">{url}</p>
      <BotaoImprimir />
    </div>
  );
}
