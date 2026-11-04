import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { opcoesMatriculaManual } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { FormMatricula } from './FormMatricula';

export const metadata: Metadata = { title: 'Matricular participante' };
export const dynamic = 'force-dynamic';
export default async function MatricularPage() {
  const sessao = await exigirModulo('estudos');
  if (!['ADMINISTRADOR', 'DIRETORIA', 'COORDENADOR'].includes(sessao.perfil))
    redirect('/sem-acesso?modulo=estudos');
  const dados = await opcoesMatriculaManual(contextoRls(sessao));
  return (
    <div className="flex flex-col gap-4">
      <Link href="/estudos" className="text-green-dark text-sm underline">
        Voltar a Estudos
      </Link>
      <h1 className="m-0 font-serif text-[28px]">Matrículas</h1>
      <FormMatricula
        turmas={dados.turmas.map((t) => ({ id: t.id, nome: `${t.curso.nome} · ${t.nome}` }))}
        pessoas={dados.pessoas}
      />
      <p className="text-muted-2 text-xs">
        Lista de participantes limitada aos 200 primeiros cadastros ativos. A pesquisa paginada será
        implementada em uma próxima etapa.
      </p>
    </div>
  );
}
