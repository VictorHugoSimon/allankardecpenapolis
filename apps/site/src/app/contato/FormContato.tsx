'use client';

import { useActionState } from 'react';
import { Input, Select, Textarea } from '@ceak/ui';
import { Consentimento } from '@/components/Consentimento';
import { type EstadoForm } from '@/lib/formulario';
import { enviarContato } from './actions';

const ASSUNTOS = [
  'Informações gerais',
  'Estudos',
  'Doações',
  'Voluntariado',
  'Imprensa',
  'Biblioteca',
];

export function FormContato({ assunto, mensagem }: { assunto?: string; mensagem?: string }) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(enviarContato, {});
  if (estado.ok) {
    return (
      <p role="status" className="bg-green-soft text-green-dark m-0 rounded-[18px] p-6 text-base">
        Mensagem recebida. A secretaria responderá em até 2 dias úteis.
      </p>
    );
  }
  const v = estado.valores ?? {};
  const e = estado.erros ?? {};
  return (
    <form
      action={acao}
      noValidate
      className="border-line relative flex flex-col gap-3 rounded-[18px] border bg-white p-6"
    >
      <h2 className="m-0 font-serif text-2xl font-normal">Envie uma mensagem</h2>
      <Input
        label="Nome"
        name="nome"
        autoComplete="name"
        required
        defaultValue={v.nome}
        error={e.nome}
      />
      <Input
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={v.email}
        error={e.email}
      />
      <Select
        label="Assunto"
        name="assunto"
        defaultValue={
          v.assunto ?? (assunto && ASSUNTOS.includes(assunto) ? assunto : 'Informações gerais')
        }
        options={ASSUNTOS.map((a) => ({ value: a, label: a }))}
        error={e.assunto}
      />
      <Textarea
        label="Mensagem"
        name="mensagem"
        required
        defaultValue={v.mensagem ?? mensagem}
        error={e.mensagem}
      />
      <Consentimento
        erro={e.consentimento}
        texto="Autorizo o CEAK a usar meu nome e e-mail para responder a esta mensagem."
      />
      {estado.erro ? (
        <p role="alert" className="bg-pill-err-bg text-pill-err-fg rounded-input m-0 p-3 text-sm">
          {estado.erro}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enviando}
        className="rounded-pill bg-green hover:bg-green-dark min-h-12 p-3.5 text-[15px] text-white disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Enviar mensagem'}
      </button>
    </form>
  );
}
