import Link from 'next/link';
import { type ReactNode } from 'react';
import { cn } from '@ceak/ui';

/** Seção com a largura máxima do site (1240px) e respiro padrão. */
export function Secao({
  children,
  className,
  estreita,
  ...props
}: {
  children: ReactNode;
  className?: string;
  estreita?: 640 | 760 | 800 | 1040;
} & React.HTMLAttributes<HTMLElement>) {
  const larg = {
    640: 'max-w-[640px]',
    760: 'max-w-[760px]',
    800: 'max-w-[800px]',
    1040: 'max-w-[1040px]',
  } as const;
  return (
    <section
      className={cn('mx-auto px-6', estreita ? larg[estreita] : 'max-w-[1240px]', className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function TituloPagina({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        'm-0 mb-2.5 font-serif text-[clamp(36px,5vw,52px)] leading-[1.08] font-medium text-balance',
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function Subtitulo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-muted m-0 mb-8 max-w-[680px] text-[17px] leading-[1.6]', className)}>
      {children}
    </p>
  );
}

/** Título de seção com link à direita ("Ver agenda completa →"). */
export function CabecalhoSecao({
  titulo,
  id,
  link,
  descricao,
}: {
  titulo: string;
  id: string;
  link?: { href: string; texto: string };
  descricao?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 id={id} className="m-0 font-serif text-[clamp(30px,4vw,38px)] font-medium">
          {titulo}
        </h2>
        {descricao ? <p className="text-muted mt-1.5 mb-0 text-base">{descricao}</p> : null}
      </div>
      {link ? <LinkSeta href={link.href}>{link.texto}</LinkSeta> : null}
    </div>
  );
}

export function LinkSeta({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'text-green inline-flex min-h-11 items-center text-[15px] font-semibold',
        className,
      )}
    >
      {children} <span aria-hidden="true">&nbsp;→</span>
    </Link>
  );
}

export function Trilha({ itens }: { itens: { href?: string; texto: string }[] }) {
  return (
    <nav aria-label="Você está em" className="text-muted-2 mb-5 text-sm">
      <ol className="m-0 flex list-none flex-wrap gap-1 p-0">
        {itens.map((i, idx) => (
          <li key={`${idx}-${i.texto}`} className="flex gap-1">
            {idx > 0 ? <span aria-hidden="true">/</span> : null}
            {i.href ? (
              <Link href={i.href} className="text-green">
                {i.texto}
              </Link>
            ) : (
              <span aria-current="page">{i.texto}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Categoria({
  cor,
  children,
  tamanho = 'sm',
}: {
  cor: string;
  children: ReactNode;
  tamanho?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-2 font-semibold tracking-[.06em]',
        tamanho === 'md' ? 'text-[13px]' : 'text-xs',
      )}
      style={{ color: cor }}
    >
      <span
        aria-hidden="true"
        className="size-2 flex-none rounded-full"
        style={{ background: cor }}
      />
      {children}
    </span>
  );
}

export function PontoAoVivo() {
  return (
    <span
      aria-hidden="true"
      className="bg-live animate-ceak-pulse inline-block size-[9px] rounded-full"
    />
  );
}

/** Linhas rótulo/valor (ficha lateral de eventos, produto, confirmação). */
export function Ficha({
  linhas,
  larguraRotulo = 100,
  className,
}: {
  linhas: [string, ReactNode][];
  larguraRotulo?: number;
  className?: string;
}) {
  return (
    <dl
      className={cn('m-0 grid gap-x-3 gap-y-2.5 text-[15px]', className)}
      style={{ gridTemplateColumns: `${larguraRotulo}px minmax(0,1fr)` }}
    >
      {linhas.map(([r, v]) => (
        <div key={r} className="contents">
          <dt className="text-muted-2">{r}</dt>
          <dd className="m-0 font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Filtros em chips como links (filtragem pelo servidor, compartilhável). */
export function ChipsLink({
  opcoes,
  ativo,
  href,
  rotulo,
}: {
  opcoes: readonly string[];
  ativo: string;
  href: (o: string) => string;
  rotulo: string;
}) {
  return (
    <nav aria-label={rotulo} className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const on = o === ativo;
        return (
          <Link
            key={o}
            href={href(o)}
            scroll={false}
            aria-current={on ? 'true' : undefined}
            className={cn(
              'rounded-pill inline-flex min-h-11 items-center border px-4 py-[9px] text-sm font-medium whitespace-nowrap no-underline hover:no-underline',
              on
                ? 'border-green bg-green text-white hover:text-white'
                : 'border-line-2 text-ink hover:border-green bg-white',
            )}
          >
            {o}
          </Link>
        );
      })}
    </nav>
  );
}

/** Player provisório (sem incorporar o YouTube: mais leve e sem rastreamento). */
export function Player({
  href,
  texto,
  aoVivo,
  tamanho = 'md',
}: {
  href?: string | null;
  texto: string;
  aoVivo?: boolean;
  tamanho?: 'md' | 'lg';
}) {
  const conteudo = (
    <>
      {aoVivo ? (
        <span className="text-bg absolute top-3.5 left-4 flex items-center gap-2 text-xs font-semibold tracking-[.1em]">
          <PontoAoVivo /> AO VIVO
        </span>
      ) : null}
      <span
        aria-hidden="true"
        className={cn(
          'border-green-on-dark flex items-center justify-center rounded-full border-[1.5px]',
          tamanho === 'lg' ? 'size-[68px] text-[22px]' : 'size-16 text-xl',
        )}
      >
        ▶
      </span>
      <span className="text-[15px]">{texto}</span>
    </>
  );
  const cls =
    'rounded-card-lg bg-green-dark text-green-on-dark relative flex aspect-video flex-col items-center justify-center gap-3 no-underline hover:no-underline';
  return href ? (
    <a href={href} className={cn(cls, 'hover:text-bg')} rel="noopener noreferrer" target="_blank">
      {conteudo}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  ) : (
    <div className={cls}>{conteudo}</div>
  );
}
