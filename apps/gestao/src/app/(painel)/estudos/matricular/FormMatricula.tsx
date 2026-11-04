'use client';
import { useActionState } from 'react';
import { salvarMatricula, type EstadoMatricula } from './actions';

type Opcao = { id: string; nome: string };
export function FormMatricula({ turmas, pessoas }: { turmas: Opcao[]; pessoas: Opcao[] }) {
  const [estado, action, pending] = useActionState(salvarMatricula, {} as EstadoMatricula);
  const habilitado = turmas.length > 0 && pessoas.length > 0;
  return (
    <form
      action={action}
      className="border-line flex max-w-[720px] flex-col gap-4 rounded-xl border bg-white p-5"
    >
      <h2 className="m-0 text-lg font-semibold">Matricular participante</h2>
      <p className="text-muted-2 m-0 text-sm">
        Utilize exclusivamente pessoas e turmas cadastradas. Nenhum aluno de exemplo será incluído.
      </p>
      {turmas.length === 0 && (
        <p role="status" className="text-muted-2 text-sm">
          Cadastre primeiro uma turma ativa.
        </p>
      )}
      {pessoas.length === 0 && (
        <p role="status" className="text-muted-2 text-sm">
          Cadastre primeiro uma pessoa real no módulo Pessoas.
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Turma
        <select
          name="turmaId"
          required
          defaultValue=""
          disabled={!habilitado}
          className="border-line-admin rounded-lg border px-3 py-2"
        >
          <option value="" disabled>
            Selecione a turma
          </option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Participante
        <select
          name="pessoaId"
          required
          defaultValue=""
          disabled={!habilitado}
          className="border-line-admin rounded-lg border px-3 py-2"
        >
          <option value="" disabled>
            Selecione a pessoa
          </option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      {estado.erro && (
        <p role="alert" className="text-danger m-0 text-sm">
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p role="status" className="text-green-dark m-0 text-sm">
          {estado.sucesso}
        </p>
      )}
      <button
        type="submit"
        disabled={!habilitado || pending}
        className="bg-green self-start rounded-lg px-4 py-2 text-white disabled:opacity-60"
      >
        {pending ? 'Registrando…' : 'Confirmar matrícula'}
      </button>
    </form>
  );
}
