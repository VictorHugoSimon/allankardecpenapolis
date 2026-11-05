'use client';

import { useActionState } from 'react';
import type { DadosInstitucionais } from '@ceak/db';
import { salvarInstituicao } from './actions';

const campos: { id: keyof DadosInstitucionais; label: string; dica?: string }[] = [
  { id: 'email', label: 'E-mail oficial' },
  { id: 'telefone', label: 'Telefone oficial' },
  { id: 'whatsapp', label: 'WhatsApp oficial' },
  { id: 'endereco', label: 'Endereço completo' },
  { id: 'atendimento', label: 'Horário de atendimento' },
  { id: 'mapaUrl', label: 'Link HTTPS do mapa' },
];

export function FormInstituicao({ atual }: { atual: DadosInstitucionais }) {
  const [estado, acao, pendente] = useActionState(salvarInstituicao, {});
  return (
    <form
      action={acao}
      className="border-line rounded-card mt-4 flex flex-col gap-4 border bg-white p-5"
    >
      <h2 className="m-0 font-serif text-xl">Informações oficiais para o Site</h2>
      <p className="text-muted-2 m-0 text-sm">
        Preencha somente informações confirmadas. Campos vazios permanecem ocultos no Site ou
        aparecem como “A confirmar”. Não é necessário preencher tudo para utilizar o sistema.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        {campos.map((c) => (
          <label key={c.id} className="flex flex-col gap-1 text-sm font-medium">
            {c.label}
            <input
              className="border-line-admin rounded-lg border px-3 py-2 font-normal"
              type={c.id === 'email' ? 'email' : c.id === 'mapaUrl' ? 'url' : 'text'}
              name={c.id}
              maxLength={c.id === 'endereco' ? 240 : 160}
              defaultValue={atual[c.id]}
              placeholder="A preencher"
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
        {pendente ? 'Salvando…' : 'Salvar informações'}
      </button>
    </form>
  );
}
