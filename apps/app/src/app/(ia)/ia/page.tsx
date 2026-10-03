import type { Metadata } from 'next';
import { CabecalhoTela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';
import { ChatIA } from './ChatIA';

export const metadata: Metadata = { title: 'CEAK IA' };
export const dynamic = 'force-dynamic';

export default async function IaPage() {
  await exigirSessao();
  return (
    <>
      <CabecalhoTela titulo="CEAK IA" />
      <ChatIA />
    </>
  );
}
