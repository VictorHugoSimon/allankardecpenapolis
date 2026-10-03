import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mesmoDia } from '@ceak/core/format';
import { Tela } from '@/components/Tela';
import { diaMes, diaRelativo, eventoPorSlug, palestraAnterior } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';
import { siteUrl } from '@/lib/urls';
import { BotaoCompartilhar } from './BotaoCompartilhar';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const e = await eventoPorSlug((await params).slug);
  return { title: e?.tituloCurto ?? 'Atividade' };
}

const acao =
  'border-line text-ink hover:text-ink hover:border-green flex min-h-12 items-center justify-center rounded-[14px] border bg-white p-3.5 text-center text-sm no-underline hover:no-underline';

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  await exigirSessao();
  const { slug } = await params;
  const e = await eventoPorSlug(slug);
  if (!e) notFound();
  const agora = new Date();
  const palestra = e.tipo === 'PALESTRA';
  const hoje = mesmoDia(e.inicio, agora);
  const encerrada = e.status === 'ENCERRADO' || (e.fim ?? e.inicio) < agora;
  const anterior = palestra ? await palestraAnterior(e.inicio) : null;
  const paginaSite = siteUrl(palestra ? `/palestras/${e.slug}` : `/agenda/${e.slug}`);

  return (
    <Tela titulo={palestra ? 'Palestra' : 'Atividade'} voltar="/agenda">
      <div className="flex flex-col gap-3.5">
        {palestra ? (
          <div className="bg-green-dark text-green-on-dark relative flex aspect-video flex-col items-center justify-center gap-2 rounded-[18px]">
            {e.status === 'EM_ANDAMENTO' && e.transmissaoUrl ? (
              <span className="bg-live text-bg absolute top-2.5 left-3 rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-[.1em]">
                AO VIVO
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className="border-green-on-dark flex size-[50px] items-center justify-center rounded-full border-[1.5px]"
            >
              ▶
            </span>
            {encerrada && e.gravacaoUrl ? (
              <a
                href={e.gravacaoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-bg text-xs"
              >
                Assistir à gravação
              </a>
            ) : e.transmissaoUrl && e.status === 'EM_ANDAMENTO' ? (
              <a
                href={e.transmissaoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-bg text-xs"
              >
                Assistir ao vivo
              </a>
            ) : (
              <p className="m-0 text-xs">
                {e.transmissaoUrl ? `Transmissão começa às ${e.hora}` : 'Sem transmissão ao vivo'}
              </p>
            )}
          </div>
        ) : null}

        <div>
          <p className="text-green m-0 text-xs font-semibold tracking-[.06em] uppercase">
            {palestra ? 'Palestra pública' : e.categoria} · {diaRelativo(e.inicio, agora)}
          </p>
          <h2 className="m-0 mt-1.5 font-serif text-[26px] leading-[1.2] font-normal">
            {e.tituloCurto}
          </h2>
          <p className="text-muted m-0 mt-1.5 text-sm">
            {e.quem} · {e.horario} · {e.local}
          </p>
        </div>
        {e.descricao ? (
          <p className="text-ink-2 m-0 text-[15px] leading-[1.6]">{e.descricao}</p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          {hoje && !encerrada ? (
            <Link
              href="/checkin"
              className="bg-green hover:bg-green-dark flex min-h-12 items-center justify-center rounded-[14px] p-3.5 text-sm font-medium text-white no-underline hover:text-white hover:no-underline"
            >
              Fazer check-in
            </Link>
          ) : null}
          {e.materialUrl ? (
            <a href={e.materialUrl} target="_blank" rel="noopener noreferrer" className={acao}>
              Material (PDF)
            </a>
          ) : null}
          {!encerrada ? (
            <a href={siteUrl(`/agenda/${e.slug}/calendario.ics`)} className={acao}>
              Adicionar à agenda
            </a>
          ) : null}
          <BotaoCompartilhar titulo={e.titulo} url={paginaSite} className={acao} />
        </div>

        {anterior ? (
          <section
            aria-label="Palestra anterior"
            className="border-line flex items-center gap-3 rounded-[18px] border bg-white p-4"
          >
            <div className="flex-1">
              <p className="text-muted-2 m-0 text-xs">
                Palestra anterior · {diaMes(anterior.inicio)}
              </p>
              <p className="m-0 mt-0.5 text-sm font-medium">{anterior.tituloCurto}</p>
              {anterior.gravacaoUrl ? (
                <a
                  href={anterior.gravacaoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-block text-xs"
                >
                  Gravação disponível
                </a>
              ) : null}
            </div>
            <Link
              href={`/avaliacao/${anterior.slug}`}
              aria-label={`Avaliar a palestra ${anterior.tituloCurto}`}
              className="rounded-pill bg-beige text-ink hover:text-ink inline-flex min-h-11 items-center px-3.5 py-2.5 text-[13px] no-underline hover:no-underline"
            >
              Avaliar
            </Link>
          </section>
        ) : null}
      </div>
    </Tela>
  );
}
