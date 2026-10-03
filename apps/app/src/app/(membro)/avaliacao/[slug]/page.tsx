import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eventoParaAvaliar } from '@ceak/db';
import { Tela } from '@/components/Tela';
import { diaMes } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';
import { FormAvaliacao } from './FormAvaliacao';

export const metadata: Metadata = { title: 'Avaliação' };
export const dynamic = 'force-dynamic';

export default async function AvaliacaoPage({ params }: { params: Promise<{ slug: string }> }) {
  await exigirSessao();
  const e = await eventoParaAvaliar((await params).slug);
  if (!e) notFound();
  const quem = e.palestrante?.nome ?? e.responsavel;
  return (
    <Tela titulo="Avaliação">
      <FormAvaliacao
        slug={e.slug}
        descricao={[e.titulo, quem, diaMes(e.inicio)].filter(Boolean).join(' · ')}
      />
    </Tela>
  );
}
