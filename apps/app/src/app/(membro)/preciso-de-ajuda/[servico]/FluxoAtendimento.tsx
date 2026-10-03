'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { cn } from '@ceak/ui';
import { Sucesso } from '@/components/Sucesso';
import { botaoPrimario, campo, textoErro } from '@/lib/estilos';
import { solicitar, type EstadoAtendimento } from './actions';

interface Vaga {
  id: string;
  dia: string;
  horario: string;
  restantes: number;
}

export function FluxoAtendimento({
  servico,
  vagas,
  pedirWhatsapp,
  privacidade,
}: {
  servico: { slug: string; nome: string };
  vagas: Vaga[];
  pedirWhatsapp: boolean;
  privacidade: string;
}) {
  const [estado, enviar, enviando] = useActionState(solicitar, {} as EstadoAtendimento);
  const [vaga, setVaga] = useState(estado.valores?.vagaId ?? vagas[0]?.id ?? '');
  const [relato, setRelato] = useState(estado.valores?.relato ?? '');
  const caixa = useRef<HTMLDivElement>(null);
  const e = estado.erros ?? {};

  useEffect(() => {
    if (estado.ok) caixa.current?.querySelector<HTMLElement>('[data-foco-sucesso]')?.focus();
  }, [estado.ok]);

  if (estado.ok && estado.confirmado) {
    return (
      <div ref={caixa}>
        <Sucesso titulo="Solicitação confirmada">
          <p className="text-muted m-0 max-w-[280px] text-[15px] leading-normal">
            {servico.nome} · {estado.confirmado.data}, {estado.confirmado.horario}. Lembrete no
            WhatsApp na véspera.
          </p>
        </Sucesso>
      </div>
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="servico" value={servico.slug} />
      <h2 className="m-0 font-serif text-[26px] font-normal">{servico.nome}</h2>
      <p className="text-ink-2 m-0 text-sm leading-[1.55]">
        Escolha a data. A equipe confirma pelo WhatsApp.
      </p>
      {vagas.length ? (
        <fieldset
          className="m-0 border-0 p-0"
          aria-describedby={e.vagaId ? 'vaga-erro' : undefined}
        >
          <legend className="sr-only">Data do atendimento</legend>
          <div className="grid grid-cols-2 gap-2">
            {vagas.map((v) => {
              const sel = vaga === v.id;
              return (
                // eslint-disable-next-line jsx-a11y/label-has-associated-control -- o texto do rótulo vem de v.dia e v.horario
                <label key={v.id}>
                  <input
                    type="radio"
                    name="vagaId"
                    value={v.id}
                    checked={sel}
                    onChange={() => setVaga(v.id)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      'peer-focus-visible:outline-green block cursor-pointer rounded-[14px] border p-3 text-left peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
                      sel ? 'bg-green border-green text-white' : 'border-line text-ink bg-white',
                    )}
                  >
                    <span className="block text-sm font-semibold">{v.dia}</span>
                    <span className="block text-xs">
                      {v.horario} · {v.restantes} {v.restantes === 1 ? 'vaga' : 'vagas'}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <p className="bg-beige m-0 rounded-xl p-3 text-sm">
          Não há horários abertos agora. A recepção atende de terça a sábado, das 19h às 21h30.
        </p>
      )}
      {e.vagaId ? (
        <p id="vaga-erro" className={textoErro}>
          {e.vagaId}
        </p>
      ) : null}

      {pedirWhatsapp ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="whatsapp" className="text-[13px] font-medium">
            WhatsApp com DDD
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            defaultValue={estado.valores?.whatsapp}
            aria-invalid={e.whatsapp ? true : undefined}
            aria-describedby={e.whatsapp ? 'whatsapp-erro' : undefined}
            className={campo}
          />
          {e.whatsapp ? (
            <p id="whatsapp-erro" className={textoErro}>
              {e.whatsapp}
            </p>
          ) : null}
        </div>
      ) : null}

      <label htmlFor="relato" className="sr-only">
        Motivo (opcional)
      </label>
      <textarea
        id="relato"
        name="relato"
        rows={3}
        maxLength={2000}
        value={relato}
        onChange={(ev) => setRelato(ev.target.value)}
        placeholder="Se desejar, conte brevemente o motivo (opcional)"
        aria-invalid={e.relato ? true : undefined}
        className="border-line-2 placeholder:text-muted-2 resize-none rounded-[14px] border bg-white p-3 text-[15px]"
      />
      {relato.trim() ? (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-3 text-[13px] leading-[1.5]">
            <input
              type="checkbox"
              name="consentimento"
              value="sim"
              aria-invalid={e.consentimento ? true : undefined}
              aria-describedby={e.consentimento ? 'consentimento-erro' : undefined}
              className="accent-green mt-0.5 size-5 flex-none"
            />
            <span>
              Autorizo o CEAK a guardar este relato, com acesso restrito à coordenação da
              assistência e à diretoria (
              <a href={privacidade} target="_blank" rel="noopener noreferrer">
                política de privacidade
              </a>
              ).
            </span>
          </label>
          {e.consentimento ? (
            <p id="consentimento-erro" className={textoErro}>
              {e.consentimento}
            </p>
          ) : null}
        </div>
      ) : null}
      {estado.erro && !e.vagaId ? (
        <p role="alert" className={textoErro}>
          {estado.erro}
        </p>
      ) : null}
      <button type="submit" disabled={enviando || !vagas.length} className={botaoPrimario}>
        {enviando ? 'Enviando…' : 'Confirmar solicitação'}
      </button>
      <p className="text-muted-2 m-0 text-xs leading-normal">
        O atendimento espiritual não substitui acompanhamento médico ou psicológico quando
        necessário.
      </p>
    </form>
  );
}
