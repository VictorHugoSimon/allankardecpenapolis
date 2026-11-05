'use client';

import { useActionState } from 'react';
import type { ProgramacaoSemanal } from '@ceak/db';
import { salvarAgendaSemanal } from './actions';

const dias: (keyof ProgramacaoSemanal)[] = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export function FormProgramacao({ atual }: { atual: ProgramacaoSemanal }) {
  const [estado, acao, pendente] = useActionState(salvarAgendaSemanal, {});
  return (
    <form
      action={acao}
      className="border-line rounded-card mt-4 flex flex-col gap-4 border bg-white p-5"
    >
      <h2 className="m-0 font-serif text-xl">Programação semanal confirmada</h2>
      <p className="text-muted-2 m-0 text-sm">
        Informe somente horários e atividades oficiais. Dias em branco não serão publicados.
        Eventos com datas específicas continuam sendo cadastrados na Agenda.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        {dias.map((dia) => (
          <label key={dia} className="flex flex-col gap-1 text-sm font-medium">
            {dia}
            <input
              className="border-line-admin rounded-lg border px-3 py-2 font-normal"
              name={dia}
              type="text"
              maxLength={160}
              defaultValue={atual[dia]}
              placeholder="Sem programação confirmada"
            />
          </label>
        ))}
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
      <button
        type="submit"
        disabled={pendente}
        className="bg-green self-start rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {pendente ? 'Salvando…' : 'Salvar programação semanal'}
      </button>
    </form>
  );
}
