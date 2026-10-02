/**
 * Serviços de domínio contra o banco real. Cada teste cria os próprios registros
 * e os remove no fim, sem alterar os dados do seed.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarMockPaymentProvider, CaixaDeSaida, criarMocksMensageria } from '@ceak/core/adapters';
import { criarLogger, type EntradaLog } from '@ceak/core/logger';
import { servicoPorSlug } from '@ceak/core/regras';
import {
  confirmarPixManual,
  ErroNegocio,
  iniciarDoacao,
  iniciarPedido,
  inscreverEmEvento,
  listarVagas,
  prisma,
  processarWebhookPix,
  solicitarAtendimento,
} from '../src';

const temBanco = !!process.env.DATABASE_URL;
const WHATS = '+5518900000001';

describe.skipIf(!temBanco)('serviços do site', () => {
  const logs: EntradaLog[] = [];
  const log = criarLogger([(e) => void logs.push(e)]);
  const msg = criarMocksMensageria(new CaixaDeSaida());
  const pagamento = criarMockPaymentProvider({
    chave: 'k@pix',
    nomeRecebedor: 'CEAK',
    cidade: 'Penapolis',
    webhookSecret: 'teste',
  });
  const deps = { pagamento, email: msg.email, whatsapp: msg.whatsapp, log };
  const criados = {
    doacoes: [] as string[],
    pedidos: [] as string[],
    estoque: '',
    produto: '',
    vaga: '',
    evento: '',
  };

  beforeAll(async () => {
    const item = await prisma.itemEstoque.create({
      data: {
        sku: 'TESTE-0001',
        nome: 'Produto de teste',
        categoria: 'LOJA',
        unidade: 'UN',
        saldo: 3,
        minimo: 2,
      },
    });
    const produto = await prisma.produto.create({
      data: {
        slug: 'produto-de-teste',
        nome: 'Produto de teste',
        categoria: 'Livros',
        precoCentavos: 1500,
        origem: 'DOADO',
        estado: 'NOVO',
        itemEstoqueId: item.id,
      },
    });
    const vaga = await prisma.vagaAssistencia.create({
      data: { inicio: new Date(Date.now() + 86_400_000 * 400), vagas: 1 },
    });
    const evento = await prisma.evento.create({
      data: {
        slug: 'evento-de-teste',
        titulo: 'Evento de teste',
        tipo: 'PALESTRA',
        status: 'CONFIRMADO',
        inicio: new Date(Date.now() + 86_400_000 * 400),
        local: 'Salão',
      },
    });
    Object.assign(criados, {
      estoque: item.id,
      produto: produto.id,
      vaga: vaga.id,
      evento: evento.id,
    });
  });

  afterAll(async () => {
    await prisma.doacao.deleteMany({ where: { id: { in: criados.doacoes } } });
    await prisma.pedido.deleteMany({ where: { id: { in: criados.pedidos } } });
    await prisma.produto.deleteMany({ where: { id: criados.produto } });
    await prisma.itemEstoque.deleteMany({ where: { id: criados.estoque } });
    await prisma.solicitacaoAssistencia.deleteMany({ where: { vagaId: criados.vaga } });
    await prisma.vagaAssistencia.deleteMany({ where: { id: criados.vaga } });
    await prisma.evento.deleteMany({ where: { id: criados.evento } });
    await prisma.auditoria.deleteMany({
      where: { entidadeId: { in: [...criados.doacoes, ...criados.pedidos] } },
    });
    await prisma.pessoa.deleteMany({ where: { whatsapp: WHATS } });
    await prisma.$disconnect();
  });

  it('doação: cobrança PIX, webhook confirma uma única vez e envia recibo', async () => {
    const { id } = await iniciarDoacao(
      { valorCentavos: 5000, destino: 'Assistência social', email: 'doador@teste.com' },
      deps,
    );
    criados.doacoes.push(id);
    const d = await prisma.doacao.findUniqueOrThrow({ where: { id } });
    expect(d.statusPagamento).toBe('AGUARDANDO');
    expect(d.brCode).toMatch(/^000201/);

    expect((await confirmarPixManual('doacao', id, deps)).pago).toBe(true);
    const pago = await prisma.doacao.findUniqueOrThrow({ where: { id } });
    expect(pago.statusPagamento).toBe('PAGO');
    expect(pago.reciboEmitidoEm).not.toBeNull();
    expect(msg.caixa.ultima('email')?.destino).toBe('doador@teste.com');

    // Webhook repetido é idempotente.
    const { corpo, assinatura } = pagamento.simularPagamento({
      id: d.cobrancaId!,
      referencia: `doacao:${id}`,
      valorCentavos: 5000,
    });
    expect(await processarWebhookPix(corpo, assinatura, deps)).toMatchObject({
      ok: true,
      jaProcessado: true,
    });
    expect(await prisma.auditoria.count({ where: { entidadeId: id } })).toBe(1);
  });

  it('webhook: recusa assinatura inválida e valor divergente', async () => {
    const { id } = await iniciarDoacao(
      { valorCentavos: 2000, destino: 'Assistência social' },
      deps,
    );
    criados.doacoes.push(id);
    const d = await prisma.doacao.findUniqueOrThrow({ where: { id } });
    const { corpo } = pagamento.simularPagamento({
      id: d.cobrancaId!,
      referencia: `doacao:${id}`,
      valorCentavos: 2000,
    });
    expect(await processarWebhookPix(corpo, 'forjada', deps)).toEqual({
      ok: false,
      motivo: 'assinatura',
    });

    const outro = pagamento.simularPagamento({
      id: d.cobrancaId!,
      referencia: `doacao:${id}`,
      valorCentavos: 1,
    });
    expect(await processarWebhookPix(outro.corpo, outro.assinatura, deps)).toEqual({
      ok: false,
      motivo: 'valor',
    });
    expect((await prisma.doacao.findUniqueOrThrow({ where: { id } })).statusPagamento).toBe(
      'AGUARDANDO',
    );
    expect(
      logs.some((l) => l.categoria === 'SEGURANCA' && l.mensagem.includes('assinatura inválida')),
    ).toBe(true);
  });

  it('pedido: preço do banco, baixa de estoque e alerta de mínimo', async () => {
    const base = { nome: 'Teste Loja', whatsapp: WHATS, consentimento: true as const };
    await expect(
      iniciarPedido({ ...base, itens: [{ produtoId: criados.produto, quantidade: 4 }] }, deps),
    ).rejects.toThrow(/apenas 3/);
    const { id, numero } = await iniciarPedido(
      { ...base, itens: [{ produtoId: criados.produto, quantidade: 2 }] },
      deps,
    );
    criados.pedidos.push(id);
    const p = await prisma.pedido.findUniqueOrThrow({ where: { id } });
    expect(p.totalCentavos).toBe(3000);
    expect(p.status).toBe('AGUARDANDO_PIX');

    expect((await confirmarPixManual('pedido', id, deps)).pago).toBe(true);
    const pago = await prisma.pedido.findUniqueOrThrow({ where: { id } });
    expect(pago.status).toBe('AGUARDANDO_RETIRADA');
    const item = await prisma.itemEstoque.findUniqueOrThrow({ where: { id: criados.estoque } });
    expect(Number(item.saldo)).toBe(1);
    const mov = await prisma.movimentacao.findFirstOrThrow({
      where: { itemEstoqueId: criados.estoque },
    });
    expect(mov).toMatchObject({ tipo: 'SAIDA', referencia: `Pedido #${numero}`, por: 'Automação' });
    expect(logs.some((l) => l.mensagem.startsWith('estoque.minimo · Produto de teste'))).toBe(true);

    // Webhook repetido não baixa de novo.
    await confirmarPixManual('pedido', id, deps);
    expect(
      Number(
        (await prisma.itemEstoque.findUniqueOrThrow({ where: { id: criados.estoque } })).saldo,
      ),
    ).toBe(1);
  });

  it('assistência: reserva a vaga e não aceita além do limite', async () => {
    const servico = servicoPorSlug('tratamento-espiritual')!;
    const antes = (await listarVagas(servico.tipo)).find((v) => v.id === criados.vaga);
    expect(antes?.restantes).toBe(1);
    const dados = {
      nome: 'Teste Ajuda',
      whatsapp: WHATS,
      vagaId: criados.vaga,
      relato: 'texto sigiloso',
      consentimento: true as const,
    };
    const r = await solicitarAtendimento(servico, dados, {
      whatsapp: msg.whatsapp,
      log,
      ip: '127.0.0.1',
    });
    const sol = await prisma.solicitacaoAssistencia.findUniqueOrThrow({
      where: { id: r.id },
      include: { relato: true },
    });
    expect(sol).toMatchObject({
      nomeExibicao: 'Teste A.',
      status: 'AGENDADA',
      tipo: 'TRATAMENTO_ESPIRITUAL',
    });
    expect(sol.relato?.texto).toBe('texto sigiloso');
    const aud = await prisma.auditoria.findFirstOrThrow({ where: { entidadeId: r.id } });
    expect(JSON.stringify(aud.depois)).not.toContain('sigiloso');
    expect((await listarVagas(servico.tipo)).find((v) => v.id === criados.vaga)).toBeUndefined();
    await expect(
      solicitarAtendimento(servico, dados, { whatsapp: msg.whatsapp, log, ip: null }),
    ).rejects.toBeInstanceOf(ErroNegocio);
    await prisma.auditoria.deleteMany({ where: { entidadeId: r.id } });
  });

  it('inscrição é idempotente e confirma pelo WhatsApp', async () => {
    const dados = {
      nome: 'Teste Inscrição',
      whatsapp: WHATS,
      primeiraVez: true,
      consentimento: true as const,
    };
    await inscreverEmEvento('evento-de-teste', dados, { whatsapp: msg.whatsapp });
    await inscreverEmEvento('evento-de-teste', dados, { whatsapp: msg.whatsapp });
    expect(await prisma.inscricao.count({ where: { eventoId: criados.evento } })).toBe(1);
    expect(msg.caixa.ultima('whatsapp')?.corpo).toContain('Inscrição confirmada: Evento de teste');
    const pessoa = await prisma.pessoa.findFirstOrThrow({ where: { whatsapp: WHATS } });
    expect(pessoa.consentimentoVersao).toBe('2026.1');
    await expect(
      inscreverEmEvento('nao-existe', dados, { whatsapp: msg.whatsapp }),
    ).rejects.toThrow(/não encontrada/);
  });
});
