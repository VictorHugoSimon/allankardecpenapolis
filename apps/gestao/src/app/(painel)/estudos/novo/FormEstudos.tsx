'use client';
import { useActionState } from 'react';
import { salvarCurso, salvarTurma, type EstadoEstudos } from './actions';
const campo = 'border-line-admin rounded-lg border px-3 py-2';
export function FormCurso() {
 const [e,action,pending] = useActionState(salvarCurso,{} as EstadoEstudos);
 return <form action={action} className="border-line flex flex-col gap-3 rounded-xl border bg-white p-5">
  <h2 className="m-0 text-lg font-semibold">Cadastrar curso</h2>
  <p className="text-muted-2 m-0 text-sm">Novo curso começa privado, sem divulgação nem inscrições abertas.</p>
  <label className="flex flex-col gap-1 text-sm">Nome do curso *<input name="nome" required minLength={3} maxLength={140} className={campo}/></label>
  <label className="flex flex-col gap-1 text-sm">Sigla (opcional)<input name="sigla" maxLength={24} className={campo}/></label>
  <label className="flex flex-col gap-1 text-sm">Descrição (opcional)<textarea name="descricao" maxLength={2000} rows={3} className={campo}/></label>
  {e.erro && <p role="alert" className="text-danger">{e.erro}</p>}
  {e.sucesso && <p role="status" className="text-green-dark">{e.sucesso}</p>}
  <button type="submit" disabled={pending} className="bg-green self-start rounded-lg px-4 py-2 text-sm text-white disabled:opacity-60">{pending?'Salvando…':'Cadastrar curso'}</button>
 </form>;
}
export function FormTurma({cursos}:{cursos:{id:string;nome:string}[]}) {
 const [e,action,pending]=useActionState(salvarTurma,{} as EstadoEstudos);
 return <form action={action} className="border-line flex flex-col gap-3 rounded-xl border bg-white p-5">
  <h2 className="m-0 text-lg font-semibold">Cadastrar turma</h2>
  {cursos.length===0 ? <p role="status" className="text-muted-2">Cadastre primeiro um curso real.</p> : <>
   <label className="flex flex-col gap-1 text-sm">Curso *<select name="cursoId" required defaultValue="" className={campo}><option value="" disabled>Selecione</option>{cursos.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
   <label className="flex flex-col gap-1 text-sm">Turma *<input name="nome" required minLength={2} maxLength={100} className={campo}/></label>
   <label className="flex flex-col gap-1 text-sm">Dias e horários reais *<input name="encontros" required minLength={3} maxLength={140} className={campo}/></label>
   <p className="text-muted-2 m-0 text-xs">A turma começa sem alunos matriculados ou instrutor atribuído.</p>
   {e.erro && <p role="alert" className="text-danger">{e.erro}</p>}
   {e.sucesso && <p role="status" className="text-green-dark">{e.sucesso}</p>}
   <button type="submit" disabled={pending} className="bg-green self-start rounded-lg px-4 py-2 text-sm text-white disabled:opacity-60">{pending?'Salvando…':'Cadastrar turma'}</button>
  </>}
 </form>;
}
