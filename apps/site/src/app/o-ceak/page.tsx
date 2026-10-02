import type { Metadata } from 'next';
import { instituicao } from '@ceak/core';
import { ImagePlaceholder } from '@ceak/ui';
import { Secao } from '@/components/Elementos';

export const metadata: Metadata = {
  title: 'O CEAK',
  description:
    'Mais de seis décadas dedicadas ao estudo e à caridade em Penápolis: história, missão, valores, estrutura e diretoria do Centro Espírita Allan Kardec.',
  alternates: { canonical: '/o-ceak' },
};

const BLOCOS = [
  [
    'Missão',
    'Divulgar e vivenciar a Doutrina Espírita por meio do estudo, do acolhimento fraterno e da prática da caridade.',
  ],
  [
    'Valores',
    'Fraternidade, humildade, estudo, respeito à diversidade, trabalho voluntário e transparência.',
  ],
  [
    'Estrutura',
    'Salão de palestras para 220 pessoas, 4 salas de estudo, biblioteca, sala de passe, bazar e cozinha da assistência social.',
  ],
];

export default function OCeakPage() {
  return (
    <>
      <Secao estreita={1040} className="pt-16 pb-6">
        <p className="text-green m-0 text-[13px] font-semibold tracking-[.14em]">O CEAK</p>
        <h1 className="mt-3.5 mb-6 font-serif text-[clamp(38px,5vw,56px)] leading-[1.08] font-medium text-balance">
          Mais de seis décadas dedicadas ao estudo e à caridade em Penápolis
        </h1>
        <p className="text-ink-2 m-0 max-w-[760px] text-[19px] leading-[1.65]">
          O Centro Espírita Allan Kardec foi fundado em {instituicao.fundacao} por um pequeno grupo
          que se reunia para estudar as obras básicas da Doutrina Espírita. Desde então, a casa
          cresceu sem perder o que a originou: o estudo sério, o acolhimento a quem chega e o
          trabalho voluntário em favor de quem precisa.
        </p>
      </Secao>
      <Secao
        estreita={1040}
        className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 py-8"
      >
        {BLOCOS.map(([t, d]) => (
          <div key={t} className="border-line rounded-[18px] border bg-white p-[26px]">
            <h2 className="m-0 mb-2.5 font-serif text-2xl font-normal">{t}</h2>
            <p className="text-ink-3 m-0 text-base leading-[1.6]">{d}</p>
          </div>
        ))}
      </Secao>
      <Secao estreita={1040} className="py-10" aria-labelledby="linha">
        <h2 id="linha" className="m-0 mb-7 font-serif text-[34px] font-medium">
          Linha do tempo
        </h2>
        <ol className="m-0 flex list-none flex-col p-0">
          {instituicao.linhaDoTempo.map((t, i) => (
            <li key={t.ano} className="grid grid-cols-[88px_24px_minmax(0,1fr)] gap-4">
              <span className="text-green pb-7 font-serif text-[26px]">{t.ano}</span>
              <span aria-hidden="true" className="flex flex-col items-center">
                <span className="bg-green mt-2.5 size-3 rounded-full" />
                {i < instituicao.linhaDoTempo.length - 1 ? (
                  <span className="bg-line-2 w-px flex-1" />
                ) : null}
              </span>
              <div className="pb-7">
                <h3 className="mt-1 mb-0 text-lg font-semibold">{t.titulo}</h3>
                <p className="text-muted mt-1 mb-0 text-[15px] leading-[1.55]">{t.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </Secao>
      <Secao estreita={1040} className="pt-6 pb-20" aria-labelledby="diretoria">
        <h2 id="diretoria" className="m-0 mb-6 font-serif text-[34px] font-medium">
          Diretoria 2025–2027
        </h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 p-0">
          {instituicao.diretoria.map((b) => (
            <li key={b.nome} className="flex flex-col gap-2 text-center">
              <ImagePlaceholder
                caption="foto"
                ratio="1"
                radius="full"
                className="justify-center text-center"
              />
              <span className="text-base font-semibold">{b.nome}</span>
              <span className="text-muted text-sm">{b.cargo}</span>
            </li>
          ))}
        </ul>
      </Secao>
    </>
  );
}
