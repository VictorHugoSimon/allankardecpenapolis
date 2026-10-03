'use client';

import { useActionState } from 'react';
import { Button, Input } from '@ceak/ui';
import { salvarRetencao } from './actions';

export function FormRetencao({ atual }: { atual: number }) {
  const [estado, enviar, enviando] = useActionState(salvarRetencao, {});
  return (
    <form
      action={enviar}
      className="border-line rounded-card flex flex-wrap items-end gap-3 border bg-white p-5"
    >
      <Input
        label="Retenção de logs (meses)"
        name="meses"
        type="number"
        min={6}
        max={120}
        defaultValue={atual}
        hint="Logs mais antigos são apagados pela rotina de limpeza (LGPD). A auditoria não é apagada."
        error={estado.erro}
        className="w-[260px]"
      />
      <Button type="submit" shape="rounded" disabled={enviando}>
        Salvar
      </Button>
      <p role="status" className="text-green-dark m-0 text-sm empty:hidden">
        {estado.ok ? 'Retenção atualizada · registrada na auditoria.' : ''}
      </p>
    </form>
  );
}
