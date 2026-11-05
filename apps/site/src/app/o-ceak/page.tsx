import type { Metadata } from 'next';
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
    'As informações oficiais sobre os espaços e as atividades serão disponibilizadas pela equipe do Centro.',
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
          O Centro Espírita Allan Kardec é um espaço de estudo, acolhimento e trabalho fraterno em
          Penápolis. As informações históricas estão em atualização e serão divulgadas depois da
          confirmação pela equipe responsável.
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
        <h2 id="linha" className="m-0 mb-3 font-serif text-[34px] font-medium">
          Linha do tempo
        </h2>
        <p className="text-muted-2 text-sm">
          O histórico oficial está em preparação. Nenhuma data ou acontecimento de demonstração
          será divulgado como informação confirmada.
        </p>
      </Secao>
      <Secao estreita={1040} className="pt-6 pb-20" aria-labelledby="diretoria">
        <h2 id="diretoria" className="m-0 mb-3 font-serif text-[34px] font-medium">
          Diretoria
        </h2>
        <p className="text-muted-2 text-sm">
          Os nomes e cargos da diretoria serão apresentados após a confirmação institucional.
        </p>
      </Secao>
    </>
  );
}
