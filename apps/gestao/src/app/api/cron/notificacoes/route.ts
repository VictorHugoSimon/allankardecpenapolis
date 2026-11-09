import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { processarFilaPush } from '@/lib/processarFilaPush';
import { executarDiagnosticosDiarios } from '@/lib/automacoesAgendadas';
import { prepararRascunhosDeEventos } from '@/lib/rascunhosEventosAgendados';
import { prepararRascunhosDeAulas } from '@/lib/rascunhosAulasAgendados';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

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
    // Cron do plano Hobby pode executar somente uma vez ao dia. Processar
    // vários lotes num único chamado, respeitando o orçamento do runtime.
    const inicio = Date.now();
    let lotes = 0;
    let enviados = 0;
    let falhas = 0;
    let processados = 0;
    let pendentes = 0;
    let indisponivel = false;
    while (lotes < 30 && Date.now() - inicio < 45_000) {
      let resultado: Awaited<ReturnType<typeof processarFilaPush>>;
      try {
        resultado = await processarFilaPush();
      } catch {
        falhas++;
        break;
      }
      if (resultado.indisponivel) {
        indisponivel = true;
        break;
      }
      processados += resultado.processados;
      enviados += resultado.enviados;
      falhas += resultado.falhas;
      pendentes = resultado.pendentes;
      if (resultado.processados === 0) break;
      lotes++;
    }
    // O mesmo cron diário do plano Hobby executa diagnósticos aprovados.
    // Reserva parte da execução para a automação mesmo após falha do push.
    // Nenhuma ação externa ou escrita de estoque é disparada.
    const automacoes = await executarDiagnosticosDiarios();
    const lembretes = await prepararRascunhosDeEventos();
    const aulas = await prepararRascunhosDeAulas();
    return NextResponse.json(
      { lotes, processados, enviados, falhas, pendentes, indisponivel, automacoes, lembretes, aulas },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ erro: 'Falha no processamento da fila.' }, { status: 500 });
  }
}
