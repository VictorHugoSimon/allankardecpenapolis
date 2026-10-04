'use client';

import { useActionState } from 'react';
import { Button, Input } from '@ceak/ui';
import { cancelar, verificar, type Estado2fa } from '../actions2fa';

export function FormVerificar({ email }: { email: string }) {
  const [estado, enviar, enviando] = useActionState(verificar, {} as Estado2fa);
  return (
    <div className="flex w-full max-w-[380px] flex-col gap-3.5">
      <h1 className="m-0 mb-1 font-serif text-[32px] font-normal">Confirmar acesso</h1>
      <p className="text-muted m-0 text-sm leading-normal">
        Abra o aplicativo autenticador do seu celular e digite o código de 6 dígitos do CEAK Gestão
        ({email}).
      </p>
      <form action={enviar} className="flex flex-col gap-3.5" noValidate>
        <Input
          label="Código do autenticador"
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={9}
          required
          hint="Sem o celular? Digite um dos seus códigos de recuperação (ex.: abcd-efgh)."
          error={estado.erro}
          className="[&_input]:font-mono [&_input]:text-lg [&_input]:tracking-[.2em]"
        />
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="lembrar" className="accent-green size-5" />
          Não pedir de novo neste navegador por 30 dias
        </label>
        <Button type="submit" shape="rounded" size="lg" disabled={enviando}>
          {enviando ? 'Confirmando…' : 'Confirmar'}
        </Button>
      </form>
      <form action={cancelar}>
        <button type="submit" className="text-green min-h-11 border-0 bg-transparent p-1 text-sm">
          Voltar ao login
        </button>
      </form>
    </div>
  );
}
