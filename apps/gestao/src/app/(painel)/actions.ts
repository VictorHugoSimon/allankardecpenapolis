'use server';

import { redirect } from 'next/navigation';
import { isPerfil, PERFIL_LABEL } from '@ceak/core/rbac';
import { prisma, registrarAuditoria } from '@ceak/db';
import {
  apagarCookieSessao,
  exigirSessao,
  getSessao,
  gravarCookieSessao,
  ipDaRequisicao,
} from '@/lib/auth';
import { log } from '@/lib/log';

export async function sair(): Promise<void> {
  const s = await getSessao();
  await apagarCookieSessao();
  if (s)
    log.info('SEGURANCA', `logout · ${s.email}`, { rota: '/sair', status: 200, usuario: s.nome });
  redirect('/login');
}

/**
 * Seletor de perfil (só para quem tem duas ou mais funções). O perfil escolhido
 * precisa constar no cadastro do usuário, conferido no banco a cada troca.
 */
export async function trocarPerfil(form: FormData): Promise<void> {
  const s = await exigirSessao();
  const novo = form.get('perfil');
  if (!isPerfil(novo) || novo === s.perfil) redirect('/');
  const u = await prisma.usuario.findUnique({
    where: { id: s.usuarioId },
    select: { perfil: true, perfisExtras: true, ativo: true },
  });
  const perfis = u ? [u.perfil, ...u.perfisExtras] : [];
  if (!u?.ativo || !perfis.includes(novo)) {
    log.warn('SEGURANCA', `troca de perfil negada · ${novo}`, {
      rota: '/perfil',
      status: 403,
      usuario: s.nome,
    });
    redirect('/sem-acesso');
  }
  const ip = await ipDaRequisicao();
  await prisma.$transaction((tx) =>
    registrarAuditoria(tx, {
      usuarioId: s.usuarioId,
      acao: 'trocou o perfil de acesso ativo',
      entidade: 'Usuario',
      entidadeId: s.usuarioId,
      antes: { perfil: s.perfil },
      depois: { perfil: novo },
      ip,
    }),
  );
  await gravarCookieSessao({ ...s, perfil: novo, perfis });
  log.info('SEGURANCA', `perfil ativo: ${PERFIL_LABEL[novo]}`, {
    rota: '/perfil',
    status: 200,
    usuario: s.nome,
  });
  redirect('/');
}
