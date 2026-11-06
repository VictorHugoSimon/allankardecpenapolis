'use client';

import { useActionState, useState } from 'react';
import { Button, Input, Select } from '@ceak/ui';
import { convidar } from '../actions';

export function FormConvite() {
  const [estado, enviar, enviando] = useActionState(convidar, {});
  const e = estado.erros ?? {};
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      {estado.linkConvite ? (
        <section
          role="status"
          className="border-green rounded-card flex flex-col gap-3 border bg-white p-5"
        >
          <h3 className="m-0 text-base font-semibold">Usuário criado — convite pronto</h3>
          <p className="text-muted-2 m-0 text-sm">
            Copie o link abaixo e envie em particular para {estado.emailConvidado}. Ele expira em 48
            horas e permite definir a primeira senha. O e-mail não foi enviado automaticamente.
          </p>
          <input
            aria-label="Link privado de ativação"
            className="border-line rounded-input w-full border p-3 text-sm"
            readOnly
            value={estado.linkConvite}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            className="bg-green rounded-input min-h-11 px-4 py-2 text-white"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(estado.linkConvite ?? '');
                setCopiado(true);
              } catch {
                setCopiado(false);
              }
            }}
          >
            {copiado ? 'Link copiado' : 'Copiar link de ativação'}
          </button>
          <p className="text-muted-2 m-0 text-xs">
            Compartilhe somente com a pessoa convidada. Não publique o link em grupos ou redes
            sociais.
          </p>
        </section>
      ) : null}
      {estado.erro ? (
        <p role="alert" className="text-sm text-red-700">
          {estado.erro}
        </p>
      ...[truncated]