import { type ReactNode } from 'react';
import { SuccessMark } from '@ceak/ui';

/** Confirmação com o círculo animado (ceakPop), como nos protótipos do site. */
export function Sucesso({
  titulo,
  children,
  rotulo,
}: {
  titulo: string;
  children?: ReactNode;
  rotulo?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3.5 pt-5 text-center">
      <SuccessMark size={76} ring={false} label={rotulo ?? titulo} />
      <h1
        className="mt-1.5 mb-0 font-serif text-[clamp(34px,5vw,42px)] font-medium"
        tabIndex={-1}
        data-foco-sucesso
      >
        {titulo}
      </h1>
      {children}
    </div>
  );
}
