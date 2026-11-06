import { type ReactNode } from 'react';

/**
 * Interface real do CEAK App em qualquer dispositivo.
 * Não exibe o antigo painel demonstrativo de jornadas e links de outras plataformas.
 * O middleware direciona visitantes para /entrar e membros autenticados para a home.
 */
export function Moldura({ children }: { children: ReactNode }) {
  return (
    <div className="bg-beige flex min-h-dvh items-stretch justify-center min-[600px]:px-6 min-[600px]:py-6">
      <div className="bg-bg min-h-dvh w-full min-[600px]:min-h-[calc(100dvh-48px)] min-[600px]:max-w-[480px] min-[600px]:overflow-hidden min-[600px]:rounded-[24px] min-[600px]:shadow-app flex flex-col">
        {children}
      </div>
    </div>
  );
}
