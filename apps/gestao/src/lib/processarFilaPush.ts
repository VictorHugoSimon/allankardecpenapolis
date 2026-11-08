import 'server-only';
import { prisma } from '@ceak/db';
import { InscricaoPushExpirada } from '@ceak/core/adapters';
import { adapters } from '@/lib/servidor';
import { atrasoRetentativaMs, destinoInternoPush } from './regrasFilaPush';

/**
 * Processa até 50 destinos por chamada. Um claim SQL com SKIP LOCKED
 * impede que dois workers enviem simultaneamente a mesma linha.
 * A fila persiste no PostgreSQL e uma falha temporária é retentada.
 */
export async function processarFilaPush() {
  if (process.env.PUSH_PROVIDER !== 'webpush' ||
      !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return { processados: 0, enviados: 0, falhas: 0, pendentes: 0, indisponivel: true };
  }
  const push = adapters().push;
  if (push.nome !== 'webpush') throw new Error('Web Push indisponível.');

  const itens = await prisma.$transaction(async tx => {
    // Um worker pode ter sido interrompido após retirar a quinta tentativa.
    // Encerrar esse claim em vez de criar uma sexta tentativa indefinidamente.
    await tx.$executeRaw`
      UPDATE ceak_v2.entrega_push
      SET status = 'FALHA', bloqueado_ate = NULL,
          ultimo_erro = 'Limite de tentativas após interrupção'
      WHERE status = 'PROCESSANDO'
        AND bloqueado_ate < now()
        AND tentativas >= 5
    `;
    // Recupera claims interrompidos após cinco minutos.
    return tx.$queryRaw<Array<{ id: string; comunicacao_id: string; dispositivo_id: string; tentativas: number }>>`
      UPDATE ceak_v2.entrega_push AS fila SET status = 'PROCESSANDO',
        bloqueado_ate = now() + interval '5 minutes',
        tentativas = fila.tentativas + 1
      WHERE fila.id IN (
        SELECT id FROM ceak_v2.entrega_push
        WHERE (
          (status = 'PENDENTE' AND proxima_em <= now())
          OR (status = 'PROCESSANDO' AND bloqueado_ate < now() AND tentativas < 5)
        )
        ORDER BY proxima_em, criado_em
        LIMIT 50 FOR UPDATE SKIP LOCKED
      )
      RETURNING fila.id, fila.comunicacao_id, fila.dispositivo_id, fila.tentativas
    `;
  });
  let enviados = 0;
  let falhas = 0;
  for (let i = 0; i < itens.length; i += 10) {
    await Promise.all(itens.slice(i, i + 10).map(async item => {
      try {
        const [comunicado, dispositivo] = await Promise.all([
          prisma.comunicacao.findUnique({
            where: { id: item.comunicacao_id },
            select: { titulo: true, mensagem: true, filtro: true, status: true },
          }),
          prisma.dispositivoPush.findUnique({ where: { id: item.dispositivo_id } }),
        ]);
        const pessoaAutorizada = dispositivo?.pessoaId
          ? await prisma.pessoa.findFirst({
              where: {
                id: dispositivo.pessoaId,
                consentimentoEm: { not: null },
                exclusaoSolicitadaEm: null,
                anonimizadaEm: null,
                usuario: { is: { ativo: true } },
              },
              select: { id: true },
            })
          : null;
        // O usuário pode revogar autorização ou excluir a conta depois da publicação.
        if (!comunicado || comunicado.status !== 'ENVIADO' || !dispositivo || !pessoaAutorizada) {
          await prisma.entregaPush.updateMany({
            where: { id: item.id, status: 'PROCESSANDO', tentativas: item.tentativas },
            data: { status: 'EXPIRADO', bloqueadoAte: null, ultimoErro: 'Destino indisponível' },
          });
          return;
        }
        const filtro = comunicado.filtro && typeof comunicado.filtro === 'object' && !Array.isArray(comunicado.filtro)
          ? comunicado.filtro as Record<string, unknown> : {};
        const url = destinoInternoPush(filtro.url);
        await push.enviar(JSON.stringify({
          endpoint: dispositivo.endpoint,
          keys: { p256dh: dispositivo.p256dh, auth: dispositivo.auth },
        }), comunicado.titulo, comunicado.mensagem, url);
        // Atualiza somente o claim desta tentativa. Uma execução antiga nunca
        // deve sobrescrever o estado de uma tentativa mais recente.
        const confirmado = await prisma.entregaPush.updateMany({
          where: { id: item.id, status: 'PROCESSANDO', tentativas: item.tentativas },
          data: { status: 'ENVIADO', enviadoEm: new Date(), bloqueadoAte: null, ultimoErro: null },
        });
        if (confirmado.count === 1) enviados++;
      } catch (erro) {
        falhas++;
        const expirou = erro instanceof InscricaoPushExpirada;
        // Falhas transitórias: 1, 2, 4, 8 e 16 minutos, no máximo cinco tentativas.
        const definitivo = expirou || item.tentativas >= 5;
        await prisma.entregaPush.updateMany({
          where: { id: item.id, status: 'PROCESSANDO', tentativas: item.tentativas },
          data: {
            status: definitivo ? 'FALHA' : 'PENDENTE',
            bloqueadoAte: null,
            proximaEm: new Date(Date.now() + atrasoRetentativaMs(item.tentativas)),
            ultimoErro: expirou ? 'Inscrição expirada' : 'Falha no provedor push',
          },
        }).catch(() => undefined);
        if (expirou) {
          await prisma.dispositivoPush.deleteMany({
            where: { id: item.dispositivo_id },
          }).catch(() => undefined);
        }
      }
    }));
  }
  const pendentes = await prisma.entregaPush.count({
    where: { status: { in: ['PENDENTE', 'PROCESSANDO'] } },
  });
  return { processados: itens.length, enviados, falhas, pendentes, indisponivel: false };
}
