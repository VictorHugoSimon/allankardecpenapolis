import Link from 'next/link';
import type { Metadata } from 'next';
import { buscaGlobal } from '@ceak/db';
import { TituloPagina, Vazio } from '@/components/Pagina';
import { contextoRls, exigirSessao } from '@/lib/auth';

export const metadata: Metadata = { title: 'Busca' };
export const dynamic = 'force-dynamic';

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const s = await exigirSessao();
  const { q = '' } = await searchParams;
  const resultados = await buscaGlobal({ ...contextoRls(s), perfil: s.perfil }, q);
  const grupos = [...new Set(resultados.map((r) => r.grupo))];
  return (
    <div className="flex flex-col gap-5">
      <TituloPagina
        sub={
          q
            ? `${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'} para “${q}”`
            : undefined
        }
      >
        Busca
      </TituloPagina>
      {q.trim().length < 2 ? (
        <Vazio>Digite ao menos duas letras na busca do topo.</Vazio>
      ) : resultados.length === 0 ? (
        <Vazio>Nada encontrado nos módulos do seu perfil.</Vazio>
      ) : (
        grupos.map((g) => (
          <section key={g} aria-labelledby={`g-${g}`} className="flex flex-col gap-2">
            <h2
              id={`g-${g}`}
              className="text-muted-2 m-0 text-xs font-semibold tracking-[.06em] uppercase"
            >
              {g}
            </h2>
            <ul className="border-line m-0 list-none overflow-hidden rounded-[14px] border bg-white p-0">
              {resultados
                .filter((r) => r.grupo === g)
                .map((r) => (
                  <li key={r.href + r.titulo} className="border-line-soft border-b last:border-b-0">
                    <Link
                      href={r.href}
                      className="text-ink hover:bg-surface-2 hover:text-ink flex flex-col px-4 py-3 no-underline hover:no-underline"
                    >
                      <span className="text-sm font-medium">{r.titulo}</span>
                      <span className="text-muted-2 text-xs">{r.detalhe}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
