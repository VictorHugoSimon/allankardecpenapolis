'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button, buttonClasses, Input } from '@ceak/ui';
import { definirSenha, type EstadoRedefinir } from './actions';

export function FormRedefinir({ email, token }: { email: string; token: string }) {
  const [estado, enviar, enviando] = useActionState(definirSenha, {} as EstadoRedefinir);
  if (estado.ok) {
    return (
      <>
        <p
          role="status"
          className="bg-green-soft text-green-dark rounded-input m-0 px-3.5 py-3 text-sm"
        >
          Senha definida. Você já pode entrar no CEAK Gestão.
        </p>
        <Link href="/login" className={buttonClasses({ shape: 'rounded', size: 'lg' })}>
          Entrar
        </Link>
      </>
    );
  }
  return (
    <form action={enviar} className="flex flex-col gap-3.5" noValidate>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <p className="text-muted m-0 text-sm">{email}</p>
      <Input
        label="Nova senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        hint="Pelo menos 10 caracteres, com letras e números."
        required
      />
      <Input
        label="Confirme a senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        required
      />
      {estado.erro ? (
        <p
          role="alert"
          className="bg-pill-err-bg text-pill-err-fg rounded-input m-0 px-3.5 py-3 text-[13px]"
        >
          {estado.erro}
        </p>
      ) : null}
      <Button type="submit" shape="rounded" size="lg" disabled={enviando}>
        {enviando ? 'Salvando…' : 'Salvar senha'}
      </Button>
    </form>
  );
}
