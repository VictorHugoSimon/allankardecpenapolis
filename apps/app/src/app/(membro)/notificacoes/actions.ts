'use server';

import { marcarNotificacoesLidas } from '@ceak/db';
import { exigirSessao } from '@/lib/servidor';

export async function marcarLidas(): Promise<void> {
  const s = await exigirSessao();
  await marcarNotificacoesLidas(s.pessoaId);
}
