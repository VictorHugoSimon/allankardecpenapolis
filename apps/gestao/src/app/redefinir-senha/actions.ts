'use server';

import { senhaForte } from '@ceak/core/validacao';
import { redefinirSenha } from '@ceak/db';
import { ipDaRequisicao } from '@/lib/auth';
import { log } from '@/lib/log';

export interface EstadoRedefinir {
  ok?: boolean;
  erro?: string;
}

export async function definirSenha(_: EstadoRedefinir, form: FormData): Promise<EstadoRedefinir> {
  const senha = String(form.get('senha') ?? '');
  if (senha !== String(form.get('confirmacao') ?? '')) return { erro: 'As senhas não conferem.' };
  const r = senhaForte.safeParse(senha);
  if (!r.success) return { erro: r.error.issues[0]!.message };
  const ok = await redefinirSenha(
    String(form.get('email') ?? ''),
    String(form.get('token') ?? ''),
    senha,
    await ipDaRequisicao(),
  );
  log[ok ? 'info' : 'warn'](
    'SEGURANCA',
    ok ? 'senha definida por link' : 'link de senha inválido ou expirado',
    {
      rota: '/redefinir-senha',
      status: ok ? 200 : 400,
    },
  );
  return ok
    ? { ok: true }
    : { erro: 'Link inválido ou expirado. Peça um novo em “Recuperar senha”.' };
}
