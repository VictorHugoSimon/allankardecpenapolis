import Link from 'next/link';
import type { Metadata } from 'next';
import { podeAcessar, podeEditarAgenda } from '@ceak/core/rbac';
import { detalheEvento, listaEventos } from '@ceak/db';
import { buttonClasses, cn, Pill } from '@ceak/ui';
import { Cartao, TituloPagina, Vazio } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';
import { SITE_URL } from '@/lib/servidor';

export const metadata: Metadata = { title: 'Eventos' };
export const dynamic = 'force-dynamic';

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const s = await exigirModulo('eventos');
  const { id } = await searchParams;
  const lista = await listaEventos();
  const selId =
    id && /^[0-9a-f-]{36}$/.test(id)
      ? id
      : (lista.find((e) => e.status === 'Em andamento') ?? lista[0])?.id;
  const ev = selId ? await detalheEvento(selId) : null;
  return (
    <div className="flex flex-col gap-[18px]">
      <TituloPagina
        acoes={
          podeEditarAgenda(s.perfil) ? (
            <Link href="/agenda/nova" className={buttonClasses({ shape: 'rounded', size: 'sm' })}>
              Novo evento
            </Link>
          ) : undefined
        }
      >
        Eventos
      </TituloPagina>
      <div className="flex flex-wrap items-start gap-4">
        <nav
          aria-label="Eventos recentes e próximos"
          className="flex flex-[1_1_280px] flex-col gap-2"
        >
          {lista.length ? (
            lista.map((e) => {
              const on = e.id === ev?.id;
              return (
                <Link
                  key={e.id}
                  href={`/eventos?id=${e.id}`}
                  scroll={false}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'text-ink hover:text-ink flex flex-col gap-1.5 rounded-[14px] border p-3.5 no-underline hover:no-underline',
                    on ? 'border-green bg-green-tint' : 'border-line hover:border-green bg-white',
                  )}
                >
                  <span className="text-sm font-semibold">{e.titulo}</span>
                  <span className="text-muted-2 flex items-center justify-between gap-2 text-xs">
                    {e.data}
                    <Pill tone={e.tom}>{e.status}</Pill>
                  </span>
                </Link>
              );
            })
          ) : (
            <Vazio>Nenhum evento nas próximas semanas.</Vazio>
          )}
        </nav>
        {ev ? (
          <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-3">
            <section
              className="border-line rounded-card border bg-white p-5"
              aria-labelledby="ev-titulo"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 id="ev-titulo" className="m-0 font-serif text-[26px] font-normal">
                    {ev.titulo}
                  </h2>
                  <p className="text-muted-2 m-0 mt-1 text-[13px]">
                    {ev.data} · {ev.quem} · {ev.local}
                  </p>
                </div>
                <Pill tone={ev.tom}>{ev.status}</Pill>
              </div>
              <dl className="m-0 mt-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                {ev.indicadores.map(([l, v]) => (
                  <div key={l} className="flex flex-col-reverse">
                    <dt className="text-muted-2 text-xs">{l}</dt>
                    <dd className="m-0 text-[22px] font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {ev.checkinDisponivel ? (
                  <Link
                    href={`/eventos/${ev.id}/qrcode`}
                    className={buttonClasses({
                      shape: 'rounded',
                      size: 'sm',
                      variant: 'secondary',
                    })}
                  >
                    QR Code do check-in
                  </Link>
                ) : null}
                {ev.publico && ev.status !== 'Rascunho' ? (
                  <a
                    href={`${SITE_URL}/${ev.tipo === 'PALESTRA' ? 'palestras' : 'agenda'}/${ev.slug}`}
                    className={buttonClasses({
                      shape: 'rounded',
                      size: 'sm',
                      variant: 'secondary',
                    })}
                  >
                    Ver no site
                  </a>
                ) : null}
              </div>
            </section>
            <div className="flex flex-wrap gap-3">
              <Cartao className="flex-[1_1_220px]" titulo="Avaliação média">
                <dl className="m-0">
                  {ev.notas.map(([l, v]) => (
                    <div key={l} className="flex justify-between py-[5px] text-sm">
                      <dt>{l}</dt>
                      <dd className="m-0 font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Cartao>
              <Cartao className="flex-[2_1_300px]" titulo="Comentários e observações">
                <ul className="m-0 list-none p-0">
                  {ev.comentarios.map((c) => (
                    <li
                      key={c}
                      className="border-b border-[#F4F0E7] py-1.5 text-sm leading-[1.45] last:border-b-0"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </Cartao>
            </div>
            {ev.fluxo ? (
              <p className="bg-green-soft text-green-dark m-0 rounded-xl px-4 py-3.5 text-[13px]">
                Fluxo da palestra: {ev.fluxo}
                {podeAcessar(s.perfil, 'automacoes') ? (
                  <>
                    {' · '}
                    <Link href="/automacoes" className="text-green-dark font-semibold">
                      ver automações ›
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
