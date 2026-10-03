import type { Metadata } from 'next';
import Link from 'next/link';
import { cn } from '@ceak/ui';
import { Tela } from '@/components/Tela';
import { biblioteca, FILTROS_BIBLIOTECA } from '@/lib/dados';
import { campo } from '@/lib/estilos';
import { exigirSessao } from '@/lib/servidor';

export const metadata: Metadata = { title: 'Biblioteca' };
export const dynamic = 'force-dynamic';

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  await exigirSessao();
  const { q, tipo } = await searchParams;
  const ativo = tipo && tipo in FILTROS_BIBLIOTECA ? tipo : 'Todos';
  const itens = await biblioteca({ q, tipo: ativo });
  const href = (t: string) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (t !== 'Todos') p.set('tipo', t);
    const s = p.toString();
    return s ? `/biblioteca?${s}` : '/biblioteca';
  };
  return (
    <Tela titulo="Biblioteca">
      <div className="flex flex-col gap-3">
        <form role="search" action="/biblioteca">
          {ativo !== 'Todos' ? <input type="hidden" name="tipo" value={ativo} /> : null}
          <label htmlFor="busca" className="sr-only">
            Buscar na biblioteca
          </label>
          <input
            id="busca"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Buscar por assunto, autor, curso ou tema"
            className={cn(campo, 'p-3.5')}
          />
        </form>
        <nav aria-label="Tipos de material" className="-mx-[18px] overflow-x-auto px-[18px] pb-0.5">
          <ul className="m-0 flex list-none gap-1.5 p-0">
            {['Todos', ...Object.keys(FILTROS_BIBLIOTECA)].map((f) => (
              <li key={f} className="flex-none">
                <Link
                  href={href(f)}
                  replace
                  aria-current={ativo === f ? 'page' : undefined}
                  className={cn(
                    'rounded-pill inline-flex min-h-9 items-center border px-[13px] py-[7px] text-[13px] no-underline hover:no-underline',
                    ativo === f
                      ? 'bg-green border-green text-white hover:text-white'
                      : 'border-line-2 text-ink hover:text-ink bg-white',
                  )}
                >
                  {f}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p role="status" className="sr-only">
          {itens.length} {itens.length === 1 ? 'item encontrado' : 'itens encontrados'}
        </p>
        {itens.length ? (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {itens.map((b) => {
              const corpo = (
                <>
                  <span
                    aria-hidden="true"
                    className="placeholder-stripes text-placeholder-ink flex h-[58px] w-[46px] flex-none items-end justify-center rounded-lg pb-1 font-mono text-[9px]"
                  >
                    {b.selo}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{b.titulo}</span>
                    <span className="text-muted-2 mt-0.5 block text-xs">{b.autor}</span>
                  </span>
                </>
              );
              const classe =
                'border-line flex items-center gap-3 rounded-[14px] border bg-white p-3 text-ink no-underline hover:no-underline hover:text-ink';
              return (
                <li key={b.id}>
                  {b.url && /^https?:\/\//.test(b.url) ? (
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(classe, 'hover:border-green')}
                    >
                      {corpo}
                    </a>
                  ) : (
                    <div className={classe}>{corpo}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted m-0 text-sm">
            Nada encontrado. Tente outra palavra ou outro filtro.
          </p>
        )}
      </div>
    </Tela>
  );
}
