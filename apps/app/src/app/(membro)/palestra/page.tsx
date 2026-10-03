import { redirect } from 'next/navigation';
import { proximaPalestra } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';

export const dynamic = 'force-dynamic';

/** Atalho "Palestra": abre a palestra de hoje ou a próxima. */
export default async function PalestraAtalho() {
  await exigirSessao();
  const p = await proximaPalestra();
  redirect(p ? `/agenda/${p.slug}` : '/agenda');
}
