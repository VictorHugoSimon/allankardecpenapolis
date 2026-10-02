import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { DetalheEvento } from '@/components/DetalheEvento';
import { eventoPorSlug } from '@/lib/dados';
import { metadataEvento } from '@/lib/metaEvento';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataEvento(await eventoPorSlug((await params).slug));
}

export default async function Page({ params }: Props) {
  const e = await eventoPorSlug((await params).slug);
  if (!e) notFound();
  // URL canônica: palestras em /palestras, demais atividades em /agenda.
  if (e.url !== `/palestras/${e.slug}`) permanentRedirect(e.url);
  return <DetalheEvento e={e} />;
}
