'use server';

import { revalidatePath } from 'next/cache';
import { comRls, registrarAuditoria } from '@ceak/db';
import { exigirModulo, contextoRls } from '@/lib/auth';

type Operacao = 'doacoes' | 'loja' | 'estoque' | 'automacoes' | 'comunicacao';

function campo(form: FormData, nome: string, max = 180) {
  return String(form.get(nome) ?? '')
    .trim()
    .slice(0, max);
}
function quantidade(form: FormData, nome: string) {
  const texto = campo(form, nome, 30).replace(',', '.');
  const n = Number(texto);
  if (!texto || !Number.isFinite(n) || n <= 0 || n > 10000000)
    throw new Error('Quantidade ou valor inválido.');
  return n;
}
function centavos(form: FormData) {
  const n = quantidade(form, 'valor');
  const c = Math.round(n * 100);
  if (!Number.isSafeInteger(c) || c < 1) throw new Error('Valor inválido.');
  return c;
}

/** Cadastros operacionais somente pelo administrador autenticado; sem PIX fictício. */
export async function salvarOperacao(modulo: Operacao, form: FormData): Promise<void> {
  const s = await exigirModulo(modulo);
  if (s.perfil !== 'ADMINISTRADOR')
    throw new Error('Somente o administrador pode cadastrar neste módulo.');
  const ctx = contextoRls(s);
  const tipo = campo(form, 'tipo', 30);
  await comRls(ctx, async (tx) => {
    let entidade:
      'Doacao' | 'Produto' | 'ItemEstoque' | 'Movimentacao' | 'Comunicacao' | 'Automacao' =
      'Doacao';
    let entidadeId = '';
    if (modulo === 'doacoes') {
      const nome = campo(form, 'nome', 120);
      const destino = campo(form, 'destino', 120);
      if (!nome || !destino) throw new Error('Informe doador e destinação.');
      const itens = tipo === 'ITEM';
      const descricao = campo(form, 'descricao', 500);
      if (itens && !descricao) throw new Error('Descreva os itens recebidos.');
      if (!itens && !campo(form, 'valor')) throw new Error('Informe o valor recebido.');
      const doacao = await tx.doacao.create({
        data: {
          doadorNome: nome,
          destino,
          forma: itens ? 'ENTREGA' : 'DINHEIRO',
          itemDescricao: itens ? descricao : null,
          valorCentavos: itens ? null : centavos(form),
          statusPagamento: 'PAGO',
          pagoEm: new Date(),
        },
      });
      entidade = 'Doacao';
      entidadeId = doacao.id;
    } else if (modulo === 'loja') {
      const nome = campo(form, 'nome', 150);
      const categoria = campo(form, 'categoria', 100);
      if (!nome || !categoria) throw new Error('Informe nome e categoria.');
      const preco = centavos(form);
      const produto = await tx.produto.create({
        data: {
          nome,
          categoria,
          precoCentavos: preco,
          slug: 'ceak-' + crypto.randomUUID(),
          descricao: campo(form, 'descricao', 1500) || null,
          origem: 'DOADO',
          estado: 'NOVO',
          status: 'RASCUNHO',
          imagens: [],
        },
      });
      entidade = 'Produto';
      entidadeId = produto.id;
    } else if (modulo === 'estoque') {
      if (tipo === 'MOVIMENTO') {
        const id = campo(form, 'itemId', 50);
        const movimento = campo(form, 'movimento', 20);
        const motivo = campo(form, 'motivo', 200);
        const q = quantidade(form, 'quantidade');
        if (!['ENTRADA', 'SAIDA'].includes(movimento) || !motivo)
          throw new Error('Informe tipo e motivo.');
        const item = await tx.itemEstoque.findUnique({ where: { id } });
        if (!item) throw new Error('Item inexistente.');
        if (movimento === 'SAIDA' && Number(item.saldo) < q) throw new Error('Saldo insuficiente.');
        const alterado = await tx.itemEstoque.updateMany({
          where: { id, ...(movimento === 'SAIDA' ? { saldo: { gte: q } } : {}) },
          data: { saldo: { increment: movimento === 'ENTRADA' ? q : -q } },
        });
        if (!alterado.count) throw new Error('Saldo insuficiente ou item indisponível.');
        const mov = await tx.movimentacao.create({
          data: {
            itemEstoqueId: id,
            tipo: movimento as 'ENTRADA' | 'SAIDA',
            motivo,
            quantidade: q,
            por: s.nome,
          },
        });
        entidade = 'Movimentacao';
        entidadeId = mov.id;
      } else {
        const sku = campo(form, 'sku', 60).toUpperCase();
        const nome = campo(form, 'nome', 160);
        if (!sku || !nome) throw new Error('Informe SKU e nome.');
        const item = await tx.itemEstoque.create({
          data: { sku, nome, categoria: 'DOACOES', unidade: 'UN', saldo: 0 },
        });
        entidade = 'ItemEstoque';
        entidadeId = item.id;
      }
    } else if (modulo === 'comunicacao') {
      const titulo = campo(form, 'titulo', 160);
      const mensagem = campo(form, 'mensagem', 3000);
      if (!titulo || !mensagem) throw new Error('Informe título e mensagem.');
      const registro = await tx.comunicacao.create({
        data: { titulo, mensagem, publico: 'A definir', canal: 'EMAIL', status: 'RASCUNHO' },
      });
      entidade = 'Comunicacao';
      entidadeId = registro.id;
    } else if (modulo === 'automacoes') {
      const nome = campo(form, 'nome', 120);
      const gatilho = campo(form, 'gatilho', 150);
      const acao = campo(form, 'acao', 150);
      if (!nome || !['MANUAL', 'DIARIO'].includes(gatilho) ||
          acao !== 'DIAGNOSTICO_ESTOQUE') {
        throw new Error('Apenas diagnósticos de estoque manuais ou diários podem ser cadastrados.');
      }
      const registro = await tx.automacao.create({
        data: {
          chave: 'manual-' + crypto.randomUUID(),
          nome,
          gatilho,
          acao,
          ativa: false,
          exigeAprovacao: true,
        },
      });
      entidade = 'Automacao';
      entidadeId = registro.id;
    } else {
      throw new Error('Operação indisponível.');
    }
    await registrarAuditoria(tx, {
      usuarioId: s.usuarioId,
      acao: 'cadastro manual · ' + modulo,
      entidade,
      entidadeId,
      ip: null,
      antes: null,
      depois: { origem: 'CEAK Gestão', modulo },
    });
  });
  revalidatePath('/' + modulo);
}

/** Publicar ou retirar um produto do catálogo público com auditoria e sem alterar pagamentos. */
export async function alterarPublicacaoProduto(form: FormData): Promise<void> {
  const sessao = await exigirModulo('loja');
  if (sessao.perfil !== 'ADMINISTRADOR') throw new Error('Acesso restrito.');
  const id = String(form.get('id') ?? '');
  const status = String(form.get('status') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['ATIVO', 'INATIVO'].includes(status)) {
    throw new Error('Produto ou situação inválida.');
  }
  await comRls(contextoRls(sessao), async (tx) => {
    const produto = await tx.produto.findUnique({
      where: { id },
      select: { id: true, nome: true, status: true, precoCentavos: true },
    });
    if (!produto) throw new Error('Produto não encontrado.');
    if (status === 'ATIVO' && produto.precoCentavos <= 0)
      throw new Error('Defina o preço antes de publicar.');
    if (produto.status === status) return;
    await tx.produto.update({ where: { id }, data: { status: status as 'ATIVO' | 'INATIVO' } });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'publicação de produto',
      entidade: 'Produto',
      entidadeId: id,
      antes: { status: produto.status },
      depois: { status },
      ip: null,
    });
  });
  revalidatePath('/loja');
  revalidatePath('/loja', 'layout');
}

/** Define o estoque mínimo para alerta sem alterar a quantidade física. */
export async function alterarEstoqueMinimo(form: FormData): Promise<void> {
  const sessao = await exigirModulo('estoque');
  if (sessao.perfil !== 'ADMINISTRADOR') throw new Error('Acesso restrito.');
  const id = String(form.get('id') ?? '');
  const valor = String(form.get('minimo') ?? '')
    .trim()
    .replace(',', '.');
  const minimo = Number(valor);
  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !valor ||
    !Number.isFinite(minimo) ||
    minimo < 0 ||
    minimo > 1000000
  ) {
    throw new Error('Estoque mínimo inválido.');
  }
  await comRls(contextoRls(sessao), async (tx) => {
    const item = await tx.itemEstoque.findUnique({
      where: { id },
      select: { id: true, minimo: true },
    });
    if (!item) throw new Error('Item não encontrado.');
    await tx.itemEstoque.update({ where: { id }, data: { minimo } });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'estoque mínimo atualizado',
      entidade: 'ItemEstoque',
      entidadeId: id,
      antes: { minimo: item.minimo?.toString() ?? null },
      depois: { minimo },
      ip: null,
    });
  });
  revalidatePath('/estoque');
}


/**
 * Ativação controlada, sem iniciar execução por agendamento.
 * Apenas o diagnóstico MANUAL de estoque está aprovado nesta etapa.
 * A confirmação explícita e a auditoria são gravadas com a mudança.
 */
export async function alterarAtivacaoAutomacao(form: FormData): Promise<void> {
  const sessao = await exigirModulo('automacoes');
  if (sessao.perfil !== 'ADMINISTRADOR') throw new Error('Acesso restrito.');
  const id = String(form.get('id') ?? '');
  const ativa = String(form.get('ativa') ?? '');
  const confirmacao = String(form.get('confirmacao') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['sim', 'nao'].includes(ativa) ||
      confirmacao !== 'CONFIRMO') {
    throw new Error('Confirme a alteração da automação.');
  }
  await comRls(contextoRls(sessao), async tx => {
    const regra = await tx.automacao.findUnique({
      where: { id },
      select: { id: true, gatilho: true, acao: true, ativa: true, exigeAprovacao: true },
    });
    if (!regra) throw new Error('Automação não encontrada.');
    const ativar = ativa === 'sim';
    if (ativar && (!['MANUAL', 'DIARIO'].includes(regra.gatilho) ||
        regra.acao !== 'DIAGNOSTICO_ESTOQUE' ||
        !regra.exigeAprovacao)) {
      throw new Error('A ativação desta regra exige homologação de gatilho e ação.');
    }
    if (regra.ativa === ativar) return;
    const alterada = await tx.automacao.updateMany({
      where: { id, ativa: !ativar },
      data: { ativa: ativar },
    });
    if (alterada.count !== 1) throw new Error('A automação foi alterada em outra sessão.');
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: ativar ? (regra.gatilho === 'DIARIO'
        ? 'automacao.ativada_diaria' : 'automacao.ativada_manual') : 'automacao.desativada',
      entidade: 'Automacao',
      entidadeId: id,
      antes: { ativa: regra.ativa },
      depois: { ativa: ativar, acao: regra.acao, gatilho: regra.gatilho,
        executaSozinha: ativar && regra.gatilho === 'DIARIO' },
      ip: null,
    });
  });
  revalidatePath('/automacoes');
}

/**
 * Primeiro executor seguro do CEAK: diagnóstico manual de estoque.
 * Não publica mensagens, não movimenta itens e não aciona serviços externos.
 * Regras genéricas permanecem desativadas e não são interpretadas como código.
 */
export async function executarDiagnosticoEstoque(form: FormData): Promise<void> {
  const sessao = await exigirModulo('automacoes');
  if (sessao.perfil !== 'ADMINISTRADOR') throw new Error('Somente administradores podem executar automações.');
  const id = String(form.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Automação inválida.');
  const inicio = Date.now();
  await comRls(contextoRls(sessao), async tx => {
    const regra = await tx.automacao.findUnique({
      where: { id },
      select: { id: true, nome: true, gatilho: true, acao: true, ativa: true, exigeAprovacao: true },
    });
    if (!regra || !regra.ativa || regra.gatilho !== 'MANUAL' || regra.acao !== 'DIAGNOSTICO_ESTOQUE') {
      throw new Error('Regra não homologada para execução. Cadastre o diagnóstico manual de estoque.');
    }
    // O administrador iniciar este diagnóstico é a confirmação humana da operação.
    // Somente regras aprovadas e ativadas podem ser executadas, sem enviar nada.
    const registros = await tx.itemEstoque.findMany({
      select: { id: true, nome: true, saldo: true, minimo: true },
      take: 5001,
    });
    if (registros.length > 5000) throw new Error('Mais de 5.000 itens. O diagnóstico requer paginação.');
    const abaixoMinimo = registros.filter(i => i.minimo !== null && Number(i.saldo) < Number(i.minimo));
    const execucao = await tx.execucao.create({
      data: {
        automacaoId: regra.id,
        status: 'SUCESSO',
        entrada: { modo: 'MANUAL', acao: 'DIAGNOSTICO_ESTOQUE' },
        saida: {
          itensAnalisados: registros.length,
          abaixoDoMinimo: abaixoMinimo.length,
          amostra: abaixoMinimo.slice(0, 20).map(i => ({
            itemId: i.id, nome: i.nome, saldo: String(i.saldo), minimo: String(i.minimo),
          })),
          somenteLeitura: true,
          mensagemExternaEnviada: false,
        },
        duracaoMs: Math.max(0, Date.now() - inicio),
        finalizadaEm: new Date(),
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'automacao.diagnostico_estoque.executado',
      entidade: 'Automacao',
      entidadeId: regra.id,
      ip: null,
      antes: null,
      depois: { execucaoId: execucao.id, automacaoId: regra.id, itensAnalisados: registros.length,
        abaixoDoMinimo: abaixoMinimo.length, somenteLeitura: true },
    });
  });
  revalidatePath('/automacoes');
}
