import Link from 'next/link';
import {
  formatarDiaSemanaData,
  formatarHoraCurta,
  formatarMesAno,
  mesmoDia,
} from '@ceak/core/format';
import { SERVICOS_AJUDA } from '@ceak/core/regras';
import { ImagePlaceholder, ProgressBar } from '@ceak/ui';
import { CabecalhoSecao, Categoria, PontoAoVivo, Secao } from '@/components/Elementos';
import {
  campanhaEmDestaque,
  estudosEmDestaque,
  posts,
  prestacaoDeContas,
  produtosEmDestaque,
  proximasAtividades,
  transmissaoAoVivo,
} from '@/lib/dados';
import { formatarDataCurta } from '@ceak/core/format';

export const dynamic = 'force-dynamic';

const botaoHero =
  'rounded-pill inline-flex min-h-12 items-center px-6 py-3.5 text-base font-medium whitespace-nowrap no-underline hover:no-underline';

const AJUDAR = [
  { t: 'Doar dinheiro', d: 'PIX único ou mensal', href: '/doar' },
  {
    t: 'Doar alimentos',
    d: 'Cestas da assistência',
    href: '/quero-ajudar?opcao=alimentos#detalhe',
  },
  { t: 'Doar roupas', d: 'Campanha do Agasalho', href: '/quero-ajudar?opcao=roupas#detalhe' },
  { t: 'Doar produtos', d: 'Para o bazar', href: '/quero-ajudar?opcao=produtos#detalhe' },
  { t: 'Ser voluntário', d: '6 áreas de atuação', href: '/quero-ajudar?opcao=voluntario#detalhe' },
];

const PRECISO = [
  ...['atendimento-fraterno', 'passe', 'tratamento-espiritual', 'orientacao', 'prece'].map(
    (slug) => {
      const s = SERVICOS_AJUDA.find((x) => x.slug === slug)!;
      return { t: s.nome, href: `/preciso-de-ajuda/${s.slug}` };
    },
  ),
  { t: 'Conhecer o Centro', href: '/o-ceak' },
];

export default async function HomePage() {
  const agora = new Date();
  const [aoVivo, atividades, estudos, artigos, loja, contas, campanha] = await Promise.all([
    transmissaoAoVivo(),
    proximasAtividades(4, agora),
    estudosEmDestaque(agora),
    posts(undefined, 3),
    produtosEmDestaque(),
    prestacaoDeContas(),
    campanhaEmDestaque(),
  ]);

  return (
    <>
      <Secao className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-12 pt-16 pb-14">
        <div>
          <p className="text-green m-0 text-[13px] font-semibold tracking-[.14em]">
            CEAK · PENÁPOLIS – SP
          </p>
          <h1 className="mt-[18px] mb-5 font-serif text-[clamp(40px,5.4vw,66px)] leading-[1.04] font-medium tracking-[-.01em] text-balance">
            Centro Espírita Allan Kardec — Penápolis
          </h1>
          <p className="text-ink-3 mt-0 mb-[34px] text-[21px] leading-normal">
            Estudo, acolhimento, fraternidade e caridade.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/o-ceak"
              className={`${botaoHero} bg-green hover:bg-green-dark text-white hover:text-white`}
            >
              Conheça o CEAK
            </Link>
            {[
              ['Ver programação', '/agenda'],
              ['Quero ajudar', '/quero-ajudar'],
              ['Preciso de ajuda', '/preciso-de-ajuda'],
            ].map(([t, href]) => (
              <Link
                key={href}
                href={href!}
                className={`${botaoHero} border-line-3 text-ink hover:border-green border bg-white`}
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
        <ImagePlaceholder
          caption="foto da fachada ou do salão do CEAK"
          ratio="5/4"
          radius="hero"
          className="p-[18px] text-xs"
        />
      </Secao>

      {aoVivo ? (
        <Secao aria-label="Transmissão ao vivo">
          <div className="rounded-card-lg bg-green-dark text-bg flex flex-wrap items-center gap-5 px-7 py-[22px]">
            <p className="m-0 flex items-center gap-2.5 text-[13px] font-semibold tracking-[.12em]">
              <PontoAoVivo /> AO VIVO
            </p>
            <div className="min-w-[220px] flex-1">
              <p className="m-0 font-serif text-2xl">Estamos ao vivo</p>
              <p className="text-green-on-dark mt-0.5 mb-0 text-[15px]">
                {aoVivo.titulo} · {aoVivo.quem} ·{' '}
                {mesmoDia(aoVivo.inicio, agora) ? 'hoje' : aoVivo.diaSemana.toLowerCase()},{' '}
                {formatarHoraCurta(aoVivo.inicio)}
              </p>
            </div>
            <Link
              href="/lives"
              className="rounded-pill bg-bg text-green-dark inline-flex min-h-11 items-center px-[22px] py-3 text-[15px] font-semibold no-underline hover:bg-white hover:no-underline"
            >
              Assistir transmissão
            </Link>
          </div>
        </Secao>
      ) : null}

      <Secao className="pt-[72px]" aria-labelledby="proximas">
        <CabecalhoSecao
          id="proximas"
          titulo="Próximas atividades"
          link={{ href: '/agenda', texto: 'Ver agenda completa' }}
        />
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-0">
          {atividades.map((e) => (
            <li key={e.id}>
              <Link
                href={e.url}
                className="border-line text-ink hover:border-green flex h-full flex-col gap-3 rounded-[18px] border bg-white p-[22px] no-underline hover:no-underline"
              >
                <Categoria cor={e.cor}>{e.categoria}</Categoria>
                <span className="font-serif text-[22px] leading-[1.2]">{e.titulo}</span>
                <span className="text-ink-3 mt-auto text-[15px]">
                  {e.diaSemana} · {e.horario}
                </span>
                <span className="text-muted-2 text-[13px]">{e.local}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao className="pt-[72px]" aria-labelledby="estudos">
        <h2 id="estudos" className="m-0 mb-2 font-serif text-[clamp(30px,4vw,38px)] font-medium">
          Estudos
        </h2>
        <p className="text-muted m-0 mb-6 max-w-[620px] text-[17px]">
          Grupos abertos a todos. Não é preciso conhecimento prévio — basta vontade de aprender.
        </p>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-0">
          {estudos.map((c) => (
            <li
              key={c.slug}
              className="border-line flex flex-col gap-3.5 rounded-[18px] border bg-white p-6"
            >
              <p className="text-green m-0 text-xs font-semibold tracking-[.06em]">{c.tag}</p>
              <h3 className="m-0 font-serif text-[23px] leading-[1.2] font-normal">
                <Link href="/estudos" className="text-ink">
                  {c.nome}
                </Link>
              </h3>
              <p className="text-muted m-0 text-sm">{c.resumo}</p>
              <ProgressBar label={c.etapa} value={c.progresso} showLabel />
              <p className="border-line-soft m-0 border-t pt-3 text-sm">
                Próximo encontro:{' '}
                <strong className="font-semibold">
                  {c.proximo
                    ? `${formatarDiaSemanaData(c.proximo)} às ${formatarHoraCurta(c.proximo)}`
                    : 'a definir'}
                </strong>
              </p>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,520px),1fr))] gap-5 pt-[72px]">
        <div className="border-line rounded-hero border bg-white p-8">
          <h2 className="m-0 mb-1.5 font-serif text-[34px] font-medium">Quero ajudar</h2>
          <p className="text-muted m-0 mb-[22px] text-base">
            Conheça as formas de contribuir com o CEAK.
          </p>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2.5 p-0">
            {AJUDAR.map((h) => (
              <li key={h.t}>
                <Link
                  href={h.href}
                  className="rounded-card-sm border-line-warm bg-bg text-ink hover:border-green flex h-full flex-col gap-1 border p-4 text-[15px] font-medium no-underline hover:no-underline"
                >
                  <span>{h.t}</span>
                  <span className="text-muted-2 text-[13px] font-normal">{h.d}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-hero bg-green-soft p-8">
          <h2 className="m-0 mb-1.5 font-serif text-[34px] font-medium">Preciso de ajuda</h2>
          <p className="text-ink-3 m-0 mb-[22px] text-base">
            Atendimentos gratuitos, abertos a todos.
          </p>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2.5 p-0">
            {PRECISO.map((h) => (
              <li key={h.t}>
                <Link
                  href={h.href}
                  className="rounded-card-sm border-green-soft-line text-ink hover:border-green flex h-full border bg-white p-4 text-[15px] font-medium no-underline hover:no-underline"
                >
                  {h.t}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Secao>

      <Secao className="pt-[72px]" aria-labelledby="blog">
        <CabecalhoSecao
          id="blog"
          titulo="Notícias e blog"
          link={{ href: '/blog', texto: 'Ver todas' }}
        />
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 p-0">
          {artigos.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="text-ink flex flex-col gap-3 no-underline hover:no-underline"
              >
                <ImagePlaceholder caption={p.foto} />
                <span className="text-muted-2 text-[13px]">
                  {formatarDataCurta(p.publicadoEm)} · {p.categoria}
                </span>
                <span className="font-serif text-[22px] leading-[1.25] hover:underline">
                  {p.titulo}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao className="pt-[72px]" aria-labelledby="loja">
        <CabecalhoSecao
          id="loja"
          titulo="Loja solidária"
          descricao="Toda a renda é revertida para a assistência social do CEAK."
          link={{ href: '/loja', texto: 'Ver loja' }}
        />
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 p-0">
          {loja.map((p) => (
            <li key={p.id}>
              <Link
                href={`/loja/${p.slug}`}
                className="text-ink flex flex-col gap-2 no-underline hover:no-underline"
              >
                <ImagePlaceholder caption="foto do produto" ratio="1" />
                <span className="text-[15px] font-medium">{p.nome}</span>
                <span className="text-green text-[15px] font-semibold">{p.preco}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Secao>

      {contas ? (
        <Secao className="pt-[72px] pb-20" aria-labelledby="transparencia">
          <div className="rounded-hero bg-beige grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] items-start gap-7 p-9">
            <div>
              <h2
                id="transparencia"
                className="text-green m-0 text-[13px] font-semibold tracking-[.12em]"
              >
                TRANSPARÊNCIA
              </h2>
              <p className="mt-2 mb-0 font-serif text-[28px] leading-[1.2]">
                {formatarMesAno(contas.mes)}
              </p>
              <Link
                href="/transparencia"
                className="text-green mt-2.5 inline-flex min-h-11 items-center text-sm font-semibold"
              >
                Ver prestação de contas <span aria-hidden="true">&nbsp;→</span>
              </Link>
            </div>
            <div>
              <p className="m-0 font-serif text-[40px]">{contas.doacoes}</p>
              <p className="text-ink-3 m-0 text-[15px]">recebidos em doações</p>
            </div>
            {contas.impacto[0] ? (
              <div>
                <p className="m-0 font-serif text-[40px]">{contas.impacto[0].valor}</p>
                <p className="text-ink-3 m-0 text-[15px]">
                  {contas.impacto[0].rotuloResumo ?? contas.impacto[0].rotulo}
                </p>
              </div>
            ) : null}
            {campanha ? (
              <div>
                <p className="m-0 font-serif text-[40px]">
                  {campanha.arrecadado} / {campanha.meta.split(' ')[0]}
                </p>
                <p className="text-ink-3 m-0 text-[15px]">
                  {campanha.meta.split(' ').slice(1).join(' ')} na {campanha.titulo}
                </p>
                <div
                  role="progressbar"
                  aria-label={campanha.titulo}
                  aria-valuenow={campanha.percentual}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-2.5 h-1.5 rounded-[9px] bg-white"
                >
                  <div
                    className="bg-green h-1.5 rounded-[9px]"
                    style={{ width: `${campanha.percentual}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </Secao>
      ) : (
        <div className="pb-20" />
      )}
    </>
  );
}
