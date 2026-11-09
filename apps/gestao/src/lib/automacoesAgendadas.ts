import 'server-only';
import { prisma } from '@ceak/db';

/**
 * Diagnóstico automático diário de estoque: somente leitura, sem provedores externos.
 * O cron de notificações também chama esta rotina uma vez por dia.
 * Uma trava transacional PostgreSQL evita execuções simultâneas.
 */
export async function executarDiagnosticosDiarios() {
  const regras = await prisma.automacao.findMany({
    where: {
      ativa: true,
      exigeAprovacao: true,
      gatilho: 'DIARIO',
      acao: 'DIAGNOSTICO_ESTOQUE',
    },
    select: { id: true },
    take: 101,
  });
  if (regras.length > 100) {
    throw new Error('Há mais de 100 regras diárias; revise a configuração antes de executar.');
  }

  const referencia = new Date();
  const diaUtc = referencia.toISOString().slice(0, 10);
  const inicioDia = new Date(`${diaUtc}T00:00:00.000Z`);
  const fimDia = new Date(inicioDia.getTime() + 86_400_000);
  let realizadas = 0;
  let ignoradas = 0;
  let falhas = 0;

  for (const regra of regras) {
    try {
      const realizada = await prisma.$transaction(async tx => {
        // A mesma combinação de duas chaves permanece estável em workers concorrentes.
        const [lock] = await tx.$queryRaw<Array<{ obtida: boolean }>>`
          SELECT pg_try_advisory_xact_lock(
            hashtext('ceak.automacao.estoque.diario'),
            hashtext(${regra.id})
          ) AS obtida
        `;
        if (!lock?.obtida) return false;
        // Revalidação após adquirir a trava: desativação pode ter ocorrido
        // enquanto este worker aguardava sua vez.
        const atual = await tx.automacao.findUnique({
          where: { id: regra.id },
          select: { ativa: true, exigeAprovacao: true, gatilho: true, acao: true },
        });
        if (!atual?.ativa || !atual.exigeAprovacao ||
            atual.gatilho !== 'DIARIO' || atual.acao !== 'DIAGNOSTICO_ESTOQUE') return false;
        const anterior = await tx.execucao.findFirst({
          where: {
            automacaoId: regra.id,
            iniciadaEm: { gte: inicioDia, lt: fimDia },
            entrada: { path: ['modo'], equals: 'AGENDADO' },
          },
          select: { id: true },
        });
        if (anterior) return false;

        const comeco = Date.now();
        const itens = await tx.itemEstoque.findMany({
          select: { id: true, saldo: true, minimo: true },
          take: 5001,
        });
        if (itens.length > 5000) throw new Error('Limite de 5.000 itens para diagnóstico diário.');
        const baixos = itens.filter(i =>
          i.minimo !== null && Number(i.saldo) < Number(i.minimo));
        await tx.execucao.create({
          data: {
            automacaoId: regra.id,
            status: 'SUCESSO',
            entrada: { modo: 'AGENDADO', diaUtc, acao: 'DIAGNOSTICO_ESTOQUE' },
            saida: {
              itensAnalisados: itens.length,
              abaixoDoMinimo: baixos.length,
              amostraIds: baixos.slice(0, 20).map(i => i.id),
              somenteLeitura: true,
              mensagemExternaEnviada: false,
            },
            duracaoMs: Math.max(0, Date.now() - comeco),
            finalizadaEm: new Date(),
          },
        });
        return true;
      }, { timeout: 15_000 });
      if (realizada) realizadas++;
      else ignoradas++;
    } catch {
      // Não expor detalhes de banco aos clientes do cron.
      falhas++;
    }
  }
  return { elegiveis: regras.length, realizadas, ignoradas, falhas };
}
