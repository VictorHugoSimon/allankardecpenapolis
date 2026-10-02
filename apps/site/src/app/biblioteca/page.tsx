import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoEnviar } from '@/components/AutoEnviar';
import { ChipsLink, Secao, Subtitulo, TituloPagina } from '@/components/Elementos';
import {
  FILTROS_BIBLIOTECA,
  itensBiblioteca,
  TIPOS_BIBLIOTECA,
  type FiltroBiblioteca,
} from '@/lib/dados';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Biblioteca digital',
  description:
    'Livros, apostilas, artigos, vídeos, áudios e gravações de palestras. Acervo físico com mais de 3 mil títulos para empréstimo gratuito.',
  alternates: { canonical: '/biblioteca' },
};

const TIPOS = ['Todos', ...Object.keys(TIPOS_BIBLIOTECA)] as const;
const ROTULOS = { assunto: 'Assunto', autor: 'Autor', curso: 'Curso', tema: 'Tema' } as const;
const seletor = 'min-h-11 rounded-input border border-line-2 bg-white px-2.5 py-2.5 text-sm';

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<FiltroBiblioteca>;
}) {
  const f = await searchParams;
  const filtro: FiltroBiblioteca = {
    q: typeof f.q === 'string' ? f.q.slice(0, 80) : undefined,
    tipo: f.tipo,
    assunto: f.assunto,
    autor: f.autor,
    curso: f.curso,
    tema: f.tema,
  };
  const itens = await itensBiblioteca(filtro);
  const qs = (mudar: Partial<FiltroBiblioteca>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filtro, ...mudar }))
      if (v && v !== 'Todos') p.set(k, v);
    const s = p.toString();
    return `/biblioteca${s ? `?${s}` : ''}`;
  };

  return (
    <Secao className="pt-14 pb-20">
      <TituloPagina>Biblioteca digital</TituloPagina>
      <Subtitulo>
        Livros, apostilas, artigos, vídeos, áudios e gravações de palestras. O acervo físico, com
        mais de 3 mil títulos, pode ser emprestado gratuitamente.
      </Subtitulo>
      <form role="search" action="/biblioteca" className="mb-4">
        {filtro.tipo ? <input type="hidden" name="tipo" value={filtro.tipo} /> : null}
        <label htmlFor="busca" className="sr-only">
          Buscar no acervo
        </label>
        <input
          id="busca"
          name="q"
          type="search"
          defaultValue={filtro.q ?? ''}
          placeholder="Buscar por assunto, autor, curso ou tema"
          className="rounded-input-lg border-line-2 placeholder:text-muted-2 w-full border bg-white px-[18px] py-4 text-base"
        />
        <div className="mt-4 mb-6">
          <ChipsLink
            rotulo="Tipo de material"
            opcoes={TIPOS}
            ativo={filtro.tipo ?? 'Todos'}
            href={(t) => qs({ tipo: t })}
          />
        </div>
        <fieldset className="m-0 mb-6 flex flex-wrap items-center gap-2.5 border-0 p-0">
          <legend className="sr-only">Mais filtros</legend>
          {(Object.keys(FILTROS_BIBLIOTECA) as (keyof typeof FILTROS_BIBLIOTECA)[]).map((k) => (
            <select
              key={k}
              name={k}
              defaultValue={filtro[k] ?? ''}
              aria-label={ROTULOS[k]}
              className={seletor}
            >
              <option value="">{ROTULOS[k]}: todos</option>
              {FILTROS_BIBLIOTECA[k].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ))}
          <button
            type="submit"
            className="rounded-pill border-line-3 min-h-11 border bg-white px-4 text-sm"
          >
            Filtrar
          </button>
          <AutoEnviar />
        </fieldset>
      </form>
      <p role="status" className="sr-only">
        {itens.length} {itens.length === 1 ? 'item encontrado' : 'itens encontrados'}
      </p>
      {itens.length === 0 ? (
        <p className="text-muted-2 p-7 text-center">Nenhum item encontrado para esta busca.</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3.5 p-0">
          {itens.map((b) => {
            const href =
              b.url ?? `/contato?assunto=Biblioteca&item=${encodeURIComponent(b.titulo)}`;
            return (
              <li
                key={b.id}
                className="border-line flex gap-3.5 rounded-[18px] border bg-white p-[18px]"
              >
                <span
                  aria-hidden="true"
                  className="placeholder-stripes text-placeholder-ink flex h-[74px] w-14 flex-none items-end justify-center rounded-lg pb-1 font-mono text-[9px]"
                >
                  {b.tipo}
                </span>
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <h2 className="m-0 text-[15px] leading-[1.3] font-semibold">{b.titulo}</h2>
                  <p className="text-muted-2 m-0 text-[13px]">{b.autor}</p>
                  <p className="text-muted-2 m-0 text-xs">
                    <span className="sr-only">{b.tipo} · </span>
                    {b.tema}
                  </p>
                  {b.url ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex min-h-11 items-center text-[13px] font-semibold"
                    >
                      {b.cta} ›<span className="sr-only">: {b.titulo} (nova aba)</span>
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className="mt-1.5 inline-flex min-h-11 items-center text-[13px] font-semibold"
                    >
                      {b.cta} ›<span className="sr-only">: {b.titulo}</span>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Secao>
  );
}
