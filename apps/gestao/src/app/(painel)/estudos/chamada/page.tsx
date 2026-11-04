import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { quadroPresencas } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { FormNovaAula, FormChamada } from './FormChamada';

export const metadata: Metadata = { title: 'Chamada de presença' };
export const dynamic = 'force-dynamic';

export default async function PaginaChamada({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string }>;
}) {
  const s = await exigirModulo('estudos');
  const { turma } = await searchParams;
  if (!turma || !/^[0-9a-f-]{36}$/i.test(turma)) redirect('/estudos');
  const dados = await quadroPresencas({ ...contextoRls(s), usuarioId: s.usuarioId }, turma);
  return (
    <div className="flex max-w-[920px] flex-col gap-4">
      <Link href={`/estudos?turma=${turma}`} className="text-green-dark text-sm underline">
        Voltar à turma
      </Link>
      <h1 className="m-0 font-serif text-[28px]">
        Presenças — {dados.turma.curso.nome} · {dados.turma.nome}
      </h1>
      <p className="text-muted-2 m-0 text-sm">
        Nenhuma presença é presumida. Na chamada, alunos desmarcados são registrados como ausentes
        depois de sua confirmação.
      </p>
      <FormNovaAula turmaId={turma} />
      <FormChamada aulas={dados.aulas} alunos={dados.alunos} />
    </div>
  );
}
