'use client';

import { useActionState, useState } from 'react';
import { Button, Input } from '@ceak/ui';
import { Eye, EyeOff } from 'lucide-react';
import { entrar, recuperarSenha, type EstadoLogin } from './actions';

export function LoginForm({ next }: { next?: string }) {
  const [estado, acaoEntrar, entrando] = useActionState<EstadoLogin, FormData>(entrar, {});
  const [rec, acaoRecuperar] = useActionState<EstadoLogin, FormData>(recuperarSenha, {});
  const [email, setEmail] = useState(estado.campos?.email ?? '');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <form action={acaoEntrar} className="flex w-full max-w-[380px] flex-col gap-3.5" noValidate>
      <h1 className="m-0 mb-2 font-serif text-[32px] font-normal">Entrar</h1>
      <input type="hidden" name="next" value={next ?? ''} />
      <Input
        label="E-mail"
        name="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="relative">
        <Input
          label="Senha"
          name="senha"
          type={mostrarSenha ? 'text' : 'password'}
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={mostrarSenha}
          onClick={() => setMostrarSenha((v) => !v)}
          className="text-muted-2 hover:text-green absolute right-1 bottom-1 flex size-10 items-center justify-center rounded-lg bg-white"
          title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {mostrarSenha ? (
            <EyeOff size={20} aria-hidden="true" />
          ) : (
            <Eye size={20} aria-hidden="true" />
          )}
        </button>
      </div>
      {estado.erro ? (
        <p
          role="alert"
          className="bg-pill-err-bg text-pill-err-fg rounded-input m-0 px-3.5 py-3 text-[13px]"
        >
          {estado.erro}
        </p>
      ) : null}
      <Button type="submit" shape="rounded" size="lg" className="mt-1.5" disabled={entrando}>
        {entrando ? 'Entrando…' : 'Entrar'}
      </Button>
      <button
        type="submit"
        formAction={acaoRecuperar}
        formNoValidate
        className="text-green min-h-11 self-start border-0 bg-transparent p-1 text-left text-sm"
      >
        Recuperar senha
      </button>
      {rec.recuperacaoEnviada ? (
        <p
          role="status"
          className="bg-green-soft text-green-dark rounded-input m-0 px-3.5 py-3 text-[13px] leading-normal"
        >
          Um link de redefinição foi enviado para o e-mail cadastrado. O link expira em 30 minutos.
        </p>
      ) : null}
    </form>
  );
}
