import {
  type EmailProvider,
  type PaymentProvider,
  type WhatsAppProvider,
} from '@ceak/core/adapters';
import { formatarCentavos } from '@ceak/core/format';
import { type Logger } from '@ceak/core/logger';
import { normalizarCarrinho } from '@ceak/core/regras';
import { type CheckoutInput, type DoacaoInput } from '@ceak/core/validacao';
import { registrarAuditoria } from '../auditoria';
import { prisma } from '../client';
import { type Tx } from '../rls';
import { ErroNegocio } from './inscricoes';
import { encontrarOuCriarPessoa } from './pessoas';

export interface DepsPagamento {
  pagamento: PaymentProvider;
  email: EmailProvider;
  whatsapp: WhatsAppProvider;
  log: Logger;
}

/** Referência da cobrança no PSP: "doacao:<id>" ou "pedido:<id>". */
type Referencia = { tipo: 'doacao' | 'pedido'; id: string };
const referencia = (r: Referencia) => `${r.tipo}:${r.id}`;
function lerReferencia(ref: string): Referencia | null {
  const m = ref.match(/^(doacao|pedido):([0-9a-f-]{36})$/);
  return m ? { tipo: m[1] as Referencia['tipo'], id: m[2]! } : null;
}

// ─── Doação ──────────────────────────────────────────────────────────────

/** Cria a doação (aguardando) e a cobrança PIX. */
export async function iniciarDoacao(
  dados: DoacaoInput,
  deps: Pick<DepsPagamento, 'pagamento' | 'log'>,
) {
  const doacao = await prisma.doacao.create({
    data: {
      valorCentavos: dados.valorCentavos,
      forma: 'PIX',
      destino: dados.destino,
      doadorNome: dados.nome ?? 'Anônimo',
      doadorEmail: dados.email,
      statusPagamento: 'AGUARDANDO',
    },
    select: { id: true },
  });
  const cobranca = await deps.pagamento.criarCobranca({
    valorCentavos: dados.valorCentavos,
    descricao: `Doacao CEAK`,
    referencia: referencia({ tipo: 'doacao', id: doacao.id }),
  });
  await prisma.doacao.update({
    where: { id: doacao.id },
    data: { cobrancaId: cobranca.id, brCode: cobranca.brCode },
  });
  deps.log.info('FINANCEIRO', `pix.cobranca · doação ${formatarCentavos(dados.valorCentavos)}`, {
    rota: '/doar',
    status: 201,
  });
  return { id: doacao.id };
}

// ─── Pedido da loja ─────────────────────────────────────────────────────

/** Cria o pedido com preços e estoque do banco (nunca do navegador) e a cobrança PIX. */
export async function iniciarPedido(
  dados: CheckoutInput,
  deps: Pick<DepsPagamento, 'pagamento' | 'log'>,
) {
  const itens = normalizarCarrinho(dados.itens);
  const pedido = await prisma.$transaction(async (tx) => {
    const produtos = await tx.produto.findMany({
      where: { id: { in: itens.map((i) => i.produtoId) }, status: 'ATIVO' },
      select: {
        id: true,
        nome: true,
        precoCentavos: true,
        itemEstoque: { select: { saldo: true } },
      },
    });
    for (const i of itens) {
      const p = produtos.find((x) => x.id === i.produtoId);
      if (!p)
        throw new ErroNegocio(
          'Um dos produtos não está mais disponível. Revise o carrinho.',
          'produto_indisponivel',
        );
      const saldo = p.itemEstoque ? Number(p.itemEstoque.saldo) : 0;
      if (saldo < i.quantidade) {
        throw new ErroNegocio(
          saldo > 0
            ? `Temos apenas ${saldo} unidade(s) de “${p.nome}”. Ajuste a quantidade.`
            : `“${p.nome}” esgotou. Remova do carrinho para continuar.`,
          'sem_estoque',
        );
      }
    }
    const linhas = itens.map((i) => {
      const p = produtos.find((x) => x.id === i.produtoId)!;
      return { produtoId: p.id, quantidade: i.quantidade, precoUnitCentavos: p.precoCentavos };
    });
    const total = linhas.reduce((s, l) => s + l.precoUnitCentavos * l.quantidade, 0);
    const pessoa = await encontrarOuCriarPessoa(tx, { nome: dados.nome, whatsapp: dados.whatsapp });
    return tx.pedido.create({
      data: {
        pessoaId: pessoa.id,
        clienteNome: dados.nome,
        clienteWhatsapp: dados.whatsapp,
        totalCentavos: total,
        itens: { create: linhas },
      },
      select: { id: true, numero: true, totalCentavos: true },
    });
  });
  const cobranca = await deps.pagamento.criarCobranca({
    valorCentavos: pedido.totalCentavos,
    descricao: `Pedido ${pedido.numero} CEAK`,
    referencia: referencia({ tipo: 'pedido', id: pedido.id }),
  });
  await prisma.pedido.update({
    where: { id: pedido.id },
    data: { cobrancaId: cobranca.id, brCode: cobranca.brCode },
  });
  deps.log.info(
    'FINANCEIRO',
    `pix.cobranca · pedido #${pedido.numero} ${formatarCentavos(pedido.totalCentavos)}`,
    {
      rota: '/checkout',
      status: 201,
    },
  );
  return { id: pedido.id, numero: pedido.numero };
}

/**
 * Baixa automática do estoque de um pedido pago, com alerta de mínimo.
 * Registra movimentação, execução da automação e logs.
 */
async function baixarEstoque(tx: Tx, pedidoId: string, numero: number, log: Logger) {
  const itens = await tx.itemPedido.findMany({
    where: { pedidoId },
    select: {
      quantidade: true,
      produto: { select: { id: true, nome: true, itemEstoqueId: true } },
    },
  });
  const automacao = await tx.automacao.findUnique({
    where: { chave: 'baixa-estoque' },
    select: { id: true },
  });
  const alerta = await tx.automacao.findUnique({
    where: { chave: 'alerta-estoque' },
    select: { id: true },
  });
  const falhas: string[] = [];
  for (const i of itens) {
    if (!i.produto.itemEstoqueId) continue;
    // Bloqueia a linha do saldo para baixas concorrentes.
    const [item] = await tx.$queryRaw<
      { id: string; sku: string; saldo: string; minimo: string | null }[]
    >`
      SELECT id, sku, saldo::text, minimo::text FROM item_estoque WHERE id = ${i.produto.itemEstoqueId}::uuid FOR UPDATE`;
    if (!item) continue;
    const saldo = Number(item.saldo);
    if (saldo < i.quantidade) {
      falhas.push(`SKU ${item.sku} sem saldo`);
      log.error('AUTOMACAO', `pedido.pago → estoque.baixar: SKU ${item.sku} sem saldo`, {
        usuario: 'engine',
        status: 409,
      });
      continue;
    }
    const novo = saldo - i.quantidade;
    await tx.itemEstoque.update({ where: { id: item.id }, data: { saldo: novo } });
    await tx.movimentacao.create({
      data: {
        itemEstoqueId: item.id,
        tipo: 'SAIDA',
        motivo: 'Saída (venda)',
        quantidade: i.quantidade,
        referencia: `Pedido #${numero}`,
        por: 'Automação',
      },
    });
    if (novo <= 0)
      await tx.produto.update({ where: { id: i.produto.id }, data: { status: 'ESGOTADO' } });
    const minimo = item.minimo === null ? null : Number(item.minimo);
    if (minimo !== null && novo < minimo) {
      log.warn('AUTOMACAO', `estoque.minimo · ${i.produto.nome}: ${novo} (mínimo ${minimo})`, {
        usuario: 'engine',
      });
      if (alerta) {
        await tx.execucao.create({
          data: {
            automacaoId: alerta.id,
            status: 'SUCESSO',
            entrada: { sku: item.sku, saldo: novo, minimo },
            saida: { notificado: 'tesouraria' },
            finalizadaEm: new Date(),
          },
        });
      }
    }
  }
  if (automacao) {
    await tx.execucao.create({
      data: {
        automacaoId: automacao.id,
        status: falhas.length ? 'FALHA' : 'SUCESSO',
        entrada: { pedido: numero },
        erro: falhas.join('; ') || undefined,
        finalizadaEm: new Date(),
      },
    });
  }
}

// ─── Webhook ────────────────────────────────────────────────────────────

export type ResultadoWebhook =
  | { ok: true; tipo: 'doacao' | 'pedido'; id: string; jaProcessado: boolean }
  | { ok: false; motivo: string };

/**
 * Processa a confirmação de pagamento do PSP. Idempotente: webhooks repetidos
 * não duplicam baixa de estoque nem auditoria.
 */
export async function processarWebhookPix(
  corpo: string,
  assinatura: string | null,
  deps: DepsPagamento,
): Promise<ResultadoWebhook> {
  let evento;
  try {
    evento = await deps.pagamento.lerWebhook(corpo, assinatura);
  } catch {
    deps.log.warn('SEGURANCA', 'pix.webhook: assinatura inválida', {
      rota: '/api/pix/webhook',
      status: 401,
      usuario: 'pix-webhook',
    });
    return { ok: false, motivo: 'assinatura' };
  }
  const ref = lerReferencia(evento.referencia);
  if (!ref) return { ok: false, motivo: 'referencia' };
  if (evento.status !== 'PAGO') return { ok: false, motivo: 'status' };

  if (ref.tipo === 'doacao') {
    const r = await prisma.$transaction(async (tx) => {
      const [d] = await tx.$queryRaw<
        {
          id: string;
          valor_centavos: number;
          status_pagamento: string;
          cobranca_id: string | null;
        }[]
      >`
        SELECT id, valor_centavos, status_pagamento::text, cobranca_id FROM doacao WHERE id = ${ref.id}::uuid FOR UPDATE`;
      if (!d || d.cobranca_id !== evento.cobrancaId)
        return { ok: false as const, motivo: 'nao_encontrado' };
      if (d.valor_centavos !== evento.valorCentavos) return { ok: false as const, motivo: 'valor' };
      if (d.status_pagamento === 'PAGO') return { ok: true as const, jaProcessado: true };
      const pagoEm = evento.pagoEm ?? new Date();
      const doacao = await tx.doacao.update({
        where: { id: d.id },
        data: { statusPagamento: 'PAGO', pagoEm, reciboEmitidoEm: pagoEm },
        select: { doadorEmail: true, doadorNome: true, destino: true },
      });
      await registrarAuditoria(tx, {
        usuarioId: null,
        acao: 'pagamento PIX confirmado',
        entidade: 'Doacao',
        entidadeId: d.id,
        antes: { statusPagamento: 'AGUARDANDO' },
        depois: { statusPagamento: 'PAGO', valorCentavos: d.valor_centavos },
        ip: null,
      });
      return { ok: true as const, jaProcessado: false, doacao };
    });
    if (!r.ok) {
      deps.log.error('FINANCEIRO', `pix.webhook: doação recusada (${r.motivo})`, {
        usuario: 'pix-webhook',
        status: 409,
      });
      return r;
    }
    if (!r.jaProcessado) {
      deps.log.info(
        'FINANCEIRO',
        `pix.recebido · doação ${formatarCentavos(evento.valorCentavos)}`,
        { usuario: 'pix-webhook', status: 200 },
      );
      if (r.doacao?.doadorEmail) {
        await deps.email
          .enviar(
            r.doacao.doadorEmail,
            'Recibo da sua doação ao CEAK',
            `Recebemos ${formatarCentavos(evento.valorCentavos)} (${r.doacao.destino}). Obrigado pela sua doação. A doação aparece no relatório de transparência do mês.`,
          )
          .catch(() => undefined);
      }
    }
    return { ok: true, tipo: 'doacao', id: ref.id, jaProcessado: r.jaProcessado };
  }

  // Pedido da loja
  const r = await prisma.$transaction(async (tx) => {
    const [p] = await tx.$queryRaw<
      {
        id: string;
        numero: number;
        total_centavos: number;
        status_pagamento: string;
        cobranca_id: string | null;
        cliente_whatsapp: string | null;
      }[]
    >`
      SELECT id, numero, total_centavos, status_pagamento::text, cobranca_id, cliente_whatsapp FROM pedido WHERE id = ${ref.id}::uuid FOR UPDATE`;
    if (!p || p.cobranca_id !== evento.cobrancaId)
      return { ok: false as const, motivo: 'nao_encontrado' };
    if (p.total_centavos !== evento.valorCentavos) return { ok: false as const, motivo: 'valor' };
    if (p.status_pagamento === 'PAGO') return { ok: true as const, jaProcessado: true, p };
    await tx.pedido.update({
      where: { id: p.id },
      data: {
        statusPagamento: 'PAGO',
        status: 'AGUARDANDO_RETIRADA',
        pagoEm: evento.pagoEm ?? new Date(),
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: null,
      acao: 'pagamento PIX confirmado',
      entidade: 'Pedido',
      entidadeId: p.id,
      antes: { status: 'AGUARDANDO_PIX', statusPagamento: 'AGUARDANDO' },
      depois: { status: 'AGUARDANDO_RETIRADA', statusPagamento: 'PAGO' },
      ip: null,
    });
    await baixarEstoque(tx, p.id, p.numero, deps.log);
    return { ok: true as const, jaProcessado: false, p };
  });
  if (!r.ok) {
    deps.log.error('FINANCEIRO', `pix.webhook: pedido recusado (${r.motivo})`, {
      usuario: 'pix-webhook',
      status: 409,
    });
    return r;
  }
  if (!r.jaProcessado) {
    deps.log.info(
      'FINANCEIRO',
      `pix.recebido · pedido #${r.p.numero} ${formatarCentavos(evento.valorCentavos)}`,
      {
        usuario: 'pix-webhook',
        status: 200,
      },
    );
    if (r.p.cliente_whatsapp) {
      await deps.whatsapp
        .enviar(
          r.p.cliente_whatsapp,
          `Pedido nº ${r.p.numero} confirmado. Retirada no CEAK, ter. a sáb., 19h às 21h30.`,
        )
        .catch(() => undefined);
    }
  }
  return { ok: true, tipo: 'pedido', id: ref.id, jaProcessado: r.jaProcessado };
}

/**
 * Botão "Já fiz o PIX". Com o PSP simulado, dispara o webhook de confirmação
 * (como o banco faria). Com um PSP real, só consulta o status.
 */
export async function confirmarPixManual(
  tipo: 'doacao' | 'pedido',
  id: string,
  deps: DepsPagamento,
) {
  const reg =
    tipo === 'doacao'
      ? await prisma.doacao.findUnique({
          where: { id },
          select: { cobrancaId: true, valorCentavos: true, statusPagamento: true },
        })
      : await prisma.pedido.findUnique({
          where: { id },
          select: { cobrancaId: true, totalCentavos: true, statusPagamento: true },
        });
  if (!reg?.cobrancaId) return { pago: false };
  if (reg.statusPagamento === 'PAGO') return { pago: true };
  const valorCentavos = 'valorCentavos' in reg ? (reg.valorCentavos ?? 0) : reg.totalCentavos;
  if (deps.pagamento.simularPagamento) {
    const { corpo, assinatura } = deps.pagamento.simularPagamento({
      id: reg.cobrancaId,
      referencia: referencia({ tipo, id }),
      valorCentavos,
    });
    const r = await processarWebhookPix(corpo, assinatura, deps);
    return { pago: r.ok };
  }
  const c = await deps.pagamento.consultar(reg.cobrancaId);
  return { pago: c?.status === 'PAGO' };
}
