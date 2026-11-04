'use client';
import { useTransition } from 'react';
import { atualizarSituacao } from './actions';

export function BotaoSituacao({
  id,
  destino,
  rotulo,
}: {
  id: string;
  destino: 'AGENDADA' | 'CONCLUIDA' | 'CANCELADA';
  rotulo: string;
}) {
  const [pending, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="border-line-admin rounded-lg border bg-white px-3 py-2 text-xs disabled:opacity-50"
      onClick={() => {
        if (
          !window.confirm(
            `Confirmar a alteração para "${rotulo}"? A decisão será registrada na auditoria.`,
          )
        )
          return;
        iniciar(async () => {
          try {
            const r = await atualizarSituacao(id, destino);
            if (!r.ok) window.alert(r.mensagem);
          } catch {
            window.alert('Não foi possível atualizar. Tente novamente.');
          }
        });
      }}
    >
      {pending ? 'Salvando…' : rotulo}
    </button>
  );
}
