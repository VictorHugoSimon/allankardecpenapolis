import { processarWebhookPix } from '@ceak/db';
import { depsPagamento } from '@/lib/servidor';

export const dynamic = 'force-dynamic';

/**
 * Webhook de confirmação do PSP. A assinatura é validada pelo adapter de pagamento
 * (no mock: HMAC-SHA256 do corpo com PIX_WEBHOOK_SECRET, no cabeçalho x-ceak-assinatura).
 */
export async function POST(req: Request) {
  const corpo = await req.text();
  if (corpo.length > 20_000) return Response.json({ ok: false }, { status: 413 });
  const assinatura = req.headers.get('x-ceak-assinatura');
  const r = await processarWebhookPix(corpo, assinatura, depsPagamento());
  if (r.ok) return Response.json({ ok: true });
  const status = r.motivo === 'assinatura' ? 401 : r.motivo === 'nao_encontrado' ? 404 : 422;
  return Response.json({ ok: false, motivo: r.motivo }, { status });
}
