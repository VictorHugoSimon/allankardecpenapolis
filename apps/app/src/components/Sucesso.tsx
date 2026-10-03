import { type ReactNode } from 'react';
import Link from 'next/link';
import { SuccessMark } from '@ceak/ui';
import { botaoCompacto } from '@/lib/estilos';

/** Confirmação com o círculo animado (ceakPop + ceakRing), como no protótipo do App. */
export function Sucesso({
  titulo,
  children,
  acao = { href: '/', texto: 'Voltar ao início' },
}: {
  titulo: string;
  children?: ReactNode;
  acao?: { href: string; texto: string } | null;
}) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 text-center">
      <SuccessMark size={96} label={titulo} />
      <h2 className="m-0 mt-2 font-serif text-[28px] font-normal" tabIndex={-1} data-foco-sucesso>
        {titulo}
      </h2>
      {children}
      {acao ? (
        <Link href={acao.href} className={`${botaoCompacto} mt-2.5`}>
          {acao.texto}
        </Link>
      ) : null}
    </div>
  );
}
