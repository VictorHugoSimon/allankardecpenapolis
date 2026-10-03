'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn, LogoMark } from '@ceak/ui';

export interface MenuGrupo {
  grupo: string;
  itens: { id: string; label: string; href: string; badge?: number }[];
}

export interface AlertaShell {
  titulo: string;
  detalhe: string;
  tom: 'err' | 'warn' | 'ok';
  href: string;
}

interface ShellProps {
  menu: MenuGrupo[];
  usuario: { nome: string; iniciais: string; perfil: string };
  /** Funções do usuário (o seletor só aparece com duas ou mais). */
  perfis: { valor: string; rotulo: string }[];
  perfilAtivo: string;
  alertas: AlertaShell[];
  acaoSair: () => Promise<void>;
  acaoTrocarPerfil: (form: FormData) => Promise<void>;
  children: ReactNode;
}

const COR_ALERTA = { err: 'bg-danger', warn: 'bg-ochre', ok: 'bg-green' } as const;

function Alertas({ alertas }: { alertas: AlertaShell[] }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    window.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      window.removeEventListener('keydown', esc);
    };
  }, [aberto]);
  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="central-alertas"
        aria-label={`Alertas: ${alertas.length}`}
        className="border-line-admin text-ink min-h-11 rounded-lg border bg-white px-3 text-[13px]"
      >
        Alertas{' '}
        {alertas.length ? (
          <span
            aria-hidden="true"
            className="bg-danger ml-1 rounded-full px-1.5 py-px text-[11px] text-white"
          >
            {alertas.length}
          </span>
        ) : null}
      </button>
      {aberto ? (
        <div
          id="central-alertas"
          className="border-line-admin shadow-dropdown absolute top-[calc(100%+8px)] right-0 z-30 w-[340px] max-w-[calc(100vw-32px)] rounded-[14px] border bg-white p-2"
        >
          <p className="text-muted-2 m-0 px-2.5 py-2 text-xs font-semibold">Central de alertas</p>
          {alertas.length ? (
            <ul className="m-0 list-none p-0">
              {alertas.map((a) => (
                <li key={a.titulo + a.detalhe}>
                  <Link
                    href={a.href}
                    onClick={() => setAberto(false)}
                    className="text-ink hover:bg-bg hover:text-ink flex gap-2.5 rounded-[10px] p-2.5 no-underline hover:no-underline"
                  >
                    <span
                      aria-hidden="true"
                      className={cn('mt-1.5 size-2 flex-none rounded-full', COR_ALERTA[a.tom])}
                    />
                    <span>
                      <span className="block text-sm font-medium">{a.titulo}</span>
                      <span className="text-muted-2 block text-[13px]">{a.detalhe}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-2 m-0 px-2.5 pb-2 text-sm">Nenhum alerta no momento.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

const NARROW = '(max-width: 899px)';

function ativo(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Estrutura do Gestão: sidebar bege (240px) que vira gaveta abaixo de 900px. */
export function Shell({
  menu,
  usuario,
  perfis,
  perfilAtivo,
  alertas,
  acaoSair,
  acaoTrocarPerfil,
  children,
}: ShellProps) {
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
                        'flex min-h-9 items-center gap-2 rounded-lg px-2.5 py-2 text-sm no-underline hover:no-underline',
                        on
                          ? 'text-green-dark bg-white font-semibold'
                          : 'text-ink font-normal hover:bg-white/60',
                      )}
                    >
                      <span className="flex-1">{m.label}</span>
                      {m.badge ? (
                        <span className="rounded-pill text-pill-warn-fg bg-white px-[7px] py-px text-[11px]">
                          {m.badge}
                          <span className="sr-only">
                            {m.badge === 1 ? ' pendente' : ' pendentes'}
                          </span>
                        </span>
                      ) : null}
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
          <form
            role="search"
            action="/busca"
            className="min-w-[180px] flex-1 basis-[180px] min-[900px]:max-w-[420px]"
          >
            <label htmlFor="busca-global" className="sr-only">
              Buscar
            </label>
            <input
              id="busca-global"
              name="q"
              type="search"
              placeholder="Buscar pessoas, eventos, lançamentos…"
              className="border-line-admin placeholder:text-muted-2 min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </form>
          <div className="hidden flex-1 min-[900px]:block" />
          {perfis.length >= 2 ? (
            <form action={acaoTrocarPerfil} className="flex items-center gap-2">
              <label htmlFor="perfil-ativo" className="text-muted-2 text-xs">
                Perfil de acesso
              </label>
              <select
                id="perfil-ativo"
                name="perfil"
                defaultValue={perfilAtivo}
                className="border-line-admin text-ink min-h-11 rounded-lg border bg-white px-2 text-sm"
              >
                {perfis.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.rotulo}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="border-line-admin text-ink min-h-11 rounded-lg border bg-white px-3 text-[13px]"
              >
                Trocar
              </button>
            </form>
          ) : null}
          <Alertas alertas={alertas} />
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
