import type { Metadata } from 'next';
import Link from 'next/link';
import { Secao, Subtitulo, TituloPagina } from '@/components/Elementos';
import { cursos } from '@/lib/dados';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Estudos',
  description:
    'Grupos de estudo gratuitos para todas as idades: ESDE, Estudo do Evangelho, educação mediúnica, Mocidade e evangelização infantil.',
  alternates: { canonical: '/estudos' },
};

const PASSOS = [
  ['Inscrição', 'Pelo site, pelo CEAK App ou na recepção.'],
  ['Acolhimento', 'A coordenação entra em contato e indica a turma adequada.'],
  ['Acompanhamento', 'Materiais, presença e progresso ficam disponíveis no app.'],
];

export default async function EstudosPage() {
  const lista = await cursos();
  return (
    <Secao className="pt-14 pb-20">
      <TituloPagina>Estudos</TituloPagina>
      <Subtitulo>
        A casa oferece grupos de estudo para todas as idades. Todos são gratuitos. Não é preciso
        conhecimento prévio.
      </Subtitulo>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4 p-0">
        {lista.map((p) => (
          <li
            key={p.slug}
            className="border-line flex flex-col gap-2.5 rounded-[18px] border bg-white p-6"
          >
            {p.statusInscricao ? (
              <span className="rounded-pill bg-green-soft text-green-dark self-start px-2.5 py-1 text-xs font-semibold">
                {p.statusInscricao}
              </span>
            ) : null}
            <h2 className="m-0 font-serif text-2xl leading-[1.2] font-normal">{p.nome}</h2>
            <p className="text-ink-3 m-0 text-[15px] leading-[1.55]">{p.descricao}</p>
            <dl className="border-line-soft mt-auto mb-0 grid grid-cols-[90px_minmax(0,1fr)] gap-1.5 border-t pt-3 text-sm">
              <dt className="text-muted-2">Público</dt>
              <dd className="m-0">{p.publico}</dd>
              <dt className="text-muted-2">Encontros</dt>
              <dd className="m-0">{p.encontros}</dd>
              <dt className="text-muted-2">Duração</dt>
              <dd className="m-0">{p.duracao}</dd>
            </dl>
            <Link
              href={`/inscricao?curso=${p.slug}`}
              className="rounded-pill bg-green hover:bg-green-dark mt-1.5 min-h-11 p-3 text-center text-[15px] text-white no-underline hover:text-white hover:no-underline"
            >
              Quero participar<span className="sr-only"> de {p.nome}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="bg-beige mt-10 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 rounded-[22px] p-8">
        <h2 className="m-0 font-serif text-[28px] font-normal">Como funciona</h2>
        <ol className="contents">
          {PASSOS.map(([t, d], i) => (
            <li key={t} className="list-none">
              <span className="text-green font-serif text-[22px]">{i + 1}</span>
              <h3 className="my-1 text-base font-semibold">{t}</h3>
              <p className="text-ink-3 m-0 text-sm leading-normal">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </Secao>
  );
}
