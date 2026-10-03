import Link from 'next/link';
import type { Metadata } from 'next';
import { centralAprovacoes } from '@ceak/db';
import { buttonClasses, cn } from '@ceak/ui';
import { TituloPagina, Vazio } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';
import { BotoesDecisao } from './BotoesDecisao';

export const metadata: Metadata = { title: 'Aprovações' };
export const dynamic = 'force-dynamic';

export default async function AprovacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const s = await exigirModulo('aprovacoes');
  const { tipo } = await searchParams;
  const c = await centralAprovacoes(s.perfil, tipo);
  return (
    <div className="flex flex-col gap-[18px]">
      <TituloPagina>Central de aprovações</TituloPagina>
      <nav aria-label="Filtrar por tipo">
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5 p-0">
          {c.contadores.map((k) => {
            const on = c.filtro === k.tipo;
            return (
              <li key={k.tipo}>
                <Link
                  href={on ? '/aprovacoes' : `/aprovacoes?tipo=${k.tipo}`}
                  aria-current={on ? 'true' : undefined}
                  scroll={false}
                  className={cn(
                    'text-ink hover:text-ink block rounded-[14px] border p-3.5 no-underline hover:no-underline',
                    on ? 'bg-green-soft border-green' : 'border-line hover:border-green bg-white',
                  )}
                >
                  <span className="block font-serif text-[28px]">{k.total}</span>
                  <span className="text-muted block text-[13px]">{k.rotulo}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {c.pendentes.length ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Itens pendentes">
          {c.pendentes.map((a) => (
            <li
              key={a.id}
              className="border-line flex flex-wrap items-center gap-4 rounded-[14px] border bg-white p-4"
            >
              <span className="bg-beige-2 min-w-[100px] rounded-md px-2 py-1 text-center text-[11px] font-semibold tracking-[.04em]">
                {a.rotulo}
              </span>
              <div className="min-w-[220px] flex-1">
                <p className="m-0 text-sm font-medium">{a.titulo}</p>
                <p className="text-muted-2 m-0 mt-0.5 text-xs">{a.detalhe}</p>
              </div>
              <div className="flex gap-1.5">
                {a.editar ? (
                  <Link
                    href={a.editar}
                    aria-label={`Editar: ${a.titulo}`}
                    className={buttonClasses({
                      variant: 'secondary',
                      shape: 'rounded',
                      size: 'sm',
                    })}
                  >
                    {a.tipo === 'CONTEUDO' ? 'Revisar' : 'Editar'}
                  </Link>
                ) : null}
                <BotoesDecisao id={a.id} titulo={a.titulo} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Vazio>Nenhum item pendente nesta categoria.</Vazio>
      )}
    </div>
  );
}
