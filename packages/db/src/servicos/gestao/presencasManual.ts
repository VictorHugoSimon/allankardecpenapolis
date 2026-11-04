import { registrarAuditoria } from '../../auditoria';
import { comRls, type ContextoRls } from '../../rls';
import { ErroNegocio } from '../inscricoes';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ContextoEstudos = ContextoRls & { usuarioId: string };

export function validarNovaAula(input: { turmaId: string; numero: number; titulo: string; data: string }) {
  if (!UUID.test(input.turmaId)) throw new ErroNegocio('Turma inválida.', 'turma');
  const titulo = input.titulo.trim().replace(/\s+/g, ' ');
  if (titulo.length < 3 || titulo.length > 140) throw new ErroNegocio('Título da aula inválido.', 'titulo');
  if (!Number.isInteger(input.numero) || input.numero < 1 || input.numero > 1000)
    throw new ErroNegocio('Número da aula inválido.', 'numero');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data)) throw new ErroNegocio('Data inválida.', 'data');
  const data = new Date(input.data + 'T12:00:00-03:00');
  const componentes = new Date(data.getTime() - 3 * 3600000).toISOString().slice(0, 10);
  if (componentes !== input.data) throw new ErroNegocio('Data inexistente.', 'data');
  return { turmaId: input.turmaId, numero: input.numero, titulo, data };
}

export function validarChamada(alunosDaTurma: string[], marcacoes: { pessoaId: string; presente: boolean }[]) {
  const permitidos = new Set(alunosDaTurma);
  const vistos = new Set<string>();
  if (marcacoes.length !== alunosDaTurma.length)
    throw new ErroNegocio('A chamada deve contemplar todos os alunos matriculados.', 'incompleta');
  for (const m of marcacoes) {
    if (!UUID.test(m.pessoaId) || !permitidos.has(m.pessoaId) || vistos.has(m.pessoaId) || typeof m.presente !== 'boolean')
      throw new ErroNegocio('A chamada contém aluno inexistente, repetido ou marcação inválida.', 'chamada');
    vistos.add(m.pessoaId);
  }
  return marcacoes;
}

async function autorizado(tx: Parameters<Parameters<typeof comRls>[1]>[0], ctx: ContextoEstudos, turmaId: string) {
  const turma = await tx.turma.findUnique({
    where: { id: turmaId },
    select: { id: true, status: true, instrutorId: true },
  });
  if (!turma || turma.status === 'ENCERRADA') throw new ErroNegocio('Turma indisponível.', 'turma');
  const gestor = ['ADMINISTRADOR', 'DIRETORIA', 'COORDENADOR'].includes(ctx.perfil);
  if (!gestor && !(ctx.perfil === 'INSTRUTOR' && turma.instrutorId === ctx.pessoaId))
    throw new ErroNegocio('Sem permissão para fazer a chamada desta turma.', 'sem_permissao');
  return turma;
}

/** Lista aulas e alunos de uma turma; instrutor só acessa sua turma. */
export async function quadroPresencas(ctx: ContextoEstudos, turmaId: string) {
  if (!UUID.test(turmaId)) throw new ErroNegocio('Turma inválida.', 'turma');
  return comRls(ctx, async tx => {
    await autorizado(tx, ctx, turmaId);
    const [turma, aulas, matriculas] = await Promise.all([
      tx.turma.findUniqueOrThrow({ where: { id: turmaId }, select: { nome: true, curso: { select: { nome: true } } } }),
      tx.aula.findMany({ where: { turmaId }, orderBy: { numero: 'asc' },
        select: { id: true, numero: true, titulo: true, data: true, presencas: { select: { pessoaId: true, presente: true } } } }),
      tx.matricula.findMany({ where: { turmaId, status: { in: ['ATIVA','EM_RISCO'] } }, orderBy: { pessoa: { nome: 'asc' } },
        select: { pessoaId: true, pessoa: { select: { nome: true } } } }),
    ]);
    return { turma, aulas, alunos: matriculas.map(m => ({ id: m.pessoaId, nome: m.pessoa.nome })) };
  });
}

/** Cria uma aula real, sem gerar presenças ou alunos de exemplo. */
export async function criarAulaManual(
  ctx: ContextoEstudos, input: { turmaId: string; numero: number; titulo: string; data: string }, ip: string | null,
) {
  const d = validarNovaAula(input);
  return comRls(ctx, async tx => {
    await autorizado(tx, ctx, d.turmaId);
    const existente = await tx.aula.findUnique({ where: { turmaId_numero: { turmaId: d.turmaId, numero: d.numero } }, select: { id: true } });
    if (existente) throw new ErroNegocio('Já existe aula com este número nesta turma.', 'duplicada');
    const aula = await tx.aula.create({
      data: { turmaId: d.turmaId, numero: d.numero, titulo: d.titulo, data: new Date(d.data + 'T12:00:00-03:00') },
      select: { id: true },
    });
    await registrarAuditoria(tx, { usuarioId: ctx.usuarioId, acao: 'criou aula', entidade: 'Aula',
      entidadeId: aula.id, antes: null, depois: { turmaId: d.turmaId, numero: d.numero, data: d.data }, ip });
    return aula;
  });
}

/** A chamada é salva integralmente: marca presença ou falta de cada matriculado. */
export async function registrarChamadaManual(
  ctx: ContextoEstudos, aulaId: string,
  marcacoes: { pessoaId: string; presente: boolean }[], ip: string | null,
) {
  if (!UUID.test(aulaId)) throw new ErroNegocio('Aula inválida.', 'aula');
  return comRls(ctx, async tx => {
    const aula = await tx.aula.findUnique({ where: { id: aulaId }, select: { id: true, turmaId: true } });
    if (!aula) throw new ErroNegocio('Aula não encontrada.', 'aula');
    await autorizado(tx, ctx, aula.turmaId);
    const matriculas = await tx.matricula.findMany({
      where: { turmaId: aula.turmaId, status: { in: ['ATIVA','EM_RISCO'] } }, select: { pessoaId: true },
    });
    if (matriculas.length === 0) throw new ErroNegocio('Nenhum aluno matriculado nesta turma.', 'sem_alunos');
    const confirmadas = validarChamada(matriculas.map(m => m.pessoaId), marcacoes);
    const anteriores = await tx.presenca.findMany({ where: { aulaId }, select: { pessoaId: true, presente: true } });
    if (anteriores.length) throw new ErroNegocio('Chamada já registrada. Revisão de presença exige procedimento específico.', 'ja_registrada');
    for (const m of confirmadas) {
      await tx.presenca.create({ data: { aulaId, pessoaId: m.pessoaId, presente: m.presente } });
    }
    await registrarAuditoria(tx, { usuarioId: ctx.usuarioId, acao: 'registrou chamada da aula', entidade: 'Aula',
      entidadeId: aulaId, antes: { registrada: false },
      depois: { registrada: true, presentes: confirmadas.filter(m => m.presente).length, ausentes: confirmadas.filter(m => !m.presente).length }, ip });
    return { total: confirmadas.length, presentes: confirmadas.filter(m => m.presente).length };
  });
}
