'use client';

import { useActionState } from 'react';
import { Button, Input } from '@ceak/ui';
import { concluir, confirmar, type Estado2fa } from '../actions2fa';

export function FormConfigurar() {
  const [estado, enviar, enviando] = useActionState(confirmar, {} as Estado2fa);
  if (estado.codigos) {
    return (
      <section
        aria-labelledby="codigos-titulo"
        className="bg-green-soft flex flex-col gap-3 rounded-[14px] p-4"
      >
        <h2 id="codigos-titulo" className="text-green-dark m-0 text-base font-semibold">
          Autenticador ativado. Guarde seus códigos de recuperação
        </h2>
        <p className="text-green-dark m-0 text-[13px] leading-normal">
          Cada código vale uma vez e serve para entrar se você perder o celular. Guarde em local
          seguro: eles não serão mostrados de novo.
        </p>
        <ul
          aria-label="Códigos de recuperação"
          className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 font-mono text-sm"
        >
          {estado.codigos.map((c) => (
            <li key={c} className="rounded-md bg-white px-2.5 py-1.5">
              {c}
            </li>
          ))}
        </ul>
        <form action={concluir}>
          <Button type="submit" shape="rounded" size="lg" block>
            Guardei os códigos · continuar
          </Button>
        </form>
      </section>
    );
  }
  return (
    <form action={enviar} className="flex flex-col gap-3.5" noValidate>
      <Input
        label="Código de 6 dígitos mostrado no aplicativo"
        name="codigo"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        error={estado.erro}
        className="[&_input]:font-mono [&_input]:text-lg [&_input]:tracking-[.2em]"
      />
      <Button type="submit" shape="rounded" size="lg" disabled={enviando}>
        {enviando ? 'Ativando…' : 'Ativar autenticador'}
      </Button>
    </form>
  );
}
