import type { Metadata } from 'next';
import { exigirSessao } from '@/lib/auth';
import { Showcase } from './Showcase';

export const metadata: Metadata = { title: 'Componentes' };

export default async function UiPage() {
  await exigirSessao();
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="text-muted-2 text-[13px]">Sistema de design</div>
        <h1 className="mt-1 mb-0 font-serif text-[34px] font-medium">Componentes CEAK</h1>
        <p className="text-muted mt-2 mb-0 max-w-[640px] text-[15px] leading-[1.6]">
          Tokens e componentes compartilhados por Site, App e Gestão (pacote{' '}
          <code className="font-mono">@ceak/ui</code>).
        </p>
      </div>
      <Showcase />
    </div>
  );
}
