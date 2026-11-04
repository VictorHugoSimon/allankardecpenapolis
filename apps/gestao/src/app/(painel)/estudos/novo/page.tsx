import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cursosParaGestao } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { FormCurso, FormTurma } from './FormEstudos';

export const metadata: Metadata = {title:'Cadastrar cursos e turmas'};
export const dynamic = 'force-dynamic';
export default async function NovosEstudosPage() {
 const s=await exigirModulo('estudos');
 if(!['ADMINISTRADOR','DIRETORIA','COORDENADOR'].includes(s.perfil)) redirect('/sem-acesso?modulo=estudos');
 const cursos=await cursosParaGestao();
 return <div className="flex max-w-[940px] flex-col gap-4">
  <Link href="/estudos" className="text-green-dark text-sm underline">Voltar a Estudos</Link>
  <h1 className="m-0 font-serif text-[28px]">Primeiros cursos e turmas</h1>
  <p className="text-muted-2 m-0 text-sm">Comece com informações reais. Nenhum curso, turma, inscrição ou aluno de exemplo será incluído.</p>
  <FormCurso/>
  <FormTurma cursos={cursos.map(c=>({id:c.id,nome:c.nome}))}/>
  <div className="border-line rounded-xl border bg-white p-4">
   <h2 className="m-0 mb-3 text-base font-semibold">Cursos cadastrados ({cursos.length})</h2>
   {cursos.length===0 ? <p className="text-muted-2 text-sm">Nenhum curso cadastrado ainda.</p> :
    <ul className="m-0 flex flex-col gap-2 pl-5 text-sm">{cursos.map(c=><li key={c.id}>{c.nome} — {c._count.turmas} turma(s) — {c.ativo?'Ativo':'Privado'}</li>)}</ul>}
  </div>
 </div>;
}
