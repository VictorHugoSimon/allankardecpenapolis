import Link from 'next/link';
import { AcoesEvento } from '@/components/AcoesEvento';
import { Categoria, Ficha, Player, Secao, Trilha } from '@/components/Elementos';
import { type EventoSite } from '@/lib/dados';
import { eventoLd, JsonLd } from '@/lib/jsonld';
import { appUrl } from '@/lib/urls';

const cardInfo = 'border-line rounded-card border bg-white p-5';

export function DetalheEvento({ e }: { e: EventoSite }) {
  const encerrado = e.status === 'ENCERRADO';
  const palestra = e.tipo === 'PALESTRA';
  return (
    <Secao className="pt-10 pb-20">
      <Trilha itens={[{ href: '/agenda', texto: 'Agenda' }, { texto: e.categoria }]} />
      <div className="flex flex-wrap items-start gap-10">
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-7">
          <div>
            <Categoria cor={e.cor} tamanho="md">
              {e.categoria}
            </Categoria>
            <h1 className="mt-3 mb-0 font-serif text-[clamp(34px,4.4vw,52px)] leading-[1.08] font-medium text-balance">
              {e.titulo}
            </h1>
          </div>
          {e.transmissaoUrl || e.gravacaoUrl ? (
            <Player
              href={encerrado ? e.gravacaoUrl : e.transmissaoUrl}
              aoVivo={e.status === 'EM_ANDAMENTO'}
              texto={
                encerrado
                  ? `Gravação no YouTube${e.gravacaoDuracaoMin ? ` · ${e.gravacaoDuracaoMin} min` : ''}`
                  : `Transmissão ao vivo pelo YouTube · ${e.diaSemana}, ${e.horario}`
              }
            />
          ) : null}
          <div>
            <h2 className="m-0 mb-2.5 font-serif text-[26px] font-medium">Resumo</h2>
            <p className="text-ink-2 m-0 text-[17px] leading-[1.7]">
              {e.descricao}
              {palestra
                ? ' A palestra propõe uma reflexão à luz de O Evangelho Segundo o Espiritismo, com espaço ao final para perguntas do público presente e de quem acompanha online.'
                : ''}
            </p>
          </div>
          {palestra ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
              <div className={cardInfo}>
                <h3 className="text-muted-2 m-0 mb-1.5 text-[13px] font-normal">
                  Material de apoio
                </h3>
                <p className="m-0 text-base font-medium">Roteiro da palestra (PDF, 2 págs.)</p>
                {e.materialUrl ? (
                  <a href={e.materialUrl} className="mt-2 inline-block text-sm">
                    Baixar roteiro
                  </a>
                ) : (
                  <p className="text-green mt-2 mb-0 text-sm">Disponível no dia</p>
                )}
              </div>
              <div className={cardInfo}>
                <h3 className="text-muted-2 m-0 mb-1.5 text-[13px] font-normal">Gravação</h3>
                <p className="m-0 text-base font-medium">Publicada na biblioteca até 48h depois</p>
                <p className="text-green mt-2 mb-0 text-sm">Avisaremos pelo app</p>
              </div>
              <div className={cardInfo}>
                <h3 className="text-muted-2 m-0 mb-1.5 text-[13px] font-normal">
                  Avaliação pós-evento
                </h3>
                <p className="m-0 text-base font-medium">Conte como foi sua experiência</p>
                <a
                  href={appUrl(`/avaliacao?evento=${e.slug}`)}
                  className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold"
                >
                  Avaliar no CEAK App <span aria-hidden="true">&nbsp;→</span>
                </a>
              </div>
            </div>
          ) : null}
        </div>
        <aside
          className="border-line rounded-card-lg sticky top-24 flex flex-[1_1_300px] flex-col gap-4 border bg-white p-[26px]"
          aria-label="Informações da atividade"
        >
          <Ficha
            linhas={[
              ['Data', `${e.diaSemana}, ${e.dia} de ${e.mesLongo}`],
              ['Horário', e.horario],
              ['Local', e.local],
              ['Com', e.quem],
            ]}
          />
          {e.inscricaoAberta && !encerrado ? (
            <Link
              href={`/inscricao?evento=${e.slug}`}
              className="rounded-pill bg-green hover:bg-green-dark min-h-12 p-3.5 text-center text-base font-medium text-white no-underline hover:text-white hover:no-underline"
            >
              Fazer inscrição
            </Link>
          ) : null}
          {!encerrado ? (
            <a
              href={appUrl('/checkin')}
              className="rounded-pill border-line-3 text-ink hover:border-green min-h-12 border p-[13px] text-center text-[15px] font-medium no-underline hover:no-underline"
            >
              Fazer check-in no dia
            </a>
          ) : null}
          <div className="flex gap-2">
            <AcoesEvento slug={e.slug} titulo={e.titulo} url={e.url} variante="bloco" />
          </div>
          <p className="text-muted-2 m-0 text-[13px] leading-normal">
            A inscrição é opcional e ajuda a organizar o salão. Entrada gratuita.
          </p>
        </aside>
      </div>
      <JsonLd dados={eventoLd(e)} />
    </Secao>
  );
}
