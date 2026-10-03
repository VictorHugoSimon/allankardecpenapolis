import type { Metadata } from 'next';
import { prisma } from '@ceak/db';
import { Tela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';
import { BotaoPreInscricao } from './BotaoPreInscricao';

export const metadata: Metadata = { title: 'Inscrever-se em um estudo' };
export const dynamic = 'force-dynamic';

export default async function InscreverPage() {
  const s = await exigirSessao();
  const [cursos, minhas] = await Promise.all([
    prisma.curso.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
      select: {
        slug: true,
        nome: true,
        publico: true,
        encontros: true,
        statusInscricao: true,
        descricao: true,
      },
    }),
    prisma.inscricao.findMany({
      where: { pessoaId: s.pessoaId, cursoId: { not: null } },
      select: { curso: { select: { slug: true } } },
    }),
  ]);
  const inscrito = new Set(minhas.map((m) => m.curso?.slug));
  return (
    <Tela titulo="Novo estudo" voltar="/estudos">
      <div className="flex flex-col gap-3">
        <p className="text-muted m-0 text-sm leading-normal">
          Faça a pré-inscrição com os dados da sua conta. A secretaria confirma pelo WhatsApp.
        </p>
        {cursos.map((c) => (
          <section
            key={c.slug}
            aria-labelledby={`curso-${c.slug}`}
            className="border-line flex flex-col gap-2 rounded-[20px] border bg-white p-[18px]"
          >
            <h2
              id={`curso-${c.slug}`}
              className="m-0 font-serif text-[22px] leading-tight font-normal"
            >
              {c.nome}
            </h2>
            {c.descricao ? (
              <p className="text-ink-2 m-0 text-sm leading-normal">{c.descricao}</p>
            ) : null}
            <p className="text-muted-2 m-0 text-[13px]">
              {[c.publico, c.encontros, c.statusInscricao].filter(Boolean).join(' · ')}
            </p>
            <BotaoPreInscricao curso={c.slug} nome={c.nome} jaInscrito={inscrito.has(c.slug)} />
          </section>
        ))}
      </div>
    </Tela>
  );
}
