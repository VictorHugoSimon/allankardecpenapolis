'use client';

import { useTransition } from 'react';
import { Button, useToast } from '@ceak/ui';
import { confirmarVinculo } from './actions';

export function BotaoConfirmar({
  extratoId,
  lancamentoId,
  descricao,
}: {
  extratoId: string;
  lancamentoId: string;
  descricao: string;
}) {
  const [pendente, iniciar] = useTransition();
  const toast = useToast();
  return (
    <Button
      size="sm"
      shape="rounded"
      variant="secondary"
      disabled={pendente}
      aria-label={`Confirmar conciliação: ${descricao}`}
      onClick={() =>
        iniciar(async () => {
          if (
            !window.confirm(
              `Confirmar manualmente a conciliação de "${descricao}"? A decisão ficará registrada na auditoria.`,
            )
          )
            return;
          try {
            const resultado = await confirmarVinculo(extratoId, lancamentoId);
            toast.show(resultado.mensagem);
          } catch {
            toast.show('Não foi possível confirmar. Atualize a tela e tente novamente.');
          }
        })
      }
    >
      {pendente ? 'Conferindo…' : 'Confirmar vínculo'}
    </Button>
  );
}
