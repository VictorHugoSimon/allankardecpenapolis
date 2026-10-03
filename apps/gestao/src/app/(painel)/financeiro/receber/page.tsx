import type { Metadata } from 'next';
import { Contas } from '../Contas';

export const metadata: Metadata = { title: 'Contas a receber' };
export const dynamic = 'force-dynamic';

export default async function ReceberPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  return <Contas tipo="RECEBER" mes={(await searchParams).mes} />;
}
