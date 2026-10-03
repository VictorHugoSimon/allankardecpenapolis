import Link from 'next/link';
import type { Metadata } from 'next';
import { painelEstudos } from '@ceak/db';
import { Pill, Table } from '@ceak/ui';
import { Indicadores, TituloPagina, Vazio } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';
import { numero } from '@/lib/formato';
import { instrutorRestrito } from '@/lib/servidor';

export const metadata: Metadata = { title: 'Estudos e cursos' };
export const dynamic = 'force-dynamic';

export default async function EstudosPage({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string }>;
}) {
  const s = await exigirModulo('estudos');
  const { turma } = await searchParams;
  const instrutorId = instrutorRestrito(s);
  const e = await painelEstudos({ turmaId: turma, instrutorId });
  const k = e.kpis;
  return (
    <div className="flex flex-col gap-[18px]">
      <TituloPagina sub={instrutorId ? 'Suas turmas' : undefined}>Estudos e cursos</TituloPagina>
      <Indicadores
        tamanho={28}
        itens={[
          { rotulo: 'Alunos', valor: numero(k.alunos) },
          { rotulo: 'Turmas ativas', valor: numero(k.turmasAtivas) },
          {
            rotulo: 'Frequência média',
            valor: k.frequenciaMedia === null ? '—' : `${k.frequenciaMedia}%`,
          },
          { rotulo: 'Evasão', valor: `${k.evasao}%`, tom: k.evasao >= 10 ? 'erro' : undefined },
          { rotulo: 'Pré-inscrições', valor: numero(k.preInscricoes) },
        ]}
      />
      <Table
        caption="Turmas"
        rows={e.turmas}
        rowKey={(t) => t.id}
        selectedKey={e.selecionada?.id}
        empty="Nenhuma turma."
        columns={[
          { key: 'curso', header: 'Curso', cell: (t) => t.curso },
          {
            key: 'turma',
            header: 'Turma',
            cell: (t) => (
              <Link
                href={`/estudos?turma=${t.id}`}
                scroll={false}
                aria-current={t.id === e.selecionada?.id ? 'true' : undefined}
              >
                {t.turma}
              </Link>
            ),
          },
          { key: 'instrutor', header: 'Instrutor', cell: (t) => t.instrutor },
          { key: 'encontros', header: 'Encontros', cell: (t) => t.encontros },
          { key: 'alunos', header: 'Alunos', cell: (t) => t.alunos },
          { key: 'freq', header: 'Frequência', cell: (t) => t.frequencia },
          { key: 'prog', header: 'Progresso', cell: (t) => t.progresso },
          { key: 'status', header: 'Status', cell: (t) => <Pill tone={t.tom}>{t.status}</Pill> },
        ]}
      />
      {e.selecionada ? (
        <section
          aria-labelledby="turma-sel"
          className="border-line rounded-card flex flex-col gap-3 border bg-white p-5"
        >
          <div>
            <h2 id="turma-sel" className="m-0 text-[15px] font-semibold">
              {e.selecionada.titulo}
            </h2>
            <p className="text-muted-2 m-0 text-xs">
              {e.selecionada.detalhe} · escolha outra turma na tabela acima
            </p>
          </div>
          <Table
            caption={`Alunos de ${e.selecionada.titulo}`}
            rows={e.selecionada.alunos}
            rowKey={(a) => a.id}
            empty="Nenhum aluno matriculado."
            className="min-w-0"
            columns={[
              {
                key: 'nome',
                header: 'Aluno',
                cell: (a) => (
                  <Link href={`/pessoas/${a.id}`} className="text-ink">
                    {a.nome}
                  </Link>
                ),
              },
              { key: 'freq', header: 'Frequência', cell: (a) => a.frequencia },
              { key: 'pres', header: 'Presenças', cell: (a) => a.presencas },
              {
                key: 'status',
                header: 'Status',
                cell: (a) => <Pill tone={a.tom}>{a.status}</Pill>,
              },
            ]}
          />
        </section>
      ) : (
        <Vazio>Nenhuma turma para mostrar.</Vazio>
      )}
    </div>
  );
}
