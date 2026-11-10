'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { botaoPrimario, botaoSecundario, campo, textoErro } from '@/lib/estilos';
import { entrar } from '../actions';

export function FormEntrar({
  next,
  codigoDisponivel,
}: {
  next?: string;
  codigoDisponivel?: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(entrar, {});
  const [mostrarSenha, setMostrarSenha] = useState(false);
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
          <div className="relative">
            <input
              id="senha"
              name="senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Senha"
              required
              aria-invalid={estado.erros?.senha ? true : undefined}
              aria-describedby={estado.erros?.senha ? 'senha-erro' : undefined}
              className={`${campo} pr-14`}
            />
            <button
              type="button"
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={mostrarSenha}
              onClick={() => setMostrarSenha((v) => !v)}
              className="text-green absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-xl"
            >
              {mostrarSenha ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  width="22"
                  height="22"
                  aria-hidden="true"
                >
                  <path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c5.2 0 8.8 4.4 10 7-0.5 1.1-1.4 2.5-2.6 3.8M6.6 6.6C4.3 8 2.8 10.5 2 12c1.2 2.6 4.8 7 10 7 1.1 0 2.2-.2 3.2-.5" />
                  <path d="M9.5 9.5a3.5 3.5 0 0 0 5 5" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  width="22"
                  height="22"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3.5" />
                </svg>
              )}
              <span className="sr-only">{mostrarSenha ? 'Ocultar' : 'Mostrar'}</span>
            </button>
          </div>
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
      {codigoDisponivel ? (
        <Link href="/entrar/codigo" className={botaoSecundario}>
          Entrar com código pelo WhatsApp
        </Link>
      ) : null}
      <p className="text-muted m-0 text-center text-sm">
        Primeiro acesso?{' '}
        <Link href="/cadastro" className="text-green font-semibold">
          Criar conta
        </Link>
      </p>
    </>
  );
}
