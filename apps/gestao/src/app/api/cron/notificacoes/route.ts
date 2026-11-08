import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { processarFilaPush } from '@/lib/processarFilaPush';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Rota exclusiva de automação. Não aceita cookies de usuário como credencial. */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  const cabecalho = req.headers.get('authorization') ?? '';
  const esperado = segredo ? `Bearer ${segredo}` : '';
  const a = Buffer.from(cabecalho);
  const b = Buffer.from(esperado);
  if (!segredo || segredo.length < 32 || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ erro: 'Acesso não autorizado.' }, { status: 401 });
  }
  try {
    const resultado = await processarFilaPush();
    return NextResponse.json(resultado, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ erro: 'Falha no processamento da fila.' }, { status: 500 });
  }
}
