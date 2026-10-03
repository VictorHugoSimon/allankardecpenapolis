'use client';

import { useTransition } from 'react';
import { Button, useToast } from '@ceak/ui';
import { mudarStatus } from './actions';

const BOTAO: Record<string, { rotulo: string; variante: 'primary' | 'secondary' | 'danger' }> = {
  APROVADO: { rotulo: 'Aprovar', variante: 'secondary' },
  PAGO: { rotulo: 'Pagar', variante: 'primary' },
  CANCELADO: { rotulo: 'Cancelar', variante: 'danger' },
};

export function AcoesLancamento({
  id,
  acoes,
  descricao,
  receber,
}: {
  id: string;
  acoes: string[];
  descricao: string;
  receber?: boolean;
}) {
  const toast = useToast();
  const [pendente, iniciar] = useTransition();
  if (!acoes.length) return <span className="text-muted-2">—</span>;
  return (
    <span className="flex gap-1.5 whitespace-nowrap">
      {acoes.map((a) => {
        const b = BOTAO[a]!;
        const rotulo = receber && a === 'PAGO' ? 'Receber' : b.rotulo;
        return (
          <Button
            key={a}
            size="sm"
            shape="rounded"
            variant={b.variante}
            disabled={pendente}
            aria-label={`${rotulo}: ${descricao}`}
            onClick={() =>
              iniciar(async () => {
                const r = await mudarStatus(id, a as 'APROVADO' | 'PAGO' | 'CANCELADO');
                toast.show(r.mensagem);
              })
            }
          >
            {rotulo}
          </Button>
        );
      })}
    </span>
  );
}
