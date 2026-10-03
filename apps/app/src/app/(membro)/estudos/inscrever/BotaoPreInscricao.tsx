'use client';

import { useActionState } from 'react';
import { textoErro } from '@/lib/estilos';
import { preInscrever } from './actions';

export function BotaoPreInscricao({
  curso,
  nome,
  jaInscrito,
}: {
  curso: string;
  nome: string;
  jaInscrito: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(preInscrever, {});
  if (jaInscrito || estado.ok) {
    return (
      <p
        role="status"
        className="bg-green-soft text-green-dark m-0 rounded-xl px-3.5 py-2.5 text-sm font-medium"
      >
        Pré-inscrição registrada. A secretaria confirma pelo WhatsApp.
      </p>
    );
  }
  return (
    <form action={enviar} className="flex flex-col gap-1.5">
      <input type="hidden" name="curso" value={curso} />
      <button
        type="submit"
        disabled={enviando}
        aria-label={`Fazer pré-inscrição em ${nome}`}
        className="rounded-pill bg-green hover:bg-green-dark min-h-11 self-start px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Fazer pré-inscrição'}
      </button>
      {estado.erro ? (
        <p role="alert" className={textoErro}>
          {estado.erro}
        </p>
      ) : null}
    </form>
  );
}
