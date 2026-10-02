'use client';

import { useActionState, useState } from 'react';
import { Input, Select } from '@ceak/ui';
import { cn } from '@ceak/ui';
import { type EstadoForm } from '@/lib/formulario';
import { doar } from './actions';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FormDoacao({
  valores,
  destinos,
}: {
  valores: readonly number[];
  destinos: readonly string[];
}) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(doar, {});
  const [valor, setValor] = useState<string>(estado.valores?.valor ?? '50');
  const [outro, setOutro] = useState(estado.valores?.outro ?? '');
  const e = estado.erros ?? {};
  const numero =
    valor === 'outro' ? Number(outro.replace(/\./g, '').replace(',', '.')) || 0 : Number(valor);

  return (
    <form
      action={acao}
      noValidate
      className="border-line rounded-card-lg relative flex flex-col gap-5 border bg-white p-[26px]"
    >
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-sm font-medium">Valor</legend>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
          {[...valores.map(String), 'outro'].map((v) => {
            const on = v === valor;
            return (
              <label
                key={v}
                className={cn(
                  'rounded-card-sm has-[:focus-visible]:outline-green flex min-h-12 cursor-pointer items-center justify-center border px-2 py-4 text-[17px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                  on ? 'border-green bg-green text-white' : 'border-line-2 text-ink bg-white',
                )}
              >
                <input
                  type="radio"
                  name="valor"
                  value={v}
                  checked={on}
                  onChange={() => setValor(v)}
                  className="sr-only"
                />
                {v === 'outro' ? 'Outro valor' : `R$ ${v}`}
              </label>
            );
          })}
        </div>
        {e.valor ? (
          <p role="alert" className="text-danger m-0 mt-1.5 text-xs font-medium">
            {e.valor}
          </p>
        ) : null}
      </fieldset>
      {valor === 'outro' ? (
        <Input
          label="Outro valor (R$)"
          name="outro"
          inputMode="decimal"
          placeholder="R$ 0,00"
          value={outro}
          onChange={(ev) => setOutro(ev.target.value)}
        />
      ) : null}
      <Select
        label="Destino"
        name="destino"
        defaultValue={estado.valores?.destino}
        options={destinos.map((d) => ({ value: d, label: d }))}
      />
      <div className="bg-bg rounded-card-sm flex items-center gap-3.5 p-4">
        <span
          aria-hidden="true"
          className="bg-line-3 flex h-6 w-[42px] flex-none justify-start rounded-xl p-[3px]"
        >
          <span className="size-[18px] rounded-full bg-white" />
        </span>
        <div>
          <p className="m-0 text-[15px] font-medium">Tornar mensal</p>
          <p className="text-muted-2 m-0 text-[13px]">
            Doação recorrente via PIX Automático · em breve
          </p>
        </div>
      </div>
      <details className="text-sm">
        <summary className="text-green min-h-11 cursor-pointer py-2 font-medium">
          Quero receber o recibo por e-mail (opcional)
        </summary>
        <div className="mt-2 grid gap-3">
          <Input
            label="Nome (opcional)"
            name="nome"
            autoComplete="name"
            defaultValue={estado.valores?.nome}
          />
          <Input
            label="E-mail para o recibo"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={estado.valores?.email}
            error={e.email}
          />
          <p className="text-muted-2 m-0 text-xs">
            Usamos o e-mail apenas para enviar o recibo desta doação.
          </p>
        </div>
      </details>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site
          <input type="text" name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="text-muted-2 m-0 text-sm">Pagamento por PIX</p>
      {estado.erro ? (
        <p role="alert" className="bg-pill-err-bg text-pill-err-fg rounded-input m-0 p-3 text-sm">
          {estado.erro}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enviando}
        className="rounded-pill bg-green hover:bg-green-dark min-h-12 p-[15px] text-base font-medium text-white disabled:opacity-60"
      >
        {enviando ? 'Gerando PIX…' : `Doar ${brl(numero)} via PIX`}
      </button>
    </form>
  );
}
