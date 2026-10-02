'use client';

import { useActionState, useEffect } from 'react';
import { Input } from '@ceak/ui';
import { Consentimento } from '@/components/Consentimento';
import { type EstadoForm } from '@/lib/formulario';
import { inscrever } from './actions';

export function FormInscricao({
  evento,
  curso,
  sucesso,
  cabecalho,
}: {
  evento?: string;
  curso?: string;
  sucesso: React.ReactNode;
  cabecalho: React.ReactNode;
}) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(inscrever, {});
  useEffect(() => {
    if (estado.ok) {
      window.scrollTo({ top: 0 });
      document.querySelector<HTMLElement>('[data-foco-sucesso]')?.focus();
    }
  }, [estado.ok]);
  if (estado.ok) return <>{sucesso}</>;
  const v = estado.valores ?? {};
  const e = estado.erros ?? {};
  return (
    <>
      {cabecalho}
      <form
        action={acao}
        noValidate
        className="border-line rounded-card-lg relative flex flex-col gap-4 border bg-white p-7"
      >
        {evento ? <input type="hidden" name="evento" value={evento} /> : null}
        {curso ? <input type="hidden" name="curso" value={curso} /> : null}
        <Input
          label="Nome"
          name="nome"
          autoComplete="name"
          required
          defaultValue={v.nome}
          error={e.nome}
        />
        <Input
          label="WhatsApp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(18) 99999-9999"
          required
          defaultValue={v.whatsapp}
          error={e.whatsapp}
        />
        <Input
          label="E-mail (opcional)"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={v.email}
          error={e.email}
        />
        <label className="text-ink-2 flex min-h-11 items-center gap-2.5 text-[15px]">
          <input type="checkbox" name="primeiraVez" value="sim" className="accent-green size-5" />É
          minha primeira vez no CEAK
        </label>
        <Consentimento
          erro={e.consentimento}
          texto="Autorizo o CEAK a usar estes dados para a inscrição e para enviar os detalhes pelo WhatsApp."
        />
        {estado.erro ? (
          <p role="alert" className="bg-pill-err-bg text-pill-err-fg rounded-input m-0 p-3 text-sm">
            {estado.erro}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={enviando}
          className="rounded-pill bg-green hover:bg-green-dark mt-1.5 min-h-12 p-3.5 text-base font-medium text-white disabled:opacity-60"
        >
          {enviando ? 'Enviando…' : 'Confirmar inscrição'}
        </button>
      </form>
    </>
  );
}
