'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { cn } from '@ceak/ui';
import { Sucesso } from '@/components/Sucesso';
import { botaoPrimario, textoErro } from '@/lib/estilos';
import { avaliar } from '../actions';

const CRITERIOS = [
  ['conteudo', 'Conteúdo'],
  ['clareza', 'Clareza'],
  ['aplicabilidade', 'Aplicabilidade'],
] as const;

const caixa = 'border-line flex flex-col gap-3 rounded-[18px] border bg-white p-4';
const areaTexto =
  'border-line-2 resize-none rounded-[14px] border bg-white p-3 text-[15px] font-normal leading-normal';

export function FormAvaliacao({ slug, descricao }: { slug: string; descricao: string }) {
  const [estado, enviar, enviando] = useActionState(avaliar, {});
  const [nps, setNps] = useState<number | null>(null);
  const [notas, setNotas] = useState<Record<string, number>>({});
  const caixaSucesso = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (estado.ok) caixaSucesso.current?.querySelector<HTMLElement>('[data-foco-sucesso]')?.focus();
  }, [estado.ok]);

  if (estado.ok) {
    return (
      <div ref={caixaSucesso}>
        <Sucesso titulo="Avaliação recebida">
          <p className="text-muted m-0 max-w-[280px] text-[15px] leading-normal">
            Agradecemos sua participação. As respostas são lidas pela diretoria doutrinária e
            orientam a programação.
          </p>
        </Sucesso>
      </div>
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <div>
        <h2 className="m-0 font-serif text-[28px] font-normal">Como foi sua experiência?</h2>
        <p className="text-muted m-0 mt-1 text-[13px]">{descricao}</p>
      </div>

      <fieldset
        className={cn(caixa, 'm-0')}
        aria-describedby={estado.erros?.nps ? 'nps-erro' : undefined}
      >
        <legend className="float-left mb-3 text-sm leading-[1.45]">
          De 0 a 10, quanto você recomendaria esta palestra para outra pessoa?
        </legend>
        <div className="clear-both grid grid-cols-11 gap-[3px]">
          {Array.from({ length: 11 }, (_, v) => (
            <label key={v} className="relative">
              <input
                type="radio"
                name="nps"
                value={v}
                checked={nps === v}
                onChange={() => setNps(v)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'peer-focus-visible:outline-green flex aspect-square cursor-pointer items-center justify-center rounded-lg border text-[13px] font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
                  nps === v
                    ? 'bg-green border-green text-white'
                    : 'border-line-2 text-ink bg-white',
                )}
              >
                {v}
              </span>
            </label>
          ))}
        </div>
        <p aria-hidden="true" className="text-muted-2 m-0 flex justify-between text-[11px]">
          <span>Pouco provável</span>
          <span>Muito provável</span>
        </p>
        {estado.erros?.nps ? (
          <p id="nps-erro" className={textoErro}>
            {estado.erros.nps}
          </p>
        ) : null}
      </fieldset>

      <div className={caixa}>
        {CRITERIOS.map(([chave, rotulo]) => (
          <fieldset key={chave} className="m-0 flex items-center justify-between border-0 p-0">
            <legend className="float-left text-sm">{rotulo}</legend>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="relative">
                  <input
                    type="radio"
                    name={chave}
                    value={n}
                    checked={notas[chave] === n}
                    onChange={() => setNotas((x) => ({ ...x, [chave]: n }))}
                    className="peer sr-only"
                  />
                  <span className="sr-only">
                    {n} {n === 1 ? 'estrela' : 'estrelas'}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'peer-focus-visible:outline-green flex size-9 cursor-pointer items-center justify-center rounded text-[22px] peer-focus-visible:outline-2',
                      (notas[chave] ?? 0) >= n ? 'text-ochre' : 'text-[#C2B9A5]',
                    )}
                  >
                    ★
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        O que mais chamou sua atenção?
        <textarea name="comentario" rows={3} maxLength={1000} className={areaTexto} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Que assunto gostaria de ver futuramente?
        <textarea name="sugestao" rows={2} maxLength={1000} className={areaTexto} />
      </label>
      {estado.erro ? (
        <p role="alert" className={textoErro}>
          {estado.erro}
        </p>
      ) : null}
      <button type="submit" disabled={enviando} className={botaoPrimario}>
        {enviando ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </form>
  );
}
