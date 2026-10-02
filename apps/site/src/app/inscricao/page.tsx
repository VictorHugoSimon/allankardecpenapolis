import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@ceak/db';
import { LogoMark } from '@ceak/ui';
import { Secao } from '@/components/Elementos';
import { Sucesso } from '@/components/Sucesso';
import { eventoPorSlug } from '@/lib/dados';
import { appUrl } from '@/lib/urls';
import { FormInscricao } from './FormInscricao';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inscrição',
  robots: { index: false },
};

export default async function InscricaoPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string; curso?: string }>;
}) {
  const { evento: slugEvento, curso: slugCurso } = await searchParams;
  const evento = slugEvento ? await eventoPorSlug(slugEvento) : null;
  const curso =
    !evento && slugCurso
      ? await prisma.curso.findFirst({
          where: { slug: slugCurso, ativo: true },
          select: { slug: true, nome: true, encontros: true },
        })
      : null;

  if (!evento && !curso) {
    return (
      <Secao estreita={640} className="pt-16 pb-20">
        <h1 className="m-0 mb-3 font-serif text-[42px] font-medium">Inscrição na atividade</h1>
        <p className="text-muted m-0 mb-6 text-[17px]">
          Escolha uma atividade na agenda ou um estudo para se inscrever.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/agenda"
            className="rounded-pill bg-green inline-flex min-h-11 items-center px-5 text-white no-underline hover:text-white"
          >
            Ver agenda
          </Link>
          <Link
            href="/estudos"
            className="rounded-pill border-line-3 text-ink inline-flex min-h-11 items-center border bg-white px-5 no-underline"
          >
            Ver estudos
          </Link>
        </div>
      </Secao>
    );
  }

  const nome = evento ? evento.titulo : curso!.nome;
  const detalhe = evento
    ? `${evento.diaSemana}, ${evento.dia} de ${evento.mesLongo} · ${evento.horario} · ${evento.local}`
    : (curso!.encontros ?? '');

  const sucesso = (
    <Sucesso titulo="Inscrição confirmada">
      <p className="text-muted m-0 max-w-[440px] text-[17px] leading-[1.6]">
        Enviamos os detalhes para o seu WhatsApp.{' '}
        {evento
          ? 'Apresente-se na recepção no dia da atividade.'
          : 'A coordenação entrará em contato para indicar a turma.'}
      </p>
      <div className="border-line rounded-card-lg mt-5 grid w-full grid-cols-[96px_minmax(0,1fr)] items-center gap-5 border bg-white p-7 text-left max-[480px]:grid-cols-1">
        <LogoMark size={96} className="rounded-[22px]" />
        <div>
          <h2 className="m-0 font-serif text-2xl font-normal">Instale o CEAK App</h2>
          <p className="text-muted mt-1.5 mb-3.5 text-[15px] leading-normal">
            Agenda, check-in, estudos e avisos da casa no seu celular. Não ocupa espaço da loja de
            aplicativos.
          </p>
          <a
            href={appUrl()}
            className="rounded-pill bg-green hover:bg-green-dark inline-flex min-h-11 items-center px-5 py-[11px] text-[15px] font-medium text-white no-underline hover:text-white hover:no-underline"
          >
            Abrir o CEAK App
          </a>
        </div>
      </div>
    </Sucesso>
  );

  return (
    <Secao estreita={640} className="pt-16 pb-20">
      <FormInscricao
        evento={evento?.slug}
        curso={curso?.slug}
        sucesso={sucesso}
        cabecalho={
          <>
            <p className="text-muted-2 m-0 text-sm">Inscrição · {nome}</p>
            <h1 className="mt-2.5 mb-2 font-serif text-[42px] font-medium">
              {evento ? 'Inscrição na atividade' : 'Inscrição no estudo'}
            </h1>
            <p className="text-muted m-0 mb-7 text-[17px]">{detalhe}</p>
          </>
        }
      />
    </Secao>
  );
}
