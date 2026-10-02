'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn, LogoMark } from '@ceak/ui';
import { useCarrinho } from './Carrinho';

const NAV = [
  { label: 'O CEAK', href: '/o-ceak' },
  { label: 'Agenda', href: '/agenda' },
  { label: 'Palestras', href: '/palestras' },
  { label: 'Estudos', href: '/estudos' },
  { label: 'Biblioteca', href: '/biblioteca' },
  { label: 'Loja', href: '/loja' },
  { label: 'Quero ajudar', href: '/quero-ajudar' },
  { label: 'Preciso de ajuda', href: '/preciso-de-ajuda' },
];

const pilulaSecundaria =
  'rounded-pill border border-line-3 px-3.5 py-[9px] text-sm whitespace-nowrap text-ink no-underline hover:no-underline hover:border-green inline-flex items-center min-h-11';

/** Cabeçalho fixo. Abaixo de 980px o menu vira botão "Menu". */
export function Cabecalho({ appUrl }: { appUrl: string }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const { quantidadeTotal, pronto } = useCarrinho();

  useEffect(() => setAberto(false), [pathname]);

  return (
    <header className="border-line sticky top-0 z-20 border-b bg-[rgba(247,244,238,.95)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-5 px-6 py-3">
        <Link
          href="/"
          className="text-ink flex items-center gap-3 no-underline hover:no-underline"
          aria-label="Centro Espírita Allan Kardec — página inicial"
        >
          <LogoMark size={42} />
          <span className="leading-[1.15]">
            <span className="block font-serif text-lg font-semibold">
              Centro Espírita Allan Kardec
            </span>
            <span className="text-muted block text-[11px] tracking-[.1em]">
              PENÁPOLIS · DESDE 1962
            </span>
          </span>
        </Link>
        <nav
          id="menu-principal"
          aria-label="Principal"
          className={cn(
            'min-[980px]:flex min-[980px]:flex-[1_1_auto] min-[980px]:flex-row min-[980px]:flex-wrap min-[980px]:justify-center min-[980px]:gap-0.5',
            aberto ? 'order-10 flex w-full flex-col gap-0.5' : 'hidden',
          )}
        >
          {NAV.map((n) => {
            const ativo = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'rounded-pill text-ink inline-flex min-h-11 items-center px-3.5 py-[9px] text-sm font-medium whitespace-nowrap no-underline hover:no-underline',
                  ativo ? 'bg-green-soft' : 'hover:bg-green-soft/60',
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-principal"
            className={cn(pilulaSecundaria, 'bg-white min-[980px]:hidden')}
          >
            Menu
          </button>
          <Link href="/carrinho" className={pilulaSecundaria}>
            Carrinho · <span aria-live="polite">&nbsp;{pronto ? quantidadeTotal : 0}</span>
          </Link>
          <a
            href={appUrl}
            className="rounded-pill bg-green hover:bg-green-dark inline-flex min-h-11 items-center px-4 py-2.5 text-sm font-medium whitespace-nowrap text-white no-underline hover:text-white hover:no-underline"
          >
            Área do membro
          </a>
        </div>
      </div>
    </header>
  );
}
