import { prisma } from '../../client';
import { registrarAuditoria } from '../../auditoria';
import { ErroNegocio } from '../inscricoes';

export const DIAS_PROGRAMACAO = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
] as const;
export type DiaProgramacao = (typeof DIAS_PROGRAMACAO)[number];
export type ProgramacaoSemanal = Record<DiaProgramacao, string>;
const CHAVE = 'instituicao.programacao.v1';

export const PROGRAMACAO_VAZIA: ProgramacaoSemanal = {
  'Segunda-feira': '',
  'Terça-feira': '',
  'Quarta-feira': '',
  'Quinta-feira': '',
  'Sexta-feira': '',
  'Sábado': '',
  'Domingo': '',
};

/** Agenda semanal institucional confirmada; não usa os horários fictícios do protótipo. */
export async function programacaoInstitucional(): Promise<ProgramacaoSemanal> {
  const registro = await prisma.configuracao.findUnique({
    where: { chave: CHAVE },
    select: { valor: true },
  });
  const bruto = registro?.valor;
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) {
    return { ...PROGRAMACAO_VAZIA };
  }
  const fonte = bruto as Record<string, unknown>;
  return Object.fromEntries(
    DIAS_PROGRAMACAO.map((dia) => [dia, typeof fonte[dia] === 'string' ? fonte[dia] : '']),
  ) as ProgramacaoSemanal;
}

export function validarProgramacaoSemanal(dados: ProgramacaoSemanal): ProgramacaoSemanal {
  return Object.fromEntries(
    DIAS_PROGRAMACAO.map((dia) => {
      const valor = dados[dia];
      if (typeof valor !== 'string' || valor.trim().length > 160)
        throw new ErroNegocio('Programação inválida para ' + dia, 'programacao');
      return [dia, valor.trim()];
    }),
  ) as ProgramacaoSemanal;
}

/** Atualiza a agenda fixa com auditoria sem tocar nos eventos cadastrados. */
export async function salvarProgramacaoInstitucional(
  ctx: { usuarioId: string; perfil: string; ip: string | null },
  dados: ProgramacaoSemanal,
): Promise<void> {
  if (ctx.perfil !== 'ADMINISTRADOR')
    throw new ErroNegocio('Somente administradores podem alterar a programação.', 'sem_permissao');
  const novos = validarProgramacaoSemanal(dados);
  await prisma.$transaction(async (tx) => {
    const antes = await tx.configuracao.findUnique({ where: { chave: CHAVE } });
    await tx.configuracao.upsert({
      where: { chave: CHAVE },
      create: { chave: CHAVE, valor: novos },
      update: { valor: novos },
    });
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: 'atualizou programação semanal institucional',
      entidade: 'Configuracao',
      entidadeId: CHAVE,
      antes: { valor: antes?.valor ?? null },
      depois: { valor: novos },
      ip: ctx.ip,
    });
  });
}
