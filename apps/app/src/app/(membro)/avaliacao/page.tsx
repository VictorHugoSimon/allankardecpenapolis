import { redirect } from 'next/navigation';
import { avaliacaoPendente } from '@ceak/db';
import { palestraAnterior } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';

export const dynamic = 'force-dynamic';

/** Atalho "Avaliação": a avaliação pendente ou, sem ela, a última palestra. */
export default async function AvaliacaoAtalho() {
  const s = await exigirSessao();
  const agora = new Date();
  const pendente = await avaliacaoPendente(s.pessoaId, agora);
  const alvo = pendente ?? (await palestraAnterior(new Date(agora.getTime() + 86_400_000)));
  redirect(alvo ? `/avaliacao/${alvo.slug}` : '/agenda');
}
