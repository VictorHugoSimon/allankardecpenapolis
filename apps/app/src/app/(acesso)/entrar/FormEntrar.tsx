'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { botaoPrimario, botaoSecundario, campo, textoErro } from '@/lib/estilos';
import { entrar } from '../actions';

export function FormEntrar({ next }: { next?: string }) {
  const [estado, enviar, enviando] = useActionState(entrar, {});
  return (
    <>
      <form action={enviar} className="mt-2.5 flex flex-col gap-4" noValidate>
        <input type="hidden" name="next" value={next ?? '/'} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="sr-only">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="E-mail"
            required
            defaultValue={estado.valores?.email}
            aria-invalid={estado.erros?.email ? true : undefined}
            aria-describedby={estado.erros?.email ? 'email-erro' : undefined}
            className={campo}
          />
          {estado.erros?.email ? (
            <p id="email-erro" className={textoErro}>
              {estado.erros.email}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="senha" className="sr-only">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            required
            aria-invalid={estado.erros?.senha ? true : undefined}
            aria-describedby={estado.erros?.senha ? 'senha-erro' : undefined}
            className={campo}
          />
          {estado.erros?.senha ? (
            <p id="senha-erro" className={textoErro}>
              {estado.erros.senha}
            </p>
          ) : null}
        </div>
        {estado.erro ? (
          <p role="alert" className={textoErro}>
            {estado.erro}
          </p>
        ) : null}
        <button type="submit" disabled={enviando} className={`${botaoPrimario} text-base`}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <Link href="/entrar/codigo" className={botaoSecundario}>
        Entrar com código pelo WhatsApp
      </Link>
      <p className="text-muted m-0 text-center text-sm">
        Primeiro acesso?{' '}
        <Link href="/cadastro" className="text-green font-semibold">
          Criar conta
        </Link>
      </p>
    </>
  );
}
