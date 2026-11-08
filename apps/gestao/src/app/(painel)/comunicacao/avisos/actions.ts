'use server';

import { revalidatePath } from 'next/cache';
import { comRls, registrarAuditoria } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';

function validarTexto(form: FormData, chave: string, minimo: number, maximo: number) {
  const valor = String(form.get(chave) ?? '').trim();
  if (valor.length < minimo || valor.length > maximo) {
    throw new Error(`O campo ${chave} deve conter de ${minimo} a ${maximo} caracteres.`);
  }
  return valor;
}

export async function criarAvisoInterno(form: FormData): Promise<void> {
  const sessao = await exigirModulo('comunicacao');
  if (sessao.perfil !== 'ADMINISTRADOR') throw new Error('Apenas administradores podem criar avisos gerais.');
  const titulo = validarTexto(form, 'titulo', 4, 160);
  const mensagem = validarTexto(form, 'mensagem', 10, 2000);
  await comRls(contextoRls(sessao), async (tx) => {
    const comunicado = await tx.comunicacao.create({
      data: {
        canal: 'APP',
        titulo,
        mensagem,
        publico: 'Membros do aplicativo com consentimento',
        status: 'RASCUNHO',
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId, acao: 'comunicacao.app.rascunho',
      entidade: 'Comunicacao', entidadeId: comunicado.id,
      antes: null, depois: { titulo, canal: 'APP', status: 'RASCUNHO' }, ip: null,
    });
  });
  revalidatePath('/comunicacao/avisos');
}

/**
 * Cria notificações somente na caixa interna do PWA, sem disparar push,
 * WhatsApp ou e-mail. Nunca alcança quem não tem conta ativa e consentimento.
 */
export async function publicarAvisoInterno(form: FormData): Promise<void> {
  const sessao = await exigirModulo('comunicacao');
  if (sessao.perfil !== 'ADMINISTRADOR') throw new Error('Apenas administradores podem publicar avisos gerais.');
  const id = String(form.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Aviso inválido.');
  await comRls(contextoRls(sessao), async (tx) => {
    const aviso = await tx.comunicacao.findUnique({
      where: { id },
      select: { id: true, canal: true, titulo: true, mensagem: true, status: true },
    });
    if (!aviso || aviso.canal !== 'APP' || aviso.status !== 'RASCUNHO') {
      throw new Error('O aviso não está em rascunho ou já foi publicado.');
    }
    const pessoas = await tx.pessoa.findMany({
      where: {
        usuario: { is: { ativo: true } },
        consentimentoEm: { not: null },
        exclusaoSolicitadaEm: null,
        anonimizadaEm: null,
        perfil: { in: ['MEMBRO', 'VISITANTE', 'VOLUNTARIO', 'INSTRUTOR'] },
      },
      select: { id: true },
      take: 5001,
    });
    if (!pessoas.length) throw new Error('Ainda não há membros cadastrados com consentimento para receber avisos.');
    if (pessoas.length > 5000) throw new Error('Envio acima do limite de segurança. Use segmentação de público.');
    const atualizado = await tx.comunicacao.updateMany({
      where: { id, canal: 'APP', status: 'RASCUNHO' },
      data: { status: 'ENVIADO', enviadoEm: new Date(), enviados: pessoas.length },
    });
    if (atualizado.count !== 1) throw new Error('Aviso já processado por outra sessão.');
    await tx.notificacao.createMany({
      data: pessoas.map((p) => ({
        pessoaId: p.id,
        categoria: 'Comunicado',
        titulo: aviso.titulo,
        corpo: aviso.mensagem,
      })),
    });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId, acao: 'comunicacao.app.publicada',
      entidade: 'Comunicacao', entidadeId: aviso.id,
      antes: { status: 'RASCUNHO' }, depois: { status: 'ENVIADO', destinatarios: pessoas.length, canal: 'APP' },
      ip: null,
    });
  });
  revalidatePath('/comunicacao/avisos');
}
