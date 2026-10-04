'use server';

import { redirect } from 'next/navigation';
import {
  confirmarConfiguracao2fa,
  ErroNegocio,
  totpAtivadoEm,
  verificarSegundoFator,
} from '@ceak/db';
import { gravarCookieSessao, ipDaRequisicao } from '@/lib/auth';
import { apagarPendente, lembrarNavegador, lerPendente } from '@/lib/doisFatores';
import { authSecret } from '@/lib/env';
import { log } from '@/lib/log';

export interface Estado2fa {
  erro?: string;
  codigos?: string[];
}

export async function verificar(_: Estado2fa, form: FormData): Promise<Estado2fa> {
  const p = await lerPendente();
  if (!p || p.etapa !== 'verificar') redirect('/login');
  const codigo = String(form.get('codigo') ?? '')
    .trim()
    .slice(0, 20);
  if (!codigo) return { erro: 'Informe o código.' };
  const ip = await ipDaRequisicao();
  const r = await verificarSegundoFator(p.sessao.usuarioId, codigo, authSecret(), ip);
  if (!r.ok) {
    log.warn(
      'SEGURANCA',
      `2fa ${r.motivo === 'bloqueado' ? 'bloqueado' : 'código inválido'} · ${p.sessao.email}`,
      {
        rota: '/login/verificar',
        status: r.motivo === 'bloqueado' ? 429 : 401,
        usuario: ip ?? undefined,
      },
    );
    return {
      erro:
        r.motivo === 'bloqueado'
          ? 'Muitas tentativas. Tente novamente em 15 minutos.'
          : 'Código incorreto ou já usado. Use o código atual do aplicativo.',
    };
  }
  if (form.get('lembrar') === 'on') {
    const ativ = await totpAtivadoEm(p.sessao.usuarioId);
    if (ativ) await lembrarNavegador(p.sessao.usuarioId, ativ);
  }
  await gravarCookieSessao(p.sessao);
  await apagarPendente();
  log.info(
    'SEGURANCA',
    `login · ${p.sessao.email} (${p.sessao.perfil}) · 2FA${r.recuperacao ? ' por código de recuperação' : ''}`,
    {
      rota: '/login/verificar',
      status: 200,
      usuario: p.sessao.nome,
    },
  );
  redirect(p.next);
}

export async function confirmar(_: Estado2fa, form: FormData): Promise<Estado2fa> {
  const p = await lerPendente();
  if (!p || p.etapa !== 'configurar') redirect('/login');
  try {
    const codigos = await confirmarConfiguracao2fa(
      p.sessao.usuarioId,
      String(form.get('codigo') ?? ''),
      authSecret(),
      await ipDaRequisicao(),
    );
    log.info('SEGURANCA', `2fa ativado · ${p.sessao.email}`, {
      rota: '/login/configurar',
      status: 201,
      usuario: p.sessao.nome,
    });
    return { codigos };
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
}

/** Depois de guardar os códigos de recuperação: abre a sessão. */
export async function concluir(): Promise<void> {
  const p = await lerPendente();
  if (!p || p.etapa !== 'configurar') redirect('/login');
  // Só conclui se o autenticador foi ativado durante esta configuração.
  const ativ = await totpAtivadoEm(p.sessao.usuarioId);
  if (!ativ || ativ.getTime() < p.iniciadoEm) redirect('/login/configurar');
  await gravarCookieSessao(p.sessao);
  await apagarPendente();
  log.info('SEGURANCA', `login · ${p.sessao.email} (${p.sessao.perfil}) · 2FA configurado`, {
    rota: '/login/configurar',
    status: 200,
    usuario: p.sessao.nome,
  });
  redirect(p.next);
}

export async function cancelar(): Promise<void> {
  await apagarPendente();
  redirect('/login');
}
