'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cadastrarAreaVoluntariado, vincularVoluntarioArea, escalarVoluntario, ErroNegocio } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

export interface EstadoVoluntariado { erro?: string; sucesso?: string }
const areaSchema = z.object({
  nome: z.string().trim().min(3).max(100),
  descricao: z.string().trim().max(500),
  necessidade: z.coerce.number().int().min(0).max(500),
});
const vinculoSchema = z.object({
  pessoaId: z.string().uuid(),
  areaId: z.string().uuid(),
  autorizado: z.literal(true),
});
const escalaSchema = z.object({
  areaId: z.string().uuid(), voluntarioId: z.string().uuid(),
  inicio: z.string().min(16).max(19), fim: z.string().min(16).max(19),
  funcao: z.string().trim().max(100),
});
async function gestor() {
  const s = await exigirModulo('voluntariado');
  if (!['ADMINISTRADOR','DIRETORIA','COORDENADOR'].includes(s.perfil)) return null;
  return { s, ctx: await contexto(s) };
}
export async function salvarArea(_: EstadoVoluntariado, form: FormData): Promise<EstadoVoluntariado> {
  const gestorAtual = await gestor();
  if (!gestorAtual) return { erro: 'Sem permissão para cadastrar áreas.' };
  const r = areaSchema.safeParse(Object.fromEntries(form));
  if (!r.success) return { erro: 'Informe nome, descrição e necessidade válidos.' };
  try {
    await cadastrarAreaVoluntariado(gestorAtual.ctx,r.data,gestorAtual.ctx.ip);
  } catch(e) { if(e instanceof ErroNegocio) return {erro:e.message}; throw e; }
  revalidatePath('/voluntariado');
  return { sucesso:'Área cadastrada. Atualize a página para vincular pessoas.' };
}
export async function salvarVinculo(_: EstadoVoluntariado, form: FormData): Promise<EstadoVoluntariado> {
  const gestorAtual = await gestor();
  if (!gestorAtual) return { erro: 'Sem permissão para vincular voluntários.' };
  const r = vinculoSchema.safeParse({
    pessoaId: form.get('pessoaId'), areaId: form.get('areaId'),
    autorizado: form.get('autorizado') === 'on',
  });
  if (!r.success) return { erro: 'Selecione pessoa e área e confirme a autorização.' };
  try {
    await vincularVoluntarioArea(gestorAtual.ctx,r.data,gestorAtual.ctx.ip);
  } catch(e) { if(e instanceof ErroNegocio) return {erro:e.message}; throw e; }
  revalidatePath('/voluntariado');
  return { sucesso:'Pessoa vinculada. Atualize para organizar a escala.' };
}
export async function salvarEscala(_: EstadoVoluntariado, form: FormData): Promise<EstadoVoluntariado> {
  const gestorAtual = await gestor();
  if (!gestorAtual) return { erro: 'Sem permissão para criar escalas.' };
  const r = escalaSchema.safeParse(Object.fromEntries(form));
  if (!r.success) return { erro: 'Preencha a área, o voluntário e os horários.' };
  // datetime-local é horário civil de Penápolis, não do navegador do servidor.
  const inicio = new Date(r.data.inicio + ':00-03:00');
  const fim = new Date(r.data.fim + ':00-03:00');
  try {
    await escalarVoluntario(gestorAtual.ctx, {
      areaId: r.data.areaId, voluntarioId: r.data.voluntarioId,
      inicio, fim, funcao: r.data.funcao,
    }, gestorAtual.ctx.ip);
  } catch(e) { if(e instanceof ErroNegocio) return {erro:e.message}; throw e; }
  revalidatePath('/voluntariado');
  return { sucesso:'Escala cadastrada com auditoria.' };
}
