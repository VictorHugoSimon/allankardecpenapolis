'use server';

import { revalidatePath } from 'next/cache';
import { comRls, registrarAuditoria } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';

const unidades = ['UN', 'KG', 'PECA', 'CESTA'] as const;
const idSeguro = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function criarCampanha(form: FormData): Promise<void> {
  const s = await exigirModulo('doacoes');
  if (s.perfil !== 'ADMINISTRADOR')
    throw new Error('Apenas administradores podem criar campanhas.');
  const titulo = String(form.get('titulo') ?? '')
    .trim()
    .slice(0, 160);
  const descricao = String(form.get('descricao') ?? '')
    .trim()
    .slice(0, 2000);
  const unidade = String(form.get('unidade') ?? '');
  const meta = Number(String(form.get('meta') ?? ''));
  const ponto = String(form.get('ponto') ?? '')
    .trim()
    .slice(0, 180);
  if (titulo.length < 4 || !unidades.some((u) => u === unidade))
    throw new Error('Título ou unidade inválidos.');
  if (!Number.isSafeInteger(meta) || meta < 1 || meta > 10000000)
    throw new Error('Informe uma meta válida.');
  await comRls(contextoRls(s), async (tx) => {
    const campanha = await tx.campanha.create({
      data: {
        titulo,
        descricao: descricao || null,
        slug: 'campanha-ceak-' + crypto.randomUUID(),
        unidade: unidade as (typeof unidades)[number],
        meta,
        arrecadado: 0,
        status: 'RASCUNHO',
        destaque: false,
        pontosColeta: ponto ? [ponto] : [],
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: s.usuarioId,
      acao: 'campanha.criada',
      entidade: 'Campanha',
      entidadeId: campanha.id,
      antes: null,
      depois: { titulo, unidade, meta, status: 'RASCUNHO' },
      ip: null,
    });
  });
  revalidatePath('/doacoes/campanhas');
  revalidatePath('/doacoes');
}

export async function alterarCampanha(form: FormData): Promise<void> {
  const s = await exigirModulo('doacoes');
  if (s.perfil !== 'ADMINISTRADOR')
    throw new Error('Apenas administradores podem alterar campanhas.');
  const id = String(form.get('id') ?? '');
  const status = String(form.get('status') ?? '');
  if (!idSeguro.test(id) || !['ATIVA', 'ENCERRADA'].includes(status))
    throw new Error('Operação inválida.');
  await comRls(contextoRls(s), async (tx) => {
    const existente = await tx.campanha.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existente) throw new Error('Campanha não encontrada.');
    if (existente.status === status) return;
    if (existente.status === 'ENCERRADA' && status === 'ATIVA') {
      throw new Error('Uma campanha encerrada não pode ser reaberta. Crie uma nova campanha.');
    }
    const alterado = await tx.campanha.updateMany({
      where: { id, status: existente.status },
      data: { status: status as 'ATIVA' | 'ENCERRADA' },
    });
    if (alterado.count !== 1) throw new Error('Campanha atualizada por outra pessoa.');
    await registrarAuditoria(tx, {
      usuarioId: s.usuarioId,
      acao: 'campanha.situacao',
      entidade: 'Campanha',
      entidadeId: id,
      antes: { status: existente.status },
      depois: { status },
      ip: null,
    });
  });
  revalidatePath('/doacoes/campanhas');
  revalidatePath('/doacoes');
}
