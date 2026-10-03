import Link from 'next/link';
import { type ReactNode } from 'react';
import { cn, Pill } from '@ceak/ui';

export function TituloPagina({
  children,
  acoes,
  sub,
  antes,
}: {
  children: ReactNode;
  acoes?: ReactNode;
  sub?: ReactNode;
  antes?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {antes ? <div className="text-muted-2 text-[13px]">{antes}</div> : null}
        <h1 className="mt-1 mb-0 font-serif text-[34px] leading-[1.15] font-medium">{children}</h1>
      </div>
      {sub ? <div className="text-muted-2 text-[13px]">{sub}</div> : null}
      {acoes ? <div className="flex flex-wrap gap-2">{acoes}</div> : null}
    </div>
  );
}

export function Trilha({ itens }: { itens: { href?: string; texto: string }[] }) {
  return (
    <nav aria-label="Trilha" className="text-muted-2 text-[13px]">
      {itens.map((i, n) => (
        <span key={i.texto}>
          {n ? ' / ' : ''}
          {i.href ? (
            <Link href={i.href}>{i.texto}</Link>
          ) : (
            <span aria-current="page">{i.texto}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export interface Indicador {
  rotulo: string;
  valor: string;
  detalhe?: string;
  tom?: 'positivo' | 'atencao' | 'erro' | 'verde' | 'ocre';
}

const corValor = {
  verde: 'text-green',
  ocre: 'text-[#7A5A1E]',
  erro: 'text-danger',
  positivo: '',
  atencao: '',
} as const;

export function Indicadores({
  itens,
  min = 150,
  tamanho = 32,
}: {
  itens: Indicador[];
  min?: number;
  tamanho?: number;
}) {
  return (
    <ul
      className="m-0 grid list-none gap-2.5 p-0"
      style={{ gridTemplateColumns: `repeat(auto-fill,minmax(${min}px,1fr))` }}
    >
      {itens.map((k) => (
        <li key={k.rotulo} className="border-line rounded-[14px] border bg-white p-4">
          <span className="text-muted-2 block text-xs">{k.rotulo}</span>
          <span
            className={cn('mt-1 block font-serif leading-[1.1]', k.tom ? corValor[k.tom] : '')}
            style={{ fontSize: tamanho }}
          >
            {k.valor}
          </span>
          {k.detalhe ? (
            <span
              className={cn(
                'mt-1 block text-xs',
                k.tom === 'positivo'
                  ? 'text-ok-strong'
                  : k.tom === 'atencao'
                    ? 'text-[#7A5A1E]'
                    : 'text-muted-2',
              )}
            >
              {k.detalhe}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Abas como links (cada aba tem URL própria). */
export function AbasLink({
  itens,
  ativo,
  rotulo,
}: {
  itens: { id: string; rotulo: string; href: string }[];
  ativo: string;
  rotulo: string;
}) {
  return (
    <nav aria-label={rotulo} className="border-line flex gap-1 overflow-x-auto border-b">
      {itens.map((t) => {
        const on = t.id === ativo;
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            scroll={false}
            className={cn(
              'flex min-h-11 flex-none items-center border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap no-underline hover:no-underline',
              on
                ? 'border-green text-green-dark hover:text-green-dark'
                : 'text-muted-2 hover:text-ink border-transparent',
            )}
          >
            {t.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

export function Cartao({
  children,
  className,
  titulo,
  extra,
}: {
  children: ReactNode;
  className?: string;
  titulo?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <section className={cn('border-line rounded-card min-w-0 border bg-white p-5', className)}>
      {titulo ? (
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-[15px] font-semibold">{titulo}</h2>
          {extra ? <div className="text-muted-2 text-xs">{extra}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function PillStatus({
  rotulo,
  tom,
}: {
  rotulo: string;
  tom: 'ok' | 'warn' | 'err' | 'neutral' | 'info';
}) {
  return <Pill tone={tom}>{rotulo}</Pill>;
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="border-line-2 text-muted-2 rounded-[14px] border border-dashed bg-white p-7 text-center text-sm">
      {children}
    </div>
  );
}
