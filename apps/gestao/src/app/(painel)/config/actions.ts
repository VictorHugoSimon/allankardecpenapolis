'use server';

import { revalidatePath } from 'next/cache';
import {
  CAMPOS_INSTITUCIONAIS, ErroNegocio, salvarDadosInstitucionais, type DadosInstitucionais,
} from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

export type EstadoInstitucional = { erro?: string; sucesso?: string };

export async function salvarInstituicao(
  _: EstadoInstitucional, form: FormData,
): Promise<EstadoInstitucional> {
  const sessao = await exigirModulo('config');
  if (sessao.perfil !== 'ADMINISTRADOR') return { erro: 'Somente administradores podem editar.' };
  const ctx = await contexto(sessao);
  const dados = Object.fromEntries(
    CAMPOS_INSTITUCIONAIS.map(k => [k, String(form.get(k) ?? '')]),
  ) as DadosInstitucionais;
  try {
    await salvarDadosInstitucionais(ctx, dados);
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
  revalidatePath('/config');
  revalidatePath('/contato');
  return { sucesso: 'Informações salvas com auditoria. O Site já pode exibir os dados confirmados.' };
}
