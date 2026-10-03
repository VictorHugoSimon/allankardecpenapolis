import Link from 'next/link';
import { formatarHora, partesData } from '@ceak/core/format';
import {
  atividadeParaCheckin,
  avaliacaoPendente,
  contarNaoLidas,
  estatisticasDoMes,
  meusEstudos,
} from '@ceak/db';
import { ProgressBar } from '@ceak/ui';
import { Tela } from '@/components/Tela';
import { agenda, diaRelativo } from '@/lib/dados';
import { cartao } from '@/lib/estilos';
import { exigirSessao } from '@/lib/servidor';

export const dynamic = 'force-dynamic';

export default async function InicioPage() {
  const s = await exigirSessao();
  const agora = new Date();
  const [naoLidas, hoje, mes, estudos, pendente] = await Promise.all([
    contarNaoLidas(s.pessoaId),
    atividadeParaCheckin(agora),
    estatisticasDoMes(s.pessoaId, agora),
    meusEstudos(s.pessoaId, agora),
    avaliacaoPendente(s.pessoaId, agora),
  ]);
  const proxima = hoje ? null : (await agenda(agora, 1))[0];
  const p = partesData(agora);
  const estudo = estudos[0];

  return (
    <Tela className="pt-1.5">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted m-0 text-sm">
              {p.diaSemana}, {p.dia} de {p.mesLongo}
            </p>
            <h1 className="m-0 font-serif text-[30px] font-normal">Olá, {s.nome.split(' ')[0]}</h1>
          </div>
          <Link
            href="/notificacoes"
            aria-label={
              naoLidas
                ? `Notificações: ${naoLidas} ${naoLidas === 1 ? 'não lida' : 'não lidas'}`
                : 'Notificações'
            }
            className="border-line text-ink hover:text-ink relative flex size-11 items-center justify-center rounded-full border bg-white text-[13px] font-semibold no-underline hover:no-underline"
          >
            {naoLidas ? (
              <>
                <span aria-hidden="true">{naoLidas}</span>
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-[9px] size-2 rounded-full bg-[#C0654D]"
                />
              </>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16zM10 20a2 2 0 004 0"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Link>
        </div>

        {hoje || proxima ? (
          <section
            aria-labelledby="hoje-titulo"
            className="bg-green-dark text-bg flex flex-col gap-1.5 rounded-[22px] p-5"
          >
            <p className="label-caps text-green-on-dark-2 m-0">
              {hoje ? 'Hoje no CEAK' : 'Próxima atividade'}
            </p>
            <h2 id="hoje-titulo" className="m-0 font-serif text-2xl font-normal">
              {(hoje ?? proxima)!.tipo === 'PALESTRA'
                ? 'Palestra Pública'
                : hoje
                  ? hoje.titulo
                  : proxima!.titulo}
            </h2>
            <p className="text-green-on-dark m-0 text-[15px]">
              {hoje
                ? [
                    formatarHora(hoje.inicio),
                    hoje.local,
                    hoje.palestrante?.nome ?? hoje.responsavel,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : `${diaRelativo(proxima!.inicio, agora)} · ${proxima!.hora} · ${proxima!.local}`}
            </p>
            <div className="mt-2.5 flex gap-2">
              <Link
                href={`/agenda/${(hoje ?? proxima)!.slug}`}
                className="rounded-pill bg-bg text-green-dark hover:text-green-dark flex min-h-11 flex-1 items-center justify-center p-3 text-sm font-semibold no-underline hover:bg-white hover:no-underline"
              >
                Ver detalhes
              </Link>
              {hoje ? (
                <Link
                  href="/checkin"
                  className="rounded-pill border-green-line text-bg hover:text-bg flex min-h-11 flex-1 items-center justify-center border p-3 text-sm font-medium no-underline hover:border-white hover:no-underline"
                >
                  Fazer check-in
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <Link
          href="/jornada"
          className={`${cartao} text-ink hover:text-ink block no-underline hover:no-underline`}
        >
          <span className="mb-3 flex justify-between text-[15px] font-semibold">
            <span>Minha jornada</span>
            <span className="text-green text-[13px]" aria-hidden="true">
              Ver ›
            </span>
          </span>
          <span className="grid grid-cols-3 gap-2">
            {[
              [mes.visitas, mes.visitas === 1 ? 'visita este mês' : 'visitas este mês'],
              [mes.estudos, mes.estudos === 1 ? 'estudo' : 'estudos'],
              [
                mes.voluntariados,
                mes.voluntariados === 1 ? 'ação voluntária' : 'ações voluntárias',
              ],
            ].map(([v, l]) => (
              <span key={l}>
                <span className="block font-serif text-[28px]">{v}</span>
                <span className="text-muted block text-xs">{l}</span>
              </span>
            ))}
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/preciso-de-ajuda"
            className="bg-green-soft text-ink hover:text-ink rounded-[18px] p-[18px] no-underline hover:no-underline"
          >
            <span className="block text-[15px] font-semibold">Preciso de ajuda</span>
            <span className="text-ink-3 mt-1 block text-xs">Atendimento e passe</span>
          </Link>
          <Link
            href="/quero-ajudar"
            className="bg-beige text-ink hover:text-ink rounded-[18px] p-[18px] no-underline hover:no-underline"
          >
            <span className="block text-[15px] font-semibold">Quero ajudar</span>
            <span className="text-ink-3 mt-1 block text-xs">Doações e voluntariado</span>
          </Link>
        </div>

        <section aria-labelledby="estudos-titulo" className={cartao}>
          <div className="mb-3 flex justify-between text-[15px] font-semibold">
            <h2 id="estudos-titulo" className="m-0 text-[15px] font-semibold">
              Meus estudos
            </h2>
            <Link href="/estudos" className="text-[13px]">
              Todos <span aria-hidden="true">›</span>
            </Link>
          </div>
          {estudo ? (
            <Link
              href={`/estudos/${estudo.turmaId}`}
              className="text-ink hover:text-ink block no-underline hover:no-underline"
            >
              <span className="mb-1.5 flex justify-between text-sm">
                <span>
                  {estudo.sigla}
                  {estudo.etapa ? ` · ${estudo.etapa.replace(/ de \d+$/, '')}` : ''}
                </span>
                <span className="font-semibold">{estudo.progresso}%</span>
              </span>
              <ProgressBar value={estudo.progresso} label={`Progresso em ${estudo.sigla}`} />
            </Link>
          ) : (
            <p className="text-muted m-0 text-sm">
              Você ainda não participa de um estudo.{' '}
              <Link href="/estudos/inscrever">Conheça os estudos</Link>
            </p>
          )}
        </section>

        {pendente ? (
          <section
            className={`${cartao} flex items-center gap-3`}
            aria-labelledby="pendente-titulo"
          >
            <div className="flex-1">
              <p className="m-0 text-xs font-semibold tracking-[.06em] text-[#7A5A1E]">
                AVALIAÇÃO PENDENTE
              </p>
              <h2 id="pendente-titulo" className="m-0 mt-1 text-[15px] font-medium">
                Palestra: {pendente.titulo}
              </h2>
            </div>
            <Link
              href={`/avaliacao/${pendente.slug}`}
              aria-label={`Avaliar a palestra ${pendente.titulo}`}
              className="rounded-pill bg-green hover:bg-green-dark inline-flex min-h-11 items-center px-4 py-2.5 text-sm text-white no-underline hover:text-white hover:no-underline"
            >
              Avaliar
            </Link>
          </section>
        ) : null}

        <Link
          href="/ia"
          className="rounded-pill border-line text-muted hover:text-muted flex min-h-12 items-center justify-between border bg-white px-[18px] py-[15px] text-[15px] no-underline hover:no-underline"
        >
          <span>Pergunte ao CEAK IA…</span>
          <span className="text-green font-semibold">IA</span>
        </Link>

        <nav aria-label="Atalhos" className="grid grid-cols-3 gap-2">
          {[
            ['Biblioteca', '/biblioteca'],
            ['Lives', '/lives'],
            ['Loja', '/loja'],
          ].map(([t, href]) => (
            <Link
              key={href}
              href={href!}
              className="border-line text-ink hover:text-ink hover:border-green flex min-h-11 items-center justify-center rounded-[14px] border bg-white px-1.5 py-3 text-[13px] no-underline hover:no-underline"
            >
              {t}
            </Link>
          ))}
        </nav>
      </div>
    </Tela>
  );
}
