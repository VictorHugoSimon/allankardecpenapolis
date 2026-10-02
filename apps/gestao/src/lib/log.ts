import 'server-only';
import { criarLogger, type LogSink } from '@ceak/core/logger';
import { prisma } from '@ceak/db';

/** Persiste no Logs Center (tabela `log`), além da saída padrão. */
const dbSink: LogSink = async (e) => {
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

const stdoutSink: LogSink = (e) => {
  const line = JSON.stringify(e);
  if (e.nivel === 'ERROR') console.error(line);
  else if (e.nivel === 'WARN') console.warn(line);
  else process.stdout.write(line + '\n');
};

export const log = criarLogger([stdoutSink, dbSink]);
