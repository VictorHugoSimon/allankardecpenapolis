import { type LogSink } from '@ceak/core/logger';
import { prisma } from './client';

/** Persiste os logs estruturados na tabela `log` (Logs Center). */
export const logSinkBanco: LogSink = async (e) => {
  await prisma.log.create({
    data: {
      categoria: e.categoria,
      nivel: e.nivel,
      mensagem: e.mensagem,
      rota: e.rota,
      ator: e.usuario,
      status: e.status,
      latenciaMs: e.latenciaMs,
      contexto: e.contexto as object | undefined,
    },
  });
};
