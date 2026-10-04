'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isPerfil, PERFIS } from '@ceak/core/rbac';
import { atualizarUsuario, convidarUsuario, ErroNegocio, redefinir2fa } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { log } from '@/lib/log';
import { contexto, enviarEmail, GESTAO_URL } from '@/lib/servidor';

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

export async function convidar(
  _: { erro?: string; erros?: Record<string, string> },
  form: FormData,
): Promise<{ erro?: string; erros?: Record<string, string> }> {
  const s = await exigirModulo('config');
  const r = convite.safeParse(Object.fromEntries(form));
  if (!r.success) {
    const erros: Record<string, string> = {};
    for (const i of r.error.issues) erros[String(i.path[0])] ??= i.message;
    return { erros };
  }
  const ctx = await contexto(s);
  try {
    await convidarUsuario(
      ctx,
      { nome: r.data.nome, email: r.data.email, perfil: r.data.perfil as (typeof PERFIS)[number] },
      {
        enviarEmail,
        urlBase: GESTAO_URL,
        log,
        ip: ctx.ip,
      },
    );
  } catch (e) {
    if (e instanceof ErroNegocio) return { erros: { email: e.message } };
    throw e;
  }
  redirect('/config/usuarios?ok=convite');
}

/** Celular perdido: o autenticador é apagado e a pessoa configura de novo no próximo login. */
export async function redefinirAutenticador(id: string): Promise<void> {
  const s = await exigirModulo('config');
  const ctx = await contexto(s);
  await redefinir2fa(s.usuarioId, id, ctx.ip);
  log.info('SEGURANCA', 'autenticador (2FA) redefinido', {
    rota: '/config/usuarios',
    status: 200,
    usuario: s.nome,
  });
  redirect('/config/usuarios?ok=2fa');
}
