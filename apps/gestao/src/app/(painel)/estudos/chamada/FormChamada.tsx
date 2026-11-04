'use client';

import { useActionState, useState, useTransition } from 'react';
import { salvarAula, salvarChamada, type EstadoChamada } from './actions';

type Aula = { id: string; numero: number; titulo: string; data: Date; presencas: { pessoaId: string; presente: boolean }[] };
type Aluno = { id: string; nome: string };

export function FormNovaAula({ turmaId }: { turmaId: string }) {
  const [estado, action, pending] = useActionState(salvarAula, {} as EstadoChamada);
  return <form action={action} className="border-line flex flex-col gap-3 rounded-xl border bg-white p-4">
    <h2 className="m-0 text-lg font-semibold">Cadastrar uma aula real</h2>
    <input type="hidden" name="turmaId" value={turmaId} />
    <label className="flex flex-col gap-1 text-sm">Número da aula
      <input name="numero" type="number" min={1} max={1000} required className="border-line-admin rounded-lg border px-3 py-2" />
    </label>
    <label className="flex flex-col gap-1 text-sm">Título
      <input name="titulo" required minLength={3} maxLength={140} className="border-line-admin rounded-lg border px-3 py-2" />
    </label>
    <label className="flex flex-col gap-1 text-sm">Data da aula
      <input name="data" type="date" required className="border-line-admin rounded-lg border px-3 py-2" />
    </label>
    {estado.erro && <p role="alert" className="text-danger text-sm">{estado.erro}</p>}
    {estado.sucesso && <p role="status" className="text-green-dark text-sm">{estado.sucesso}</p>}
    <button disabled={pending} className="bg-green self-start rounded-lg px-4 py-2 text-sm text-white disabled:opacity-60">
      {pending ? 'Salvando…' : 'Criar aula'}
    </button>
  </form>;
}

export function FormChamada({ aulas, alunos }: { aulas: Aula[]; alunos: Aluno[] }) {
  const [aulaId, setAulaId] = useState(aulas.find(a => a.presencas.length === 0)?.id ?? aulas[0]?.id ?? '');
  const [presentes, setPresentes] = useState<Record<string, boolean>>({});
  const [pending, iniciar] = useTransition();
  const [mensagem, setMensagem] = useState('');
  const aula = aulas.find(a => a.id === aulaId);
  const registrada = !!aula?.presencas.length;
  return <section className="border-line flex flex-col gap-4 rounded-xl border bg-white p-4">
    <h2 className="m-0 text-lg font-semibold">Chamada da turma</h2>
    {aulas.length === 0 && <p className="text-muted-2 text-sm">Cadastre a primeira aula para abrir uma chamada.</p>}
    {alunos.length === 0 && <p className="text-muted-2 text-sm">Matricule participantes reais antes de registrar presença.</p>}
    {aulas.length > 0 && <label className="flex flex-col gap-1 text-sm">Aula
      <select value={aulaId} onChange={e => { setAulaId(e.target.value); setPresentes({}); setMensagem(''); }}
        className="border-line-admin rounded-lg border px-3 py-2">
        {aulas.map(a => <option key={a.id} value={a.id}>Aula {a.numero} — {a.titulo}</option>)}
      </select>
    </label>}
    {registrada && <p role="status" className="text-muted-2 text-sm">
      Chamada já registrada. {aula!.presencas.filter(p => p.presente).length} presentes e {aula!.presencas.filter(p => !p.presente).length} faltas.
      Alterações posteriores exigem revisão administrativa.
    </p>}
    {aula && alunos.length > 0 && <div className="flex flex-col gap-2">
      {alunos.map(aluno => <label key={aluno.id} className="border-line-soft flex items-center gap-3 border-b py-2 text-sm">
        <input type="checkbox" disabled={registrada || pending}
          checked={registrada
            ? (aula.presencas.find(p => p.pessoaId === aluno.id)?.presente ?? false)
            : (presentes[aluno.id] ?? false)}
          onChange={e => setPresentes(prev => ({ ...prev, [aluno.id]: e.target.checked }))} />
        <span>{aluno.nome}</span>
      </label>)}
    </div>}
    {!registrada && aula && alunos.length > 0 && <button type="button" disabled={pending}
      onClick={() => {
        if (!window.confirm('Confirmar presença e falta de todos os alunos nesta aula? O registro será auditado.')) return;
        iniciar(async () => {
          try {
            const r = await salvarChamada(aula.id, alunos.map(p => ({ pessoaId: p.id, presente: presentes[p.id] ?? false })));
            setMensagem(r.mensagem);
          } catch {
            setMensagem('Falha ao registrar. Atualize a página e tente novamente.');
          }
        });
      }} className="bg-green self-start rounded-lg px-4 py-2 text-sm text-white disabled:opacity-60">
      {pending ? 'Registrando…' : 'Registrar chamada'}
    </button>}
    {mensagem && <p role="status" className="text-sm">{mensagem}</p>}
  </section>;
}
