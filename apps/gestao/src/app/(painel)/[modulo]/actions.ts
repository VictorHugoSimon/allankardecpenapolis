'use server';

import { revalidatePath } from 'next/cache';
import { comRls, registrarAuditoria } from '@ceak/db';
import { exigirModulo, contextoRls } from '@/lib/auth';

type Operacao = 'doacoes' | 'loja' | 'estoque' | 'automacoes' | 'comunicacao';

function campo(form: FormData, nome: string, max = 180) {
  return String(form.get(nome) ?? '').trim().slice(0, max);
}
function quantidade(form: FormData, nome: string) {
  const texto = campo(form, nome, 30).replace(',', '.');
  const n = Number(texto);
  if (!texto || !Number.isFinite(n) || n <= 0 || n > 10000000) throw new Error('Quantidade ou valor inválido.');
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
  if (s.perfil !== 'ADMINISTRADOR') throw new Error('Somente o administrador pode cadastrar neste módulo.');
  const ctx = contextoRls(s);
  const tipo = campo(form, 'tipo', 30);
  await comRls(ctx, async (tx) => {
    let entidade = '';
    let entidadeId = '';
    if (modulo === 'doacoes') {
      const nome = campo(form, 'nome', 120);
      const destino = campo(form, 'destino', 120);
      if (!nome || !destino) throw new Error('Informe doador e destinação.');
      const itens = tipo === 'ITEM';
      const descricao = campo(form, 'descricao', 500);
      if (itens && !descricao) throw new Error('Descreva os itens recebidos.');
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
      entidade = 'Doacao'; entidadeId = doacao.id;
    } else if (modulo === 'loja') {
      const nome = campo(form, 'nome', 150);
      const categoria = campo(form, 'categoria', 100);
      if (!nome || !categoria) throw new Error('Informe nome e categoria.');
      const preco = centavos(form);
      const produto = await tx.produto.create({
        data: {
          nome, categoria, precoCentavos: preco,
          slug: 'ceak-' + crypto.randomUUID(),
          descricao: campo(form, 'descricao', 1500) || null,
          origem: 'DOADO', estado: 'NOVO', status: 'RASCUNHO', imagens: [],
        },
      });
      entidade = 'Produto'; entidadeId = produto.id;
    } else if (modulo === 'estoque') {
      if (tipo === 'MOVIMENTO') {
        const id = campo(form, 'itemId', 50);
        const movimento = campo(form, 'movimento', 20);
        const motivo = campo(form, 'motivo', 200);
        const q = quantidade(form, 'quantidade');
        if (!['ENTRADA', 'SAIDA'].includes(movimento) || !motivo) throw new Error('Informe tipo e motivo.');
        const item = await tx.itemEstoque.findUnique({ where: { id } });
        if (!item) throw new Error('Item inexistente.');
        if (movimento === 'SAIDA' && Number(item.saldo) < q) throw new Error('Saldo insuficiente.');
        await tx.itemEstoque.update({ where: { id }, data: { saldo: { increment: movimento === 'ENTRADA' ? q : -q } } });
        const mov = await tx.movimentacao.create({
          data: { itemEstoqueId: id, tipo: movimento as 'ENTRADA' | 'SAIDA', motivo, quantidade: q, por: s.nome },
        });
        entidade = 'Movimentacao'; entidadeId = mov.id;
      } else {
        const sku = campo(form, 'sku', 60).toUpperCase();
        const nome = campo(form, 'nome', 160);
        if (!sku || !nome) throw new Error('Informe SKU e nome.');
        const item = await tx.itemEstoque.create({
          data: { sku, nome, categoria: 'DOACOES', unidade: 'UN', saldo: 0 },
        });
        entidade = 'ItemEstoque'; entidadeId = item.id;
      }
    } else if (modulo === 'comunicacao') {
      const titulo = campo(form, 'titulo', 160);
      const mensagem = campo(form, 'mensagem', 3000);
      if (!titulo || !mensagem) throw new Error('Informe título e mensagem.');
      const registro = await tx.comunicacao.create({
        data: { titulo, mensagem, publico: 'A definir', canal: 'EMAIL', status: 'RASCUNHO' },
      });
      entidade = 'Comunicacao'; entidadeId = registro.id;
    } else if (modulo === 'automacoes') {
      const nome = campo(form, 'nome', 120);
      const gatilho = campo(form, 'gatilho', 150);
      const acao = campo(form, 'acao', 150);
      if (!nome || !gatilho || !acao) throw new Error('Informe nome, gatilho e ação.');
      const registro = await tx.automacao.create({
        data: { chave: 'manual-' + crypto.randomUUID(), nome, gatilho, acao, ativa: false, exigeAprovacao: true },
      });
      entidade = 'Automacao'; entidadeId = registro.id;
    } else {
      throw new Error('Operação indisponível.');
    }
    await registrarAuditoria(tx, {
      usuarioId: s.usuarioId,
      acao: 'cadastro manual · ' + modulo,
      entidade,
      entidadeId,
      antes: null,
      depois: { origem: 'CEAK Gestão', modulo },
    });
  });
  revalidatePath('/' + modulo);
}
