'use client';

import { useTransition } from 'react';
import { Button, useToast } from '@ceak/ui';
import { decidir } from './actions';

/** Aprovar e Rejeitar com toast (2,6 s) após a decisão. */
export function BotoesDecisao({ id, titulo }: { id: string; titulo: string }) {
  const toast = useToast();
  const [pendente, iniciar] = useTransition();
  const agir = (d: 'APROVADO' | 'REJEITADO') =>
    iniciar(async () => {
      const r = await decidir(id, d);
      toast.show(r.mensagem);
    });
  return (
    <>
      <Button
        variant="danger"
        shape="rounded"
        size="sm"
        disabled={pendente}
        onClick={() => agir('REJEITADO')}
        aria-label={`Rejeitar: ${titulo}`}
      >
        Rejeitar
      </Button>
      <Button
        shape="rounded"
        size="sm"
        disabled={pendente}
        onClick={() => agir('APROVADO')}
        aria-label={`Aprovar: ${titulo}`}
      >
        Aprovar
      </Button>
    </>
  );
}
