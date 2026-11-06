'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isPerfil, PERFIS } from '@ceak/core/rbac';
import { atualizarUsuario, convidarUsuario, ErroNegocio, redefinir2fa } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { log } from '@/lib/log';
import { contexto, GESTAO_URL } from '@/lib/servidor';

const perfilGestao = z.enum(
  PERFIS.filter((p) => p !== 'MEMBRO' && p !== 'VISITANTE') as [string, ...string[]],
  {
    error: 'Escolha o perfil.',
  },
);

export async function salvarUsuario(
  id: string,
  _: { erro?: string },
  form: FormData,
): Promise<{ erro?: string }> {
  const s = await exigirModulo('config');
  const perfil = perfilGestao.safeParse(form.get('perfil'));
  if (!perfil.success || !isPerfil(perfil.data)) return { erro: 'Escolha o perfil.' };
  const extras = form.getAll('extras').filter(isPerfil);
  const ctx = await contexto(s);
  try {
    await atualizarUsuario(
      ctx,
      id,
      {
        perfil: perfil.data,
        perfisExtras: extras,
        ativo: form.get('ativo') === 'on',
        coordAssistencia: form.get('coordAssistencia') === 'on',
      },
      ctx,
      { log },
    );
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
  redirect('/config/usuarios?ok=1');
}

const convite = z.object({
  nome: z.string().trim().min(3, 'Informe o nome.').max(120),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  perfil: perfilGestao,
});

type EstadoConvite = {
  erro?: string;
  erros?: Record<string, string>;
  linkConvite?: string;
  emailConvidado?: string;
};

export async function convidar(_: EstadoConvite, form: FormData): Promise<EstadoConvite> {
  const s = await exigirModulo('config');
  if (s.perfil !== 'ADMINISTRADOR')
    return { erro: 'Somente administradores podem convidar usuários.' };
  const r = convite.safeParse(Object.fromEntries(form));
  if (!r.success) {
    const erros: Record<st...[truncated]