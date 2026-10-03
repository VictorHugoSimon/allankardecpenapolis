'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ceak/ui';

const ABAS = [
  ['Dashboard', '/financeiro'],
  ['Contas a pagar', '/financeiro/pagar'],
  ['Contas a receber', '/financeiro/receber'],
] as const;

export function AbasFinanceiro() {
  const atual = usePathname();
  return (
    <nav
      aria-label="Seções do financeiro"
      className="border-line flex gap-1 overflow-x-auto border-b"
    >
      {ABAS.map(([rotulo, href]) => {
        const on = href === '/financeiro' ? atual === href : atual.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? 'page' : undefined}
            className={cn(
              'flex min-h-11 flex-none items-center border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap no-underline hover:no-underline',
              on
                ? 'border-green text-green-dark hover:text-green-dark'
                : 'text-muted-2 hover:text-ink border-transparent',
            )}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
