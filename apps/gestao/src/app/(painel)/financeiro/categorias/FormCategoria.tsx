'use client';

import { useActionState } from 'react';
import { salvarCategoria, type EstadoCategoria } from './actions';

export function FormCategoria() {
  const [estado, executar, pendente] = useActionState(salvarCategoria, {} as EstadoCategoria);
  return (
    <form
      action={executar}
      className="border-line flex flex-col gap-3 rounded-xl border bg-white p-4"
    >
      <h3 className="m-0 text-lg font-semibold">Cadastrar categoria</h3>
      <p className="text-muted-2 m-0 text-sm">
        Preencha apenas categorias reais do CEAK. Não é necessário cadastrar contas bancárias.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nome
          <input
            name="nome"
            required
            minLength={2}
            maxLength={80}
            placeholder="Informe o nome da categoria"
            className="border-line-admin rounded-lg border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tipo
          <select
            name="tipo"
            required
            defaultValue="RECEBER"
            className="border-line-admin rounded-lg border px-3 py-2"
          >
            <option value="RECEBER">Receita</option>
            <option value="PAGAR">Despesa</option>
          </select>
        </label>
      </div>
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
      <div>
        <button
          type="submit"
          disabled={pendente}
          className="bg-green rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pendente ? 'Salvando…' : 'Cadastrar categoria'}
        </button>
      </div>
    </form>
  );
}
