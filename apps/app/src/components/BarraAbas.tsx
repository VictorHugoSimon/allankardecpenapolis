'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ceak/ui';

const ABAS = [
  ['Início', '/'],
  ['Agenda', '/agenda'],
  ['Check-in', '/checkin'],
  ['Estudos', '/estudos'],
  ['Perfil', '/perfil'],
] as const;

/** Barra inferior: Início, Agenda, Check-in (destaque), Estudos e Perfil. */
export function BarraAbas() {
  const atual = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="border-line grid flex-none grid-cols-5 border-t bg-white px-1.5 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] min-[600px]:pb-[22px]"
    >
      {ABAS.map(([rotulo, href]) => {
        const ativo = href === '/' ? atual === '/' : atual.startsWith(href);
        const meio = href === '/checkin';
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? 'page' : undefined}
            className={cn(
              'flex min-h-12 flex-col items-center gap-[5px] py-1.5 no-underline hover:no-underline',
              ativo ? 'text-green hover:text-green' : 'text-muted-2 hover:text-ink',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'border-[1.5px] border-current',
                meio ? 'size-[22px] rounded-[7px]' : 'size-[18px] rounded-full',
                ativo ? 'bg-green' : 'bg-transparent',
              )}
            />
            <span className={cn('text-[11px]', ativo ? 'font-semibold' : 'font-medium')}>
              {rotulo}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
