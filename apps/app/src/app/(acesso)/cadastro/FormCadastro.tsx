'use client';

import Link from 'next/link';
import { useActionState, useState, type InputHTMLAttributes } from 'react';
import { botaoPrimario, campo, textoErro } from '@/lib/estilos';
import { cadastrar } from '../actions';

function Campo({
  id,
  rotulo,
  erro,
  dica,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
}) {
  const desc = [dica ? `${id}-dica` : null, erro ? `${id}-erro` : null].filter(Boolean).join(' ');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const ehSenha = props.type === 'password';
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {rotulo}
      </label>
      <div className={ehSenha ? 'relative' : ''}>
        <input
          id={id}
          name={id}
          aria-invalid={erro ? true : undefined}
          aria-describedby={desc || undefined}
          {...props}
          type={ehSenha && mostrarSenha ? 'text' : props.type}
          className={ehSenha ? `${campo} pr-14` : campo}
        />
        {ehSenha ? (
          <button
            type="button"
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={mostrarSenha}
            onClick={() => setMostrarSenha((v) => !v)}
            className="text-green absolute inset-y-0 right-0 flex w-12 items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              width="22"
              height="22"
              aria-hidden="true"
            >
              {mostrarSenha ? (
                <>
                  <path d="M3 3l18 18M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                </>
              ) : (
                <>
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3.5" />
                </>
              )}
            </svg>
          </button>
        ) : null}
      </div>
      {dica && !erro ? (
        <p id={`${id}-dica`} className="text-muted-2 m-0 text-xs">
          {dica}
        </p>
      ) : null}
      {erro ? (
        <p id={`${id}-erro`} className={textoErro}>
          {erro}
        </p>
      ) : null}
    </div>
  );
}

export function FormCadastro({ privacidade }: { privacidade: string }) {
  const [estado, enviar, enviando] = useActionState(cadastrar, {});
  const v = estado.valores ?? {};
  const e = estado.erros ?? {};
  return (
    <form action={enviar} className="flex flex-col gap-4" noValidate>
      <Campo
        id="nome"
        rotulo="Nome completo"
        autoComplete="name"
        required
        defaultValue={v.nome}
        erro={e.nome}
      />
      <Campo
        id="email"
        rotulo="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        defaultValue={v.email}
        erro={e.email}
      />
      <Campo
        id="whatsapp"
        rotulo="WhatsApp (opcional)"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(18) 99999-9999"
        defaultValue={v.whatsapp}
        erro={e.whatsapp}
        dica="Permite entrar com código e receber lembretes."
      />
      <Campo
        id="senha"
        rotulo="Senha"
        type="password"
        autoComplete="new-password"
        required
        erro={e.senha}
        dica="Pelo menos 10 caracteres, com letras e números."
      />
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="primeiraVez"
          value="sim"
          className="accent-green size-5 flex-none"
        />
        É minha primeira vez no CEAK
      </label>
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 text-sm leading-[1.5]">
          <input
            type="checkbox"
            name="consentimento"
            value="sim"
            required
            aria-invalid={e.consentimento ? true : undefined}
            aria-describedby={e.consentimento ? 'consentimento-erro' : undefined}
            className="accent-green mt-0.5 size-5 flex-none"
          />
          <span>
            Autorizo o CEAK a guardar meus dados para a área do membro, conforme a{' '}
            <a href={privacidade} target="_blank" rel="noopener noreferrer">
              política de privacidade
            </a>
            .
          </span>
        </label>
        {e.consentimento ? (
          <p id="consentimento-erro" className={textoErro}>
            {e.consentimento}
          </p>
        ) : null}
      </div>
      {estado.erro ? (
        <p role="alert" className={textoErro}>
          {estado.erro}
        </p>
      ) : null}
      <button type="submit" disabled={enviando} className={botaoPrimario}>
        {enviando ? 'Criando conta…' : 'Criar conta'}
      </button>
      <p className="text-muted m-0 text-center text-sm">
        Já tem conta?{' '}
        <Link href="/entrar" className="text-green font-semibold">
          Entrar
        </Link>
      </p>
    </form>
  );
}
