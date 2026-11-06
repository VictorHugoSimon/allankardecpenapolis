'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { comRls, registrarAuditoria } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

function falhar(msg: string): never { throw new Error(msg); }
function numero(v: FormDataEntryValue | null, min = 0) {
  const n = Number(String(v ?? '').replace(',', '.'));
  if (!Number.isFinite(n) || n < min || n > 1_000_000) falhar('Quantidade ou valor inválido.');
  return n;
}
function texto(f: FormData, chave: string, limite = 120) {
  const valor = String(f.get(chave) ?? '').trim();
  if (valor.length < 2 || valor.length > limite) falhar('Campo ' + chave + ' inválido.');
  return valor;
}
async function autorizacao(modulo: 'loja'|'estoque'|'doacoes'|'comunicacao'|'automacoes') {
  const s = await exigirModulo(modulo);
  const permitido = modulo === 'doacoes' ? ['ADMINISTRADOR', 'TESOURARIA', 'DIRETORIA'] :
    modulo === 'comunicacao' ? ['ADMINISTRADOR', 'SECRETARIA', 'DIRETORIA'] :
    ['ADMINISTRADOR', 'DIRETORIA'];
  if (!permitido.includes(s.perfil)) falhar('Seu perfil não pode cadastrar neste módulo.');
  return contexto(s);
}
async function auditar(tx: Parameters<Parameters<typeof comRls>[1]>[0], ctx: Awaited<ReturnType<typeof contexto>>, entidade: string, id: string, dados: object) {
  await registrarAuditoria(tx, { usuarioId: ctx.usuarioId, acao: 'cadastro operacional', entidade, entidadeId: id, antes: null, depois: dados, ip: ctx.ip });
}

export async function cadastrarProduto(f: FormData): Promise<void> {
  const ctx = await autorizacao('loja');
  const nome = texto(f, 'nome');
  const categoria = texto(f, 'categoria');
  const preco = Math.round(numero(f.get('preco'), 0.01) * 100);
  if (!Number.isSafeInteger(preco) || preco > 100_000_000) falhar('Preço fora do limite.');
  await comRls(ctx, async tx => {
    const p = await tx.produto.create({ data: {
      nome, categoria, precoCentavos: preco, descricao: String(f.get('descricao') ?? '').trim().slice(0, 800) || null,
      slug: 'ceak-' + crypto.randomUUID(),
      origem: 'LIVRARIA', estado: 'NOVO', status: 'RASCUNHO', imagens: []
    } });
    await auditar(tx, ctx, 'Produto', p.id, { nome, categoria, precoCentavos: preco });
  });
  revalidatePath('/loja');
  redirect('/loja?ok=produto');
}

export async function cadastrarItemEstoque(f: FormData): Promise<void> {
  const ctx = await autorizacao('estoque');
  const nome = texto(f, 'nome');
  const sku = texto(f, 'sku', 64).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{1,63}$/.test(sku)) falhar('SKU deve conter letras, números, ponto, traço ou sublinhado.');
  const categoria = z.enum(['ALIMENTOS','LOJA','LIMPEZA','DOACOES']).parse(f.get('categoria'));
  const unidade = z.enum(['UN','KG','PECA','CESTA','REAIS']).parse(f.get('unidade'));
  const minimo = numero(f.get('minimo') || '0');
  await comRls(ctx, async tx => {
    const item = await tx.itemEstoque.create({ data: { sku, nome, categoria, unidade, saldo: '0', minimo: String(minimo) } });
    await auditar(tx, ctx, 'ItemEstoque', item.id, { nome, sku, categoria, unidade, minimo });
  });
  revalidatePath('/estoque');
  redirect('/estoque?ok=item');
}

export async function movimentarEstoque(f: FormData): Promise<void> {
  const ctx = await autorizacao('estoque');
  const itemId = z.string().uuid().parse(f.get('itemId'));
  const tipo = z.enum(['ENTRADA','SAIDA']).parse(f.get('tipo'));
  const quantidade = numero(f.get('quantidade'), 0.001);
  const motivo = texto(f, 'motivo', 200);
  await comRls(ctx, async tx => {
    const atual = await tx.itemEstoque.findUnique({ where: { id: itemId }, select: { id: true } });
    if (!atual) falhar('Item não encontrado.');
    // Atualização condicional no próprio banco evita saldo negativo sob concorrência.
    const atualizado = await tx.itemEstoque.updateMany({
      where: tipo === 'SAIDA' ? { id: itemId, saldo: { gte: String(quantidade) } } : { id: itemId },
      data: { saldo: tipo === 'ENTRADA' ? { increment: String(quantidade) } : { decrement: String(quantidade) } },
    });
    if (atualizado.count !== 1) falhar('Saldo insuficiente para a saída.');
    const movimento = await tx.movimentacao.create({ data: { itemEstoqueId: itemId, tipo, quantidade: String(quantidade), motivo, por: ctx.usuarioId } });
    await auditar(tx, ctx, 'Movimentacao', movimento.id, { itemId, tipo, quantidade, motivo });
  });
  revalidatePath('/estoque');
  redirect('/estoque?ok=movimento');
}

export async function registrarDoacao(f: FormData): Promise<void> {
  const ctx = await autorizacao('doacoes');
  const doadorNome = texto(f, 'doador');
  const descricao = texto(f, 'descricao', 400);
  await comRls(ctx, async tx => {
    const registro = await tx.doacao.create({ data: {
      doadorNome, itemDescricao: descricao, destino: 'Centro Espírita Allan Kardec',
      forma: 'ENTREGA', statusPagamento: 'AGUARDANDO',
    } });
    await auditar(tx, ctx, 'Doacao', registro.id, { doadorNome, itemDescricao: descricao, confirmacaoPendente: true });
  });
  revalidatePath('/doacoes');
  redirect('/doacoes?ok=doacao');
}

export async function criarComunicado(f: FormData): Promise<void> {
  const ctx = await autorizacao('comunicacao');
  const titulo = texto(f, 'titulo', 140);
  const mensagem = texto(f, 'mensagem', 3000);
  const publico = texto(f, 'publico', 140);
  await comRls(ctx, async tx => {
    const item = await tx.comunicacao.create({ data: { titulo, mensagem, publico, canal: 'EMAIL', status: 'RASCUNHO' } });
    await auditar(tx, ctx, 'Comunicacao', item.id, { titulo, publico, situacao: 'RASCUNHO' });
  });
  revalidatePath('/comunicacao');
  redirect('/comunicacao?ok=rascunho');
}

export async function cadastrarAutomacao(f: FormData): Promise<void> {
  const ctx = await autorizacao('automacoes');
  const nome = texto(f, 'nome', 140);
  const gatilho = texto(f, 'gatilho', 200);
  const acao = texto(f, 'acao', 400);
  await comRls(ctx, async tx => {
    const regra = await tx.automacao.create({ data: { chave: 'ceak-' + crypto.randomUUID(), nome, gatilho, acao, ativa: false, exigeAprovacao: true } });
    await auditar(tx, ctx, 'Automacao', regra.id, { nome, gatilho, acao, ativa: false });
  });
  revalidatePath('/automacoes');
  redirect('/automacoes?ok=automacao');
}
