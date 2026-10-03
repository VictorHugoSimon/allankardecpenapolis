'use client';

import { useActionState } from 'react';
import { Button, Input, Textarea } from '@ceak/ui';
import { criar } from './actions';

const CANAIS = [
  ['BLOG', 'Blog'],
  ['FACEBOOK', 'Facebook'],
  ['INSTAGRAM', 'Instagram'],
  ['GOOGLE_BUSINESS', 'Google Business'],
] as const;

export function FormNovo() {
  const [estado, enviar, enviando] = useActionState(criar, {});
  return (
    <form
      action={enviar}
      className="border-line rounded-card flex flex-col gap-3.5 border bg-white p-5"
      noValidate
    >
      <Input label="Título" name="titulo" required />
      <Input label="Fonte" name="fonte" placeholder="Secretaria, Agenda, Campanhas…" />
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-1.5 text-[13px] font-medium">Canais</legend>
        <div className="flex flex-wrap gap-4">
          {CANAIS.map(([v, l]) => (
            <label key={v} className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={`canal_${v}`}
                defaultChecked={v === 'BLOG'}
                className="accent-green size-5"
              />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <Textarea
        label="Texto inicial"
        name="texto"
        rows={6}
        hint="Depois de criado, ajuste o texto de cada canal no editor e envie para revisão."
      />
      {estado.erro ? (
        <p role="alert" className="text-danger m-0 text-sm">
          {estado.erro}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" shape="rounded" disabled={enviando}>
          {enviando ? 'Criando…' : 'Criar e abrir no editor'}
        </Button>
      </div>
    </form>
  );
}
