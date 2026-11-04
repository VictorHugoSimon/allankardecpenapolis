import { registrarAuditoria } from '../../auditoria';
import { comRls, type ContextoRls } from '../../rls';
import { ErroNegocio } from '../inscricoes';

export interface NovaMatriculaManual {
  turmaId: string;
  pessoaId: string;
}

export function validarMatriculaManual(d: NovaMatriculaManual): NovaMatriculaManual {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(d.turmaId) || !uuid.test(d.pessoaId))
    throw new ErroNegocio('Selecione uma turma e uma pessoa válidas.', 'identificadores');
  return d;
}

/** Matrículas exclusivamente de pessoas existentes. Não cria novos alunos ou dados fictícios. */
export async function opcoesMatriculaManual(ctx: ContextoRls) {
  return comRls(ctx, async (tx) => {
    const [turmas, pessoas] = await Promise.all([
      tx.turma.findMany({
        where: { status: 'ATIVA' },
        orderBy: [{ curso: { nome: 'asc' } }, { nome: 'asc' }],
        select: { id: true, nome: true, curso: { select: { nome: true } } },
      }),
      tx.pessoa.findMany({
        where: { anonimizadaEm: null, status: { not: 'INATIVO' } },
        orderBy: { nome: 'asc' },
        take: 200,
        select: { id: true, nome: true },
      }),
    ]);
    return { turmas, pessoas };
  });
}

export async function matricularPessoaManual(
  ctx: ContextoRls & { usuarioId: string },
  dados: NovaMatriculaManual,
  ip: string | null,
): Promise<{ id: string }> {
  if (!['ADMINISTRADOR', 'DIRETORIA', 'COORDENADOR'].includes(ctx.perfil))
    throw new ErroNegocio('Seu perfil não permite matricular participantes.', 'sem_permissao');
  const d = validarMatriculaManual(dados);
  return comRls(ctx, async (tx) => {
    const [turma, pessoa, matriculaExistente] = await Promise.all([
      tx.turma.findUnique({ where: { id: d.turmaId }, select: { id: true, status: true } }),
      tx.pessoa.findFirst({
        where: { id: d.pessoaId, anonimizadaEm: null, status: { not: 'INATIVO' } },
        select: { id: true },
      }),
      tx.matricula.findUnique({
        where: { turmaId_pessoaId: { turmaId: d.turmaId, pessoaId: d.pessoaId } },
        select: { id: true },
      }),
    ]);
    if (!turma || turma.status !== 'ATIVA')
      throw new ErroNegocio('A turma deve estar ativa.', 'turma');
    if (!pessoa) throw new ErroNegocio('Pessoa indisponível para matrícula.', 'pessoa');
    if (matriculaExistente)
      throw new ErroNegocio('A pessoa já possui matrícula nesta turma.', 'duplicada');
    const nova = await tx.matricula.create({
      data: { turmaId: d.turmaId, pessoaId: d.pessoaId, status: 'ATIVA', progresso: 0 },
      select: { id: true },
    });
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: 'matriculou participante em turma',
      entidade: 'Matricula',
      entidadeId: nova.id,
      antes: null,
      depois: { turmaId: d.turmaId, pessoaId: d.pessoaId, status: 'ATIVA' },
      ip,
    });
    return nova;
  });
}
