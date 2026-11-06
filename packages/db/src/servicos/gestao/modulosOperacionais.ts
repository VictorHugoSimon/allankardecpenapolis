import { comRls, type ContextoRls } from '../../rls';

type Linha = { id: string; celulas: string[] };
export type PainelModuloOperacional = {
  indicadores: { rotulo: string; valor: string }[];
  colunas: string[];
  linhas: Linha[];
  observacao?: string;
};
const data = (d: Date | null | undefined) => d ? d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—';
const reais = (c: number | null | undefined) => c == null ? '—' : (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const resultado = (colunas: string[], linhas: Linha[], indicadores: PainelModuloOperacional['indicadores'], observacao?: string): PainelModuloOperacional => ({ colunas, linhas, indicadores, observacao });

/**
 * Consulta os registros reais em cada módulo, sempre sob RLS do usuário logado.
 * Sem dados fictícios e sem executar serviços externos de IA, cobrança ou mensageria.
 */
export async function painelModuloOperacional(ctx: ContextoRls, modulo: string): Promise<PainelModuloOperacional> {
  return comRls(ctx, async (tx) => {
    switch (modulo) {
      case 'loja': {
        const [produtos, pedidos] = await Promise.all([
          tx.produto.findMany({ orderBy: { criadoEm: 'desc' }, take: 60 }),
          tx.pedido.findMany({ orderBy: { criadoEm: 'desc' }, take: 30 }),
        ]);
        return resultado(['Produto', 'Categoria', 'Preço', 'Situação'], produtos.map(p => ({ id: p.id, celulas: [p.nome, p.categoria, reais(p.precoCentavos), p.status] })), [
          { rotulo: 'Produtos listados', valor: String(produtos.length) },
          { rotulo: 'Pedidos recentes', valor: String(pedidos.length) },
          { rotulo: 'Pedidos pagos', valor: String(pedidos.filter(p => p.statusPagamento === 'PAGO').length) }
        ], 'Novos produtos entram como rascunho. Nenhum PIX ou pagamento é gerado sem integração bancária real.');
      }
      case 'estoque': {
        const [itens, movimentacoes] = await Promise.all([
          tx.itemEstoque.findMany({ orderBy: { nome: 'asc' }, take: 100 }),
          tx.movimentacao.findMany({ orderBy: { criadoEm: 'desc' }, take: 40 }),
        ]);
        return resultado(['Código', 'Item', 'Categoria', 'Saldo', 'Mínimo'], itens.map(i => ({ id: i.id, celulas: [i.sku, i.nome, i.categoria, String(i.saldo), i.minimo?.toString() ?? '—'] })), [
          { rotulo: 'Itens cadastrados', valor: String(itens.length) },
          { rotulo: 'Abaixo do mínimo', valor: String(itens.filter(i => i.minimo !== null && Number(i.saldo) < Number(i.minimo)).length) },
          { rotulo: 'Últimas movimentações', valor: String(movimentacoes.length) }
        ], 'Os movimentos de entrada e saída atualizam o saldo de forma transacional e são auditados.');
      }
      case 'doacoes': {
        const [doacoes, campanhas] = await Promise.all([
          tx.doacao.findMany({ orderBy: { criadoEm: 'desc' }, take: 60 }),
          tx.campanha.findMany({ orderBy: { criadoEm: 'desc' }, take: 30 }),
        ]);
        return resultado(['Data', 'Doador', 'Tipo', 'Descrição/valor', 'Situação'], doacoes.map(d => ({ id: d.id, celulas: [data(d.criadoEm), d.doadorNome ?? 'Não identificado', d.forma, d.itemDescricao ?? reais(d.valorCentavos), d.statusPagamento] })), [
          { rotulo: 'Doações registradas', valor: String(doacoes.length) },
          { rotulo: 'Campanhas', valor: String(campanhas.length) },
          { rotulo: 'Com pagamento confirmado', valor: String(doacoes.filter(d => d.statusPagamento === 'PAGO').length) }
        ], 'Doações manuais ficam pendentes de conferência. Nenhuma cobrança PIX é habilitada aqui.');
      }
      case 'comunicacao': {
        const items = await tx.comunicacao.findMany({ orderBy: { criadoEm: 'desc' }, take: 70 });
        return resultado(['Título', 'Canal', 'Público', 'Situação', 'Data'], items.map(i => ({ id: i.id, celulas: [i.titulo, i.canal, i.publico, i.status, data(i.criadoEm)] })), [
          { rotulo: 'Comunicados', valor: String(items.length) },
          { rotulo: 'Rascunhos', valor: String(items.filter(i => i.status === 'RASCUNHO').length) },
          { rotulo: 'Enviados', valor: String(items.filter(i => i.status === 'ENVIADO').length) }
        ], 'Comunicados novos são salvos como rascunhos. O disparo depende de canal real configurado e aprovação.');
      }
      case 'automacoes': {
        const items = await tx.automacao.findMany({ orderBy: { criadoEm: 'desc' }, take: 70, include: { _count: { select: { execucoes: true } } } });
        return resultado(['Nome', 'Gatilho', 'Ação', 'Ativa', 'Execuções'], items.map(i => ({ id: i.id, celulas: [i.nome, i.gatilho, i.acao, i.ativa ? 'Sim' : 'Não', String(i._count.execucoes)] })), [
          { rotulo: 'Regras cadastradas', valor: String(items.length) },
          { rotulo: 'Ativas', valor: String(items.filter(i => i.ativa).length) },
          { rotulo: 'Em preparação', valor: String(items.filter(i => !i.ativa).length) }
        ], 'Regras novas permanecem desligadas até que o executor seja integrado e validado.');
      }
      case 'logs': {
        const items = await tx.log.findMany({ orderBy: { criadoEm: 'desc' }, take: 80 });
        return resultado(['Data', 'Nível', 'Categoria', 'Mensagem', 'Rota'], items.map(i => ({ id: i.id, celulas: [data(i.criadoEm), i.nivel, i.categoria, i.mensagem, i.rota ?? '—'] })), [
          { rotulo: 'Eventos exibidos', valor: String(items.length) },
          { rotulo: 'Erros exibidos', valor: String(items.filter(i => i.nivel === 'ERROR').length) }
        ], 'Consulta limitada aos 80 eventos mais recentes, respeitando as permissões do perfil.');
      }
      case 'integracoes': {
        const items = await tx.integracao.findMany({ orderBy: { nome: 'asc' }, take: 80 });
        return resultado(['Integração', 'Descrição', 'Status', 'Última atualização'], items.map(i => ({ id: i.id, celulas: [i.nome, i.descricao, i.status, data(i.atualizadoEm)] })), [
          { rotulo: 'Integrações', valor: String(items.length) },
          { rotulo: 'Conectadas', valor: String(items.filter(i => i.status === 'CONECTADO').length) },
          { rotulo: 'Pendentes', valor: String(items.filter(i => i.status !== 'CONECTADO').length) }
        ], 'Segredos e tokens não são exibidos. As conexões reais exigem credenciais e homologação.');
      }
      case 'bi':
      case 'ia':
      case 'sistema': {
        const [pessoas, atividades, estudos, lancamentos, produtos, doacoes, comunicacoes, automacoes] = await Promise.all([
          tx.pessoa.count(), tx.evento.count(), tx.turma.count(), tx.lancamento.count(),
          tx.produto.count(), tx.doacao.count(), tx.comunicacao.count(), tx.automacao.count()
        ]);
        const indicadores = [
          { rotulo: 'Pessoas cadastradas', valor: String(pessoas) },
          { rotulo: 'Eventos', valor: String(atividades) },
          { rotulo: 'Turmas de estudo', valor: String(estudos) },
          { rotulo: 'Lançamentos financeiros', valor: String(lancamentos) },
          { rotulo: 'Produtos', valor: String(produtos) },
          { rotulo: 'Doações', valor: String(doacoes) },
          { rotulo: 'Comunicados', valor: String(comunicacoes) },
          { rotulo: 'Automações', valor: String(automacoes) },
        ];
        const titulo = modulo === 'ia' ? 'Leitura operacional baseada em regras locais; ainda sem modelo generativo conectado.' :
          modulo === 'sistema' ? 'Diagnóstico de cadastros da plataforma; não substitui monitoramento de infraestrutura.' :
          'Indicadores obtidos do banco em tempo real; não são dados de demonstração.';
        return resultado(['Indicador', 'Total'], indicadores.map((v,i) => ({ id: String(i), celulas: [v.rotulo, v.valor] })), indicadores, titulo);
      }
      default:
        return resultado([], [], [], 'Módulo sem consulta operacional disponível.');
    }
  });
}
