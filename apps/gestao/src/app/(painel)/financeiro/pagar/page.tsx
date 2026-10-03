import type { Metadata } from 'next';
import { Contas } from '../Contas';

export const metadata: Metadata = { title: 'Contas a pagar' };
export const dynamic = 'force-dynamic';

export default async function PagarPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  return <Contas tipo="PAGAR" mes={(await searchParams).mes} />;
}
