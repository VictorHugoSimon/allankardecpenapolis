import { type WhatsAppProvider } from '@ceak/core/adapters';
import { formatarData, formatarHora } from '@ceak/core/format';
import { type InscricaoInput } from '@ceak/core/validacao';
import { prisma } from '../client';
import { encontrarOuCriarPessoa } from './pessoas';

export class ErroNegocio extends Error {
  constructor(
    message: string,
    readonly codigo: string,
  ) {
    super(message);
    this.name = 'ErroNegocio';
  }
}

/** Inscrição em atividade pública. Idempotente: repetir não duplica. */
export async function inscreverEmEvento(
  eventoSlug: string,
  dados: InscricaoInput,
  deps: { whatsapp: WhatsAppProvider },
) {
  const evento = await prisma.evento.findUnique({
    where: { slug: eventoSlug },
    select: {
      id: true,
      titulo: true,
      inicio: true,
      local: true,
      publico: true,
      inscricaoAberta: true,
      status: true,
    },
  });
  if (
    !evento ||
    !evento.publico ||
    ['RASCUNHO', 'CANCELADO', 'AGUARDANDO_APROVACAO'].includes(evento.status)
  ) {
    throw new ErroNegocio('Atividade não encontrada.', 'nao_encontrado');
  }
  if (!evento.inscricaoAberta || evento.status === 'ENCERRADO') {
    throw new ErroNegocio('As inscrições para esta atividade estão encerradas.', 'encerrada');
  }
  const pessoa = await prisma.$transaction(async (tx) => {
    const p = await encontrarOuCriarPessoa(tx, dados);
    await tx.inscricao.upsert({
      where: { eventoId_pessoaId: { eventoId: evento.id, pessoaId: p.id } },
      create: { eventoId: evento.id, pessoaId: p.id, primeiraVez: dados.primeiraVez },
      update: {},
    });
    return p;
  });
  await deps.whatsapp
    .enviar(
      dados.whatsapp,
      `Inscrição confirmada: ${evento.titulo} · ${formatarData(evento.inicio)} às ${formatarHora(evento.inicio)} · ${evento.local ?? 'CEAK'}. Apresente-se na recepção no dia da atividade.`,
    )
    .catch(() => undefined);
  return { evento, pessoaId: pessoa.id };
}

/** Pré-inscrição em curso/estudo. */
export async function preInscreverEmCurso(
  cursoSlug: string,
  dados: InscricaoInput,
  deps: { whatsapp: WhatsAppProvider },
) {
  const curso = await prisma.curso.findUnique({
    where: { slug: cursoSlug },
    select: { id: true, nome: true, ativo: true },
  });
  if (!curso || !curso.ativo) throw new ErroNegocio('Estudo não encontrado.', 'nao_encontrado');
  await prisma.$transaction(async (tx) => {
    const p = await encontrarOuCriarPessoa(tx, dados);
    await tx.inscricao.upsert({
      where: { cursoId_pessoaId: { cursoId: curso.id, pessoaId: p.id } },
      create: { cursoId: curso.id, pessoaId: p.id, primeiraVez: dados.primeiraVez },
      update: {},
    });
  });
  await deps.whatsapp
    .enviar(
      dados.whatsapp,
      `Recebemos sua inscrição em ${curso.nome}. A coordenação entrará em contato para indicar a turma.`,
    )
    .catch(() => undefined);
  return { curso };
}
