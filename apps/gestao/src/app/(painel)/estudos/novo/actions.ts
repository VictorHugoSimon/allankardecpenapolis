'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { criarCursoEstudo, criarTurmaEstudo, ErroNegocio } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

export interface EstadoEstudos {
  erro?: string;
  sucesso?: string;
}
const curso = z.object({
  nome: z.string().trim().min(3).max(140),
  sigla: z.string().trim().max(24),
  descricao: z.string().trim().max(2000),
});
const turma = z.object({
  cursoId: z.string().uuid(),
  nome: z.string().trim().min(2).max(100),
  encontros: z.string().trim().min(3).max(140),
});
async function gestor() {
  const sessao = await exigirModulo('estudos');
  return ['ADMINISTRADOR', 'DIRETORIA', 'COORDENADOR'].includes(sessao.perfil) ? sessao : null;
}
export async function salvarCurso(_: EstadoEstudos, form: FormData): Promise<EstadoEstudos> {
  const sessao = await gestor();
  if (!sessao) return { erro: 'Sem permissão para cadastrar cursos.' };
  const r = curso.safeParse({
    nome: form.get('nome'),
    sigla: form.get('sigla') ?? '',
    descricao: form.get('descricao') ?? '',
  });
  if (!r.success) return { erro: 'Informe os dados válidos do curso.' };
  const ctx = await contexto(sessao);
  try {
    await criarCursoEstudo(sessao.perfil, r.data, { usuarioId: sessao.usuarioId, ip: ctx.ip });
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
  revalidatePath('/estudos');
  revalidatePath('/estudos/novo');
  return { sucesso: 'Curso cadastrado como privado. Atualize a página para criar uma turma.' };
}
export async function salvarTurma(_: EstadoEstudos, form: FormData): Promise<EstadoEstudos> {
  const sessao = await gestor();
  if (!sessao) return { erro: 'Sem permissão para cadastrar turmas.' };
  const r = turma.safeParse({
    cursoId: form.get('cursoId'),
    nome: form.get('nome'),
    encontros: form.get('encontros'),
  });
  if (!r.success) return { erro: 'Informe curso, turma e encontros válidos.' };
  const ctx = await contexto(sessao);
  try {
    await criarTurmaEstudo(sessao.perfil, r.data, { usuarioId: sessao.usuarioId, ip: ctx.ip });
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
  revalidatePath('/estudos');
  revalidatePath('/estudos/novo');
  return { sucesso: 'Turma cadastrada sem alunos fictícios.' };
}
