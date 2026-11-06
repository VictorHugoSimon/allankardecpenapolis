import { randomUUID } from 'node:crypto';
import { registrarAuditoria } from '../../auditoria';
import { prisma } from '../../client';
import { ErroNegocio } from '../inscricoes';

export interface NovoCursoEstudo {
  nome: string;
  sigla?: string;
  descricao?: string;
}

export interface NovaTurmaEstudo {
  cursoId: string;
  nome: string;
  encontros: string;
}

const perfisGestores = ['ADMINISTRADOR', 'DIRETORIA', 'COORDENADOR'] as const;

export function validarNovoCurso(d: NovoCursoEstudo): NovoCursoEstudo {
  const nome = d.nome.trim().replace(/\s+/g, ' ');
  const sigla = d.sigla?.trim().replace(/\s+/g, ' ') || undefined;
  const descricao = d.descricao?.trim() || undefined;
  if (nome.length < 3 || nome.length > 140)
    throw new ErroNegocio('Informe o nome do curso com 3 a 140 caracteres.', 'nome');
  if (sigla && sigla.length > 24)
    throw new ErroNegocio('A sigla deve ter até 24 caracteres.', 'sigla');
  if (descricao && descricao.length > 2000)
    throw new ErroNegocio('A descrição deve ter até 2.000 caracteres.', 'descricao');
  return { nome, sigla, descricao };
}

export function validarNovaTurma(d: NovaTurmaEstudo): NovaTurmaEstudo {
  const nome = d.nome.trim().replace(/\s+/g, ' ');
  const encontros = d.encontros.trim().replace(/\s+/g, ' ');
  if (!/^[0-9a-f-]{36}$/i.test(d.cursoId)) throw new ErroNegocio('Curso inválido.', 'curso');
  if (nome.length < 2 || nome.length > 100)
    throw new ErroNegocio('Informe o nome da turma com 2 a 100 caracteres.', 'nome');
  if (encontros.length < 3 || encontros.length > 140)
    throw new ErroNegocio('Informe dias e horários reais dos encontros.', 'encontros');
  return { cursoId: d.cursoId, nome, encontros };
}

function garantirGestor(perfil: string) {
  if (!(perfisGestores as readonly string[]).includes(perfil))
    throw new ErroNegocio('Seu perfil não pode cadastrar cursos ou turmas.', 'sem_permissao');
}

/** Lista também cursos sem turmas; nenhum curso fictício é criado. */
export async function cursosParaGestao() {
  return prisma.curso.findMany({
    orderBy: [{ nome: 'asc' }],
    select: {
      id: true,
      nome: true,
      sigla: true,
      ativo: true,
      _count: { select: { turmas: true } },
    },
  });
}

export async function criarCursoEstudo(
  perfil: string,
  dados: NovoCursoEstudo,
  autor: { usuarioId: string; ip: string | null },
) {
  garantirGestor(perfil);
  const d = validarNovoCurso(dados);
  const slug = `curso-${randomUUID()}`;
  return prisma.$transaction(async (tx) => {
    const curso = await tx.curso.create({
      data: {
        nome: d.nome,
        sigla: d.sigla,
        descricao: d.descricao,
        slug,
        ativo: false,
        destaque: false,
        statusInscricao: 'Fechada',
      },
      select: { id: true, nome: true, ativo: true },
    });
    await registrarAuditoria(tx, {
      usuarioId: autor.usuarioId,
      acao: 'cadastrou curso de estudos',
      entidade: 'Curso',
      entidadeId: curso.id,
      antes: null,
      depois: { nome: curso.nome, ativo: false },
      ip: autor.ip,
    });
    return curso;
  });
}

export async function criarTurmaEstudo(
  perfil: string,
  dados: NovaTurmaEstudo,
  autor: { usuarioId: string; ip: string | null },
) {
  garantirGestor(perfil);
  const d = validarNovaTurma(dados);
  return prisma.$transaction(async (tx) => {
    const curso = await tx.curso.findUnique({
      where: { id: d.cursoId },
      select: { id: true },
    });
    if (!curso) throw new ErroNegocio('Curso não encontrado.', 'curso');
    const existente = await tx.turma.findFirst({
      where: { cursoId: d.cursoId, nome: d.nome },
      select: { id: true },
    });
    if (existente)
      throw new ErroNegocio('Já existe uma turma com este nome neste curso.', 'duplicada');
    const turma = await tx.turma.create({
      data: { cursoId: d.cursoId, nome: d.nome, encontros: d.encontros, status: 'ATIVA' },
      select: { id: true, nome: true, cursoId: true },
    });
    await registrarAuditoria(tx, {
      usuarioId: autor.usuarioId,
      acao: 'cadastrou turma de estudos',
      entidade: 'Turma',
      entidadeId: turma.id,
      antes: null,
      depois: { nome: turma.nome, cursoId: turma.cursoId },
      ip: autor.ip,
    });
    return turma;
  });
}
