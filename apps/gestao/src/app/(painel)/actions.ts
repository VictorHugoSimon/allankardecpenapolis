'use server';

import { redirect } from 'next/navigation';
import { apagarCookieSessao, getSessao } from '@/lib/auth';
import { log } from '@/lib/log';

export async function sair(): Promise<void> {
  const s = await getSessao();
  await apagarCookieSessao();
  if (s)
    log.info('SEGURANCA', `logout · ${s.email}`, { rota: '/sair', status: 200, usuario: s.nome });
  redirect('/login');
}
