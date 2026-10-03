import { type ReactNode } from 'react';
import { cn } from '@ceak/ui';
import { BotaoVoltar } from './BotaoVoltar';

/**
 * Tela do App: cabeçalho opcional (voltar + título) e área rolável.
 * `voltar` é o destino quando não há histórico (link aberto direto).
 */
export function Tela({
  titulo,
  voltar = '/',
  children,
  className,
}: {
  titulo?: string;
  voltar?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      {titulo ? <CabecalhoTela titulo={titulo} voltar={voltar} /> : null}
      <main
        id="conteudo"
        tabIndex={0}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto px-[18px] pb-6 focus-visible:outline-offset-[-2px]',
          className,
        )}
      >
        {children}
      </main>
    </>
  );
}

export function CabecalhoTela({ titulo, voltar = '/' }: { titulo: string; voltar?: string }) {
  return (
    <header className="flex flex-none items-center gap-2 px-3.5 pt-1.5 pb-2.5">
      <BotaoVoltar destino={voltar} />
      <h1 className="m-0 text-[17px] font-semibold">{titulo}</h1>
    </header>
  );
}
