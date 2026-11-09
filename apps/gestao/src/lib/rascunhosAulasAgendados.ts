import 'server-only';
import { prisma } from '@ceak/db';

/**
 * Prepara rascunhos de avisos de aulas; não envia nada.
 * Os avisos ficam retidos até existir segmentação de matriculados na publicação.
 * O processamento é serializado por regra e idempotente por turma/aula.
 */
export async function prepararRascunhosDeAulas() {
  const regras = await prisma.automacao.findMany({
    where: {
      ativa: true,
      exigeAprovacao: true,
      gatilho: 'DIARIO',
      acao: 'RASCUNHO_LEMBRETE_AULA',
    },
    select: { id: true },
    take: 11,
  });
  if (regras.length > 10) throw new Error('Limite de regras diárias de aulas excedido.');

  const agora = new Date();
  const diaUtc = agora.toISOString().slice(0, 10);
  const inicioDia = new Date(`${diaUtc}T00:00:00.000Z`);
  const fimDia = new Date(inicioDia.getTime() + 86_400_000);
  let preparados = 0;
  let ignoradas = 0;
  let falhas = 0;

  for (const regra of regras) {
    try {
      const resultado = await prisma.$transaction(async tx => {
        const [lock] = await tx.$queryRaw<Array<{ obtida: boolean }>>`
          SELECT pg_try_advisory_xact_lock(
            hashtext('ceak.automacao.lembretes.aulas'),
            hashtext(${regra.id})
          ) AS obtida
        `;
        if (!lock?.obtida) return null;
        const atual = await tx.automacao.findUnique({
          where: { id: regra.id },
          select: { ativa: true, exigeAprovacao: true, gatilho: true, acao: true },
        });
        if (!atual?.ativa || !atual.exigeAprovacao ||
            atual.gatilho !== 'DIARIO' || atual.acao !== 'RASCUNHO_LEMBRETE_AULA') return null;

        const anterior = await tx.execucao.findFirst({
          where: {
            automacaoId: regra.id,
            iniciadaEm: { gte: inicioDia, lt: fimDia },
            entrada: { path: ['modo'], equals: 'AGENDADO_AULAS' },
          },
          select: { id: true },
        });
        if (anterior) return null;

        const aulas = await tx.aula.findMany({
          where: {
            data: { gt: agora, lte: new Date(agora.getTime() + 48 * 60 * 60_000) },
            turma: {
              status: 'ATIVA',
              curso: { ativo: true },
              matriculas: { some: { status: 'ATIVA' } },
            },
          },
          select: {
            id: true, titulo: true, data: true,
            turma: { select: { id: true, nome: true, curso: { select: { nome: true } } } },
          },
          orderBy: { data: 'asc' },
          take: 21,
        });
        if (aulas.length > 20) throw new Error('Mais de vinte aulas elegíveis na janela.');

        let criados = 0;
        for (const aula of aulas) {
          const chave = `${regra.id}:${aula.id}`;
          const anteriorRascunho = await tx.comunicacao.findFirst({
            where: {
              canal: 'APP',
              filtro: { path: ['chaveLembrete'], equals: chave },
            },
            select: { id: true },
          });
          if (anteriorRascunho) continue;
          await tx.comunicacao.create({
            data: {
              canal: 'APP',
              titulo: `Aula: ${aula.titulo}`.slice(0, 160),
              mensagem: `Aula de ${aula.turma.curso.nome} — ${aula.turma.nome}, programada para ${aula.data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}. Confirme a programação com a secretaria.`.slice(0, 2000),
              publico: 'Somente alunos matriculados na turma — segmentação pendente',
              filtro: {
                origem: 'AUTOMACAO_LEMBRETE_AULA',
                chaveLembrete: chave,
                turmaId: aula.turma.id,
                aulaId: aula.id,
                segmento: 'MATRICULADOS_TURMA',
                url: '/estudos',
                exigeSegmentacaoTurma: true,
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
            entrada: { modo: 'AGENDADO_AULAS', diaUtc, acao: 'RASCUNHO_LEMBRETE_AULA' },
            saida: {
              aulasEncontradas: aulas.length,
              rascunhosCriados: criados,
              segmentacaoPendente: true,
              mensagemExternaEnviada: false,
            },
            finalizadaEm: new Date(),
          },
        });
        return criados;
      }, { timeout: 12_000 });
      if (resultado === null) ignoradas++;
      else preparados += resultado;
    } catch {
      falhas++;
    }
  }
  return { regras: regras.length, preparados, ignoradas, falhas };
}
