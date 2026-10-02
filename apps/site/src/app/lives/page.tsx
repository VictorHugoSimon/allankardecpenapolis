import type { Metadata } from 'next';
import { formatarHorario, formatarDiaSemanaData, mesmoDia } from '@ceak/core/format';
import { instituicao } from '@ceak/core';
import { AcoesEvento } from '@/components/AcoesEvento';
import { Player, Secao } from '@/components/Elementos';
import { Gravacoes } from '@/components/Gravacoes';
import { gravacoes, proximasAtividades, transmissaoAoVivo } from '@/lib/dados';
import { appUrl } from '@/lib/urls';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lives',
  description: 'Transmissões ao vivo das palestras do CEAK, próximas transmissões e gravações.',
  alternates: { canonical: '/lives' },
};

const pilula =
  'rounded-pill border border-line-3 bg-white px-5 py-3 text-[15px] text-ink whitespace-nowrap min-h-11 inline-flex items-center no-underline hover:no-underline hover:border-green';

export default async function LivesPage() {
  const agora = new Date();
  const [aoVivo, proximas, recs] = await Promise.all([
    transmissaoAoVivo(),
    proximasAtividades(8, agora),
    gravacoes(6),
  ]);
  const plano = proximas.filter((e) => e.tipo === 'PALESTRA' || e.tipo === 'ESTUDO').slice(0, 4);
  const destaque = aoVivo ?? plano.find((e) => e.tipo === 'PALESTRA') ?? null;

  return (
    <Secao className="pt-14 pb-20">
      <div className="flex flex-wrap items-start gap-7">
        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
          <Player
            href={destaque?.transmissaoUrl}
            aoVivo={!!aoVivo}
            tamanho="lg"
            texto={
              aoVivo
                ? 'Transmissão YouTube'
                : destaque
                  ? `Próxima transmissão: ${destaque.diaSemana}, ${destaque.horario}`
                  : 'Sem transmissão no momento'
            }
          />
          {destaque ? (
            <div>
              <p className="text-green m-0 text-[13px] font-semibold tracking-[.06em] uppercase">
                {destaque.tipo === 'PALESTRA' ? 'Palestra pública' : destaque.categoria} ·{' '}
                {mesmoDia(destaque.inicio, agora) ? 'hoje' : destaque.diaSemana},{' '}
                {formatarHorario(destaque.inicio).replace('h00', 'h')}
              </p>
              <h1 className="my-2 font-serif text-[clamp(30px,4vw,42px)] font-medium">
                {destaque.tituloCurto}
              </h1>
              <p className="text-muted m-0 text-base">
                {destaque.quem} · {destaque.local}
              </p>
            </div>
          ) : (
            <h1 className="m-0 font-serif text-[clamp(30px,4vw,42px)] font-medium">Lives</h1>
          )}
          <div className="flex flex-wrap gap-2.5">
            {aoVivo ? (
              <a
                href={appUrl('/checkin')}
                className="rounded-pill bg-green hover:bg-green-dark inline-flex min-h-11 items-center px-5 py-3 text-[15px] whitespace-nowrap text-white no-underline hover:text-white hover:no-underline"
              >
                Estou no CEAK — fazer check-in
              </a>
            ) : null}
            {destaque ? (
              <AcoesEvento
                slug={destaque.slug}
                titulo={destaque.titulo}
                url={destaque.url}
                calendario={false}
              />
            ) : null}
            <a href={instituicao.redes.facebook} className={pilula} rel="noopener noreferrer">
              Assistir no Facebook
            </a>
          </div>
        </div>
        <aside
          className="border-line flex flex-[1_1_300px] flex-col gap-1 rounded-[18px] border bg-white p-6"
          aria-labelledby="proximas-tx"
        >
          <h2 id="proximas-tx" className="m-0 mb-2 text-[15px] font-semibold">
            Próximas transmissões
          </h2>
          <ul className="m-0 list-none p-0">
            {plano.map((l) => (
              <li key={l.id} className="border-line-soft border-b py-3">
                <p className="text-muted-2 m-0 text-[13px]">
                  {mesmoDia(l.inicio, agora)
                    ? 'Hoje'
                    : formatarDiaSemanaData(l.inicio).replace(',', '')}{' '}
                  · {l.horario}
                </p>
                <p className="mt-0.5 mb-0 text-[15px] font-medium">{l.tituloCurto}</p>
                <p className="text-muted-2 m-0 text-[13px]">{l.quem.replace(/^Coord\. /, '')}</p>
              </li>
            ))}
          </ul>
          <p className="text-muted-2 mt-2.5 mb-0 text-[13px]">
            Ative as notificações no CEAK App para ser avisado quando a transmissão começar.
          </p>
        </aside>
      </div>
      <h2 className="mt-12 mb-5 font-serif text-[32px] font-medium">Gravações</h2>
      <Gravacoes itens={recs} />
    </Secao>
  );
}
