'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { cadastrarVisitantePresencial, ErroNegocio } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

const esquema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.union([z.email(), z.literal('')]),
  whatsapp: z.string().max(25),
  cidade: z.string().max(100),
  consentimento: z.boolean(),
});

export interface EstadoNovoVisitante { erro?: string }

export async function salvarVisitante(
  _: EstadoNovoVisitante,
  form: FormData,
): Promise<EstadoNovoVisitante> {
  const s = await exigirModulo('pessoas');
  if (!['ADMINISTRADOR', 'SECRETARIA'].includes(s.perfil)) {
    return { erro: 'Seu perfil não possui permissão para este cadastro.' };
  }
  const result = esquema.safeParse({
    nome: form.get('nome'),
    email: form.get('email') || '',
    whatsapp: form.get('whatsapp') || '',
    cidade: form.get('cidade') || '',
    consentimento: form.get('consentimento') === 'on',
  });
  if (!result.success) return { erro: result.error.issues[0]?.message ?? 'Dados inválidos.' };
  const ctx = await contexto(s);
  let novoId: string;
  try {
    const pessoa = await cadastrarVisitantePresencial(ctx, result.data, ctx.ip);
    novoId = pessoa.id;
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
  redirect(`/pessoas/${novoId}`);
}
