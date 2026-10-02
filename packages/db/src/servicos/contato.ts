import { type ContatoInput, type IntencaoAjudaInput } from '@ceak/core/validacao';
import { prisma } from '../client';
import { encontrarOuCriarPessoa } from './pessoas';

export async function registrarMensagemContato(d: ContatoInput) {
  return prisma.mensagemContato.create({
    data: { nome: d.nome, email: d.email, assunto: d.assunto, mensagem: d.mensagem },
    select: { id: true },
  });
}

/** "Quero ajudar": aviso de doação de itens, voluntariado ou habilidades. */
export async function registrarIntencaoAjuda(d: IntencaoAjudaInput) {
  return prisma.$transaction(async (tx) => {
    const p = await encontrarOuCriarPessoa(tx, { nome: d.nome, whatsapp: d.whatsapp });
    return tx.intencaoAjuda.create({
      data: {
        tipo: d.tipo,
        pessoaId: p.id,
        nome: d.nome,
        whatsapp: d.whatsapp,
        habilidades: d.habilidades,
      },
      select: { id: true },
    });
  });
}
