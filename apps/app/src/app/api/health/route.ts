import { prisma } from '@ceak/db';

export const dynamic = 'force-dynamic';

/** Health check (Sistema › Saúde): aplicação e banco. */
export async function GET() {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok', banco: 'ok', latenciaMs: Date.now() - t0 });
  } catch {
    return Response.json({ status: 'erro', banco: 'indisponível' }, { status: 503 });
  }
}
