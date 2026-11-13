import { NextResponse } from 'next/server';
import { prisma } from '@ceak/db';
import { processarFilaPush } from '@/lib/processarFilaPush';
import { cronAutorizado } from '@/lib/segurancaCron';
import { executarDiagnosticosDiarios } from '@/lib/automacoesAgendadas';
import { prepararRascunhosDeEventos } from '@/lib/rascunhosEventosAgendados';
import { prepararRascunhosDeAulas } from '@/lib/rascunhosAulasAgendados';
import { prepararRascunhosCampanhas } from '@/lib/rascunhosCampanhasAgendados';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Rota exclusiva de automação. Não aceita cookies de usuário como credencial. */
export async function GET(req: Request) {
  if (!cronAutorizado(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ erro: 'Acesso não autorizado.' }, { status: 401 });
  }
  const inicio = Date.now();
  try {
    // Cron do plano Hobby pode executar somente uma vez ao dia. Processar
    // vários lotes num único chamado, respeitando o orçamento do runtime.
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
    const campanhas = await prepararRascunhosCampanhas();
    // Histórico durável, sem segredos, mensagens ou dados de destinatários.
    // Uma falha do registro não deve provocar repetição de notificações enviadas.
    await prisma.log
      .create({
        data: {
          categoria: 'NOTIFICACOES',
          nivel: indisponivel || falhas > 0 ? 'WARN' : 'INFO',
          mensagem: 'cron.notificacoes.executado',
          rota: '/api/cron/notificacoes',
          ator: 'vercel-cron',
          status: indisponivel || falhas > 0 ? 207 : 200,
          latenciaMs: Date.now() - inicio,
          contexto: { lotes, processados, enviados, falhas, pendentes, indisponivel },
        },
      })
      .catch(() => undefined);
    return NextResponse.json(
      {
        lotes,
        processados,
        enviados,
        falhas,
        pendentes,
        indisponivel,
        automacoes,
        lembretes,
        aulas,
        campanhas,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    // Não gravar detalhes da exceção: podem conter identificadores do provedor.
    // Falha do banco ao registrar o incidente não deve mascarar o HTTP 500.
    await prisma.log
      .create({
        data: {
          categoria: 'NOTIFICACOES',
          nivel: 'ERROR',
          mensagem: 'cron.notificacoes.executado',
          rota: '/api/cron/notificacoes',
          ator: 'vercel-cron',
          status: 500,
          latenciaMs: Date.now() - inicio,
          contexto: { falha: true },
        },
      })
      .catch(() => undefined);
    return NextResponse.json({ erro: 'Falha no processamento da fila.' }, { status: 500 });
  }
}
