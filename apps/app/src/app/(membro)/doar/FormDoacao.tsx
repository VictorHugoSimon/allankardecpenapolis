'use client';

import { useActionState, useState } from 'react';
import { cn, Toggle } from '@ceak/ui';
import { botaoPrimario, campo, textoErro } from '@/lib/estilos';
import { doar } from './actions';

const VALORES = [20, 50, 100, 200, 500];
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FormDoacao({
  destinos,
  destinoInicial,
}: {
  destinos: string[];
  destinoInicial: string;
}) {
  const [estado, enviar, enviando] = useActionState(doar, {});
  const [valor, setValor] = useState(estado.valores?.valor ?? '50');
  const [outro, setOutro] = useState(estado.valores?.outro ?? '');
  const numero =
    valor === 'outro' ? Number(outro.replace(/\./g, '').replace(',', '.')) || 0 : Number(valor);
  const opcao = (sel: boolean) =>
    cn(
      'flex min-h-12 cursor-pointer items-center justify-center rounded-[14px] border px-1 py-3.5 text-[15px] font-semibold whitespace-nowrap peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-green',
      sel ? 'bg-green border-green text-white' : 'border-line-2 text-ink bg-white',
    );
  return (
    <form action={enviar} className="flex flex-col gap-3" noValidate>
      <h2 className="m-0 font-serif text-[26px] font-normal">Contribuir via PIX</h2>
      <fieldset
        className="m-0 border-0 p-0"
        aria-describedby={estado.erros?.valor ? 'valor-erro' : undefined}
      >
        <legend className="sr-only">Valor da doação</legend>
        <div className="grid grid-cols-3 gap-2">
          {VALORES.map((v) => (
            <label key={v}>
              <input
                type="radio"
                name="valor"
                value={v}
                checked={valor === String(v)}
                onChange={() => setValor(String(v))}
                className="peer sr-only"
              />
              <span className={opcao(valor === String(v))}>R$ {v}</span>
            </label>
          ))}
          <label>
            <input
              type="radio"
              name="valor"
              value="outro"
              checked={valor === 'outro'}
              onChange={() => setValor('outro')}
              className="peer sr-only"
            />
            <span className={opcao(valor === 'outro')}>Outro</span>
          </label>
        </div>
      </fieldset>
      {valor === 'outro' ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="outro" className="text-[13px] font-medium">
            Outro valor (R$)
          </label>
          <input
            id="outro"
            name="outro"
            inputMode="decimal"
            value={outro}
            onChange={(e) => setOutro(e.target.value)}
            placeholder="0,00"
            className={campo}
          />
        </div>
      ) : null}
      {estado.erros?.valor ? (
        <p id="valor-erro" className={textoErro}>
          {estado.erros.valor}
        </p>
      ) : null}
      <div className="border-line rounded-[14px] border bg-white px-3.5 py-1.5">
        <Toggle label="Tornar mensal" description="PIX Automático · em breve" disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="destino" className="sr-only">
          Destino da doação
        </label>
        <select
          id="destino"
          name="destino"
          defaultValue={destinoInicial}
          className={cn(campo, 'p-3.5 text-sm')}
        >
          {destinos.map((d, i) => (
            <option key={d} value={d}>
              {i === 0 ? `Destino: ${d.toLowerCase()}` : d}
            </option>
          ))}
        </select>
      </div>
      {estado.erro ? (
        <p role="alert" className={textoErro}>
          {estado.erro}
        </p>
      ) : null}
      <button type="submit" disabled={enviando} className={botaoPrimario}>
        {enviando ? 'Gerando PIX…' : numero > 0 ? `Gerar PIX de ${brl(numero)}` : 'Gerar PIX'}
      </button>
    </form>
  );
}
