'use client';

import { useActionState, useState } from 'react';
import { Chip, Input } from '@ceak/ui';
import { Consentimento } from '@/components/Consentimento';
import { type EstadoForm } from '@/lib/formulario';
import { registrarAjuda } from './actions';

export function FormAjuda({
  tipo,
  cta,
  habilidades,
}: {
  tipo: string;
  cta: string;
  habilidades?: readonly string[];
}) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(registrarAjuda, {});
  const [marcadas, setMarcadas] = useState<string[]>([]);
  if (estado.ok) {
    return (
      <p role="status" className="bg-green-soft text-green-dark rounded-card m-0 p-4 text-base">
        Recebemos o seu aviso. A coordenação entrará em contato pelo WhatsApp. Obrigado!
      </p>
    );
  }
  const v = estado.valores ?? {};
  const e = estado.erros ?? {};
  return (
    <form action={acao} noValidate className="relative flex flex-col gap-3.5">
      <input type="hidden" name="tipo" value={tipo} />
      {habilidades ? (
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-sm font-medium">O que você sabe fazer</legend>
          <div className="flex flex-wrap gap-2">
            {habilidades.map((h) => {
              const on = marcadas.includes(h);
              return (
                <Chip
                  key={h}
                  selected={on}
                  onClick={() =>
                    setMarcadas(on ? marcadas.filter((x) => x !== h) : [...marcadas, h])
                  }
                >
                  {h}
                </Chip>
              );
            })}
          </div>
          {marcadas.map((h) => (
            <input key={h} type="hidden" name="habilidades" value={h} />
          ))}
        </fieldset>
      ) : null}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
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
      </div>
      <Consentimento
        erro={e.consentimento}
        texto="Autorizo o CEAK a me contatar pelo WhatsApp sobre esta ajuda."
      />
      {estado.erro ? (
        <p role="alert" className="bg-pill-err-bg text-pill-err-fg rounded-input m-0 p-3 text-sm">
          {estado.erro}
        </p>
      ) : null}
      <div>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-pill bg-green hover:bg-green-dark min-h-12 px-[22px] py-3 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {enviando ? 'Enviando…' : cta}
        </button>
      </div>
    </form>
  );
}
