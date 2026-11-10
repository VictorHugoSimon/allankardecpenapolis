import 'server-only';
import { prisma } from '@ceak/db';

/**
 * Prepara rascunhos de lembretes para palestras e estudos confirmados.
 * Não entrega mensagens; a publicação permanece ação exclusiva do administrador.
 * A trava e o histórico são gravados na mesma transação.
 */
export async function prepararRascunhosDeEventos() {
  const regras = await prisma.automacao.findMany({
    where: {
      ativa: true,
      exigeAprovacao: true,
      gatilho: 'DIARIO',
      acao: 'RASCUNHO_LEMBRETE_EVENTO',
    },
    select: { id: true },
    take: 11,
  });
  if (regras.length > 10) throw new Error('Limite de dez regras diárias de lembretes excedido.');

  const agora = new Date();
  const diaUtc = agora.toISOString().slice(0, 10);
  const inicio = new Date(`${diaUtc}T00:00:00.000Z`);
  const fim = new Date(inicio.getTime() + 86_400_000);
  let preparados = 0;
  let ignoradas = 0;
  let falhas = 0;

  for (const regra of regras) {
    try {
      const rascunhos = await prisma.$transaction(
        async (tx) => {
          const [lock] = await tx.$queryRaw<Array<{ obtida: boolean }>>`
          SELECT pg_try_advisory_xact_lock(
            hashtext('ceak.automacao.lembretes.diarios'),
            hashtext(${regra.id})
          ) AS obtida
        `;
          if (!lock?.obtida) return null;
          const atual = await tx.automacao.findUnique({
            where: { id: regra.id },
            select: { ativa: true, exigeAprovacao: true, gatilho: true, acao: true },
          });
          if (
            !atual?.ativa ||
            !atual.exigeAprovacao ||
            atual.gatilho !== 'DIARIO' ||
            atual.acao !== 'RASCUNHO_LEMBRETE_EVENTO'
          )
            return null;

          const anterior = await tx.execucao.findFirst({
            where: {
              automacaoId: regra.id,
              iniciadaEm: { gte: inicio, lt: fim },
              entrada: { path: ['modo'], equals: 'AGENDADO_EVENTOS' },
            },
            select: { id: true },
          });
          if (anterior) return null;

          const eventos = await tx.evento.findMany({
            where: {
              status: 'CONFIRMADO',
              tipo: { in: ['PALESTRA', 'ESTUDO'] },
              inicio: { gt: agora, lte: new Date(agora.getTime() + 48 * 60 * 60_000) },
              publico: true,
            },
            take: 21,
            orderBy: { inicio: 'asc' },
            select: { id: true, slug: true, titulo: true, inicio: true, tipo: true, local: true },
          });
          if (eventos.length > 20) throw new Error('Mais de vinte eventos na janela de lembretes.');
          let criados = 0;
          for (const e of eventos) {
            // Além da trava, evita repetir um rascunho para o mesmo evento
            // em dias diferentes, inclusive se o evento mudar de horário.
            const existente = await tx.comunicacao.findFirst({
              where: {
                canal: 'APP',
                filtro: { path: ['chaveLembrete'], equals: `${regra.id}:${e.id}` },
              },
              select: { id: true },
            });
            if (existente) continue;
            await tx.comunicacao.create({
              data: {
                canal: 'APP',
                titulo: `Lembrete: ${e.titulo}`.slice(0, 160),
                mensagem:
                  `${e.tipo === 'PALESTRA' ? 'Palestra' : 'Estudo'} confirmad${e.tipo === 'PALESTRA' ? 'a' : 'o'} para ${e.inicio.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}${e.local ? ` · ${e.local}` : ''}. Confira a programação no CEAK.`.slice(
                    0,
                    2000,
                  ),
                publico: 'Todos os membros elegíveis (revisar antes de publicar)',
                filtro: {
                  segmento: 'TODOS',
                  url: `/agenda/${encodeURIComponent(e.slug)}`,
                  chaveLembrete: `${regra.id}:${e.id}`,
                  origem: 'AUTOMACAO_LEMBRETE',
                  eventoId: e.id,
                },
                status: 'RASCUNHO',
              },
            });
            criados++;
          }
          await tx.execucao.create({
            data: {
              automacaoId: regra.id,
              status: 'SUCESSO',
              entrada: { modo: 'AGENDADO_EVENTOS', diaUtc, acao: 'RASCUNHO_LEMBRETE_EVENTO' },
              saida: {
                eventosEncontrados: eventos.length,
                rascunhosCriados: criados,
                mensagemExternaEnviada: false,
                exigePublicacaoHumana: true,
              },
              finalizadaEm: new Date(),
            },
          });
          return criados;
        },
        { timeout: 12_000 },
      );
      if (rascunhos === null) ignoradas++;
      else preparados += rascunhos;
    } catch {
      falhas++;
    }
  }
  return { regras: regras.length, preparados, ignoradas, falhas };
}
