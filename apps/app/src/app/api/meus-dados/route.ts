import { NextResponse } from 'next/server';
import { exportarDadosTitular } from '@ceak/db';
import { getSessao, ipDaRequisicao, log } from '@/lib/servidor';

export const dynamic = 'force-dynamic';

/** Exportação dos dados do titular em JSON (LGPD, art. 18). */
export async function GET() {
  const s = await getSessao();
  if (!s) return NextResponse.json({ erro: 'Sessão expirada.' }, { status: 401 });
  const dados = await exportarDadosTitular(s.pessoaId, s.usuarioId, await ipDaRequisicao());
  log.info('SEGURANCA', 'app: exportação de dados do titular', {
    rota: '/api/meus-dados',
    status: 200,
  });
  return new NextResponse(JSON.stringify(dados, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="meus-dados-ceak.json"',
      'cache-control': 'no-store',
    },
  });
}
