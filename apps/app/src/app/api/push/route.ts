import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, registrarDispositivoPush } from '@ceak/db';
import { getSessao, log } from '@/lib/servidor';

const inscricao = z.object({
  endpoint: z.string().url().startsWith('https://').max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

/** Registra o aparelho para receber Web Push. */
export async function POST(req: Request) {
  const s = await getSessao();
  if (!s) return NextResponse.json({ erro: 'Sessão expirada.' }, { status: 401 });
  const r = inscricao.safeParse(await req.json().catch(() => null));
  if (!r.success) return NextResponse.json({ erro: 'Inscrição inválida.' }, { status: 400 });
  await registrarDispositivoPush(s.pessoaId, r.data);
  log.info('APLICACAO', 'push: aparelho registrado', { rota: '/api/push', status: 201 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** Remove o aparelho (só os da própria pessoa). */
export async function DELETE(req: Request) {
  const s = await getSessao();
  if (!s) return NextResponse.json({ erro: 'Sessão expirada.' }, { status: 401 });
  const r = z
    .object({ endpoint: z.string().max(1000) })
    .safeParse(await req.json().catch(() => null));
  if (!r.success) return NextResponse.json({ erro: 'Pedido inválido.' }, { status: 400 });
  await prisma.dispositivoPush.deleteMany({
    where: { endpoint: r.data.endpoint, pessoaId: s.pessoaId },
  });
  return NextResponse.json({ ok: true });
}
