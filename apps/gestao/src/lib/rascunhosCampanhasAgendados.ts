import 'server-only';
import { prisma } from '@ceak/db';

/** Prepara convites solidários somente como rascunhos para revisão da direção.
 * Não cria cobranças, links PIX ou solicitações de pagamento.
 */
export async function prepararRascunhosCampanhas() {
  const regras = await prisma.automacao.findMany({
    where: { ativa: true, exigeAprovacao: true, gatilho: 'DIARIO',
      acao: 'RASCUNHO_CAMPANHA' },
    select: { id: true }, take: 11,
  });
  if (regras.length > 10) throw new Error('Limite de 10 regras diárias de campanhas excedido.');
  const agora = new Date();
  // Campos inicio/fim são DATE (sem horário): usar a data civil do CEAK em São Paulo.
  const diaLocal = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(agora);
  const dataCivil = new Date(`${diaLocal}T00:00:00.000Z`);
  const diaUtc = agora.toISOString().slice(0, 10);
  const comecoDia = new Date(`${diaUtc}T00:00:00.000Z`);
  const proximoDia = new Date(comecoDia.getTime() + 86_400_000);
  let preparados = 0;
  let ignoradas = 0;
  let falhas = 0;

  for (const regra of regras) {
    try {
      const resultado = await prisma.$transaction(async tx => {
        const [trava] = await tx.$queryRaw<Array<{ obtida: boolean }>>`
          SELECT pg_try_advisory_xact_lock(
            hashtext('ceak.automacao.campanhas'),
            hashtext(${regra.id})
          ) AS obtida
        `;
        if (!trava?.obtida) return null;
        const autorizada = await tx.automacao.findFirst({
          where: { id: regra.id, ativa: true, exigeAprovacao: true,
            gatilho: 'DIARIO', acao: 'RASCUNHO_CAMPANHA' },
          select: { id: true },
        });
        if (!autorizada) return null;
        const anterior = await tx.execucao.findFirst({
          where: { automacaoId: regra.id,
            iniciadaEm: { gte: comecoDia, lt: proximoDia },
            entrada: { path: ['modo'], equals: 'AGENDADO_CAMPANHAS' } },
          select: { id: true },
        });
        if (anterior) return null;

        const campanhas = await tx.campanha.findMany({
          where: { status: 'ATIVA',
            OR: [{ inicio: null }, { inicio: { lte: dataCivil } }],
            AND: [{ OR: [{ fim: null }, { fim: { gte: dataCivil } }] }] },
          select: { id: true, slug: true, titulo: true, descricao: true,
            meta: true, arrecadado: true, unidade: true, pontosColeta: true },
          take: 21, orderBy: { criadoEm: 'desc' },
        });
        if (campanhas.length > 20) throw new Error('Mais de 20 campanhas ativas; revisão necessária.');
        let criados = 0;
        for (const campanha of campanhas) {
          if (campanha.meta <= 0 || campanha.arrecadado >= campanha.meta) continue;
          const chave = `${regra.id}:${campanha.id}`;
          const existente = await tx.comunicacao.findFirst({
            where: { canal: 'APP',
              filtro: { path: ['chaveCampanha'], equals: chave } },
            select: { id: true },
          });
          if (existente) continue;
          const destino = campanha.pontosColeta.filter(Boolean).slice(0, 3).join(', ');
          const descricao = campanha.descricao?.trim().slice(0, 700);
          const mensagem = [
            descricao || 'Participe desta campanha solidária do CEAK.',
            `Meta: ${campanha.meta} ${campanha.unidade.toLowerCase()}. Já arrecadado: ${campanha.arrecadado}.`,
            destino ? `Pontos de coleta: ${destino}.` : 'Consulte a equipe do CEAK para orientações de entrega.',
            'Confira os detalhes oficiais antes de contribuir.',
          ].join(' ');
          await tx.comunicacao.create({
            data: {
              canal: 'APP', titulo: `Campanha solidária: ${campanha.titulo}`.slice(0, 160),
              mensagem: mensagem.slice(0, 2000), status: 'RASCUNHO',
              publico: 'Membros elegíveis — aprovação administrativa pendente',
              filtro: { origem: 'AUTOMACAO_CAMPANHA', segmento: 'TODOS',
                campanhaId: campanha.id, chaveCampanha: chave,
                url: `/campanhas/${encodeURIComponent(campanha.slug)}` },
            },
          });
          criados++;
        }
        await tx.execucao.create({
          data: { automacaoId: regra.id, status: 'SUCESSO',
            entrada: { modo: 'AGENDADO_CAMPANHAS', diaUtc, acao: 'RASCUNHO_CAMPANHA' },
            saida: { campanhasEncontradas: campanhas.length, rascunhosCriados: criados,
              pagamentoGerado: false, mensagemExternaEnviada: false, exigePublicacaoHumana: true },
            finalizadaEm: new Date() },
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
