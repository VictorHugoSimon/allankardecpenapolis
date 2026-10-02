'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { cn, LogoMark } from '@ceak/ui';

export interface MenuGrupo {
  grupo: string;
  itens: { id: string; label: string; href: string }[];
}

interface ShellProps {
  menu: MenuGrupo[];
  usuario: { nome: string; iniciais: string; perfil: string };
  acaoSair: () => Promise<void>;
  children: ReactNode;
}

const NARROW = '(max-width: 899px)';

function ativo(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Estrutura do Gestão: sidebar bege (240px) que vira gaveta abaixo de 900px. */
export function Shell({ menu, usuario, acaoSair, children }: ShellProps) {
  const pathname = usePathname();
  const [narrow, setNarrow] = useState(false);
  const [aberta, setAberta] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const sync = () => {
      setNarrow(mq.matches);
      setAberta(!mq.matches);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (narrow) setAberta(false);
  }, [pathname, narrow]);

  useEffect(() => {
    if (!(narrow && aberta)) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAberta(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [narrow, aberta]);

  return (
    <div className="flex min-h-screen">
      <a
        href="#conteudo"
        className="bg-green sr-only z-50 rounded-lg px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      {narrow && aberta ? (
        <div
          aria-hidden="true"
          onClick={() => setAberta(false)}
          className="fixed inset-0 z-[39] bg-[rgba(31,42,36,.35)]"
        />
      ) : null}
      {aberta ? (
        <aside
          id="sidebar"
          aria-label="Menu principal"
          className={cn(
            'bg-beige border-line-admin top-0 left-0 z-40 flex h-screen w-60 flex-[0_0_240px] flex-col gap-3.5 overflow-y-auto border-r px-3 py-[18px]',
            narrow ? 'shadow-drawer fixed' : 'sticky',
          )}
        >
          <div className="flex items-center gap-2.5 px-2 pt-1 pb-2">
            <LogoMark size={34} />
            <div className="leading-[1.15]">
              <div className="text-sm font-semibold">CEAK Gestão</div>
              <div className="text-muted-2 text-[11px]">Command Center</div>
            </div>
          </div>
          <nav className="flex flex-col gap-3.5">
            {menu.map((g) => (
              <div key={g.grupo || 'geral'} className="flex flex-col gap-px">
                {g.grupo ? (
                  <div className="text-muted-2 px-2.5 pb-1 text-[10px] font-semibold tracking-[.12em]">
                    {g.grupo}
                  </div>
                ) : null}
                {g.itens.map((m) => {
                  const on = ativo(pathname, m.href);
                  return (
                    <Link
                      key={m.id}
                      href={m.href}
                      aria-current={on ? 'page' : undefined}
                      className={cn(
                        'flex min-h-9 items-center rounded-lg px-2.5 py-2 text-sm no-underline hover:no-underline',
                        on
                          ? 'text-green-dark bg-white font-semibold'
                          : 'text-ink font-normal hover:bg-white/60',
                      )}
                    >
                      {m.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-[1_1_0] flex-col">
        <header className="border-line sticky top-0 z-10 flex flex-wrap items-center gap-2.5 border-b bg-[rgba(247,244,238,.96)] px-4 py-2.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setAberta((v) => !v)}
            aria-expanded={aberta}
            aria-controls="sidebar"
            className="border-line-admin text-ink min-h-11 rounded-lg border bg-white px-3 text-[13px]"
          >
            Menu
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="bg-green-soft text-green flex size-[34px] items-center justify-center rounded-full text-[13px] font-semibold"
            >
              {usuario.iniciais}
            </span>
            <div className="leading-[1.1]">
              <div className="text-[13px] font-semibold">{usuario.nome}</div>
              <div className="text-muted-2 text-[11px]">{usuario.perfil}</div>
            </div>
          </div>
          <form action={acaoSair}>
            <button
              type="submit"
              className="border-line-admin text-ink min-h-11 rounded-lg border bg-white px-3 text-[13px]"
            >
              Sair
            </button>
          </form>
        </header>
        <main
          id="conteudo"
          className="w-full max-w-[1360px] px-3.5 pt-5 pb-14 min-[900px]:px-6 min-[900px]:pt-7 min-[900px]:pb-16"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
