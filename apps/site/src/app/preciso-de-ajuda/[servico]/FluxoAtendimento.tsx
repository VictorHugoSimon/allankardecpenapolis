'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { cn, Input, Stepper, Textarea } from '@ceak/ui';
import { Ficha, Trilha } from '@/components/Elementos';
import { Sucesso } from '@/components/Sucesso';
import { solicitar, type EstadoAtendimento } from './actions';

export interface VagaView {
  id: string;
  data: string;
  horario: string;
  restantes: string;
}

const ETAPAS = ['Conheça', 'Orientações', 'Solicitação', 'Data', 'Confirmar'];
const PROXIMO = [
  'Ver orientações',
  'Solicitar atendimento',
  'Escolher data',
  'Revisar',
  'Confirmar',
];

export function FluxoAtendimento({
  servico,
  nome,
  descricao,
  orientacoes,
  vagas,
  aviso,
}: {
  servico: string;
  nome: string;
  descricao: string;
  orientacoes: readonly string[];
  vagas: VagaView[];
  aviso: string;
}) {
  const [etapa, setEtapa] = useState(0);
  const [dados, setDados] = useState({
    nome: '',
    whatsapp: '',
    relato: '',
    vagaId: vagas[0]?.id ?? '',
    consentimento: false,
  });
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({});
  const [estado, acao, enviando] = useActionState<EstadoAtendimento, FormData>(solicitar, {});
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeira = useRef(true);

  // Leva o foco ao título a cada etapa (leitores de tela e teclado).
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    titulo.current?.focus();
  }, [etapa, estado.ok]);

  // Erros do servidor levam de volta à etapa do campo.
  useEffect(() => {
    const e = estado.erros ?? {};
    if (e.nome || e.whatsapp || e.relato || e.consentimento) setEtapa(2);
    else if (e.vagaId) setEtapa(3);
  }, [estado]);

  const vaga = vagas.find((v) => v.id === dados.vagaId);
  const erros = { ...(estado.erros ?? {}), ...errosLocais };

  function avancar() {
    if (etapa === 2) {
      const e: Record<string, string> = {};
      if (dados.nome.trim().length < 3) e.nome = 'Informe seu nome.';
      if (dados.whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = 'Informe o WhatsApp com DDD.';
      if (!dados.consentimento) e.consentimento = 'Para continuar, autorize o uso dos seus dados.';
      setErrosLocais(e);
      if (Object.keys(e).length) return;
    }
    if (etapa === 3 && !vaga) {
      setErrosLocais({ vagaId: 'Escolha uma data.' });
      return;
    }
    setErrosLocais({});
    setEtapa((x) => Math.min(4, x + 1));
  }

  if (estado.ok && estado.confirmado) {
    return (
      <>
        <Sucesso titulo="Solicitação confirmada">
          <p className="text-muted m-0 max-w-[460px] text-[17px] leading-[1.6]">
            {nome} · {estado.confirmado.data}, {estado.confirmado.horario}. Você receberá um
            lembrete no WhatsApp na véspera.
          </p>
          <Link
            href="/"
            className="rounded-pill border-line-3 text-ink mt-3 inline-flex min-h-11 items-center border bg-white px-[22px] py-3 text-[15px] no-underline hover:no-underline"
          >
            Voltar ao início
          </Link>
        </Sucesso>
        <p className="border-line text-muted-2 mt-10 mb-0 border-t pt-[18px] text-sm leading-[1.55]">
          {aviso}
        </p>
      </>
    );
  }

  const h1 = 'm-0 mb-5 font-serif font-medium focus:outline-none';
  return (
    <>
      <Trilha itens={[{ href: '/preciso-de-ajuda', texto: 'Preciso de ajuda' }, { texto: nome }]} />
      <Stepper
        steps={ETAPAS}
        current={etapa}
        label={`Etapas da solicitação de ${nome}`}
        className="mb-9"
      />
      <form action={acao} noValidate className="relative">
        <input type="hidden" name="servico" value={servico} />
        <input type="hidden" name="nome" value={dados.nome} />
        <input type="hidden" name="whatsapp" value={dados.whatsapp} />
        <input type="hidden" name="relato" value={dados.relato} />
        <input type="hidden" name="vagaId" value={dados.vagaId} />
        {dados.consentimento ? <input type="hidden" name="consentimento" value="sim" /> : null}

        {etapa === 0 ? (
          <>
            <h1 ref={titulo} tabIndex={-1} className={`${h1} text-[44px]`}>
              {nome}
            </h1>
            <p className="text-ink-2 m-0 mb-4 text-lg leading-[1.7]">{descricao}</p>
            <p className="text-ink-2 m-0 text-lg leading-[1.7]">
              O atendimento acontece em ambiente tranquilo, com trabalhadores preparados pela casa.
              Você pode vir sozinho ou acompanhado.
            </p>
          </>
        ) : null}

        {etapa === 1 ? (
          <>
            <h1 ref={titulo} tabIndex={-1} className={`${h1} text-[40px]`}>
              Algumas orientações
            </h1>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {orientacoes.map((t, i) => (
                <li
                  key={t}
                  className="border-line rounded-card flex gap-3.5 border bg-white px-5 py-[18px] text-[17px] leading-normal"
                >
                  <span className="text-green font-serif text-xl" aria-hidden="true">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </>
        ) : null}

        {etapa === 2 ? (
          <>
            <h1 ref={titulo} tabIndex={-1} className={`${h1} text-[40px]`}>
              Solicitar atendimento
            </h1>
            <div className="border-line rounded-card-lg relative flex flex-col gap-4 border bg-white p-[26px]">
              <Input
                label="Nome"
                autoComplete="name"
                required
                value={dados.nome}
                onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                error={erros.nome}
              />
              <Input
                label="WhatsApp"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(18) 99999-9999"
                required
                value={dados.whatsapp}
                onChange={(e) => setDados({ ...dados, whatsapp: e.target.value })}
                error={erros.whatsapp}
              />
              <Textarea
                label="Se quiser, conte brevemente o que está vivendo (opcional)"
                value={dados.relato}
                maxLength={2000}
                onChange={(e) => setDados({ ...dados, relato: e.target.value })}
                error={erros.relato}
              />
              <p className="text-muted-2 m-0 text-[13px]">
                Suas informações são vistas apenas pela equipe de assistência.
              </p>
              <div>
                <label className="text-ink-2 flex min-h-11 items-start gap-2.5 text-sm leading-normal">
                  <input
                    type="checkbox"
                    checked={dados.consentimento}
                    onChange={(e) => setDados({ ...dados, consentimento: e.target.checked })}
                    aria-invalid={erros.consentimento ? true : undefined}
                    className="accent-green mt-0.5 size-5 flex-none"
                  />
                  <span>
                    Autorizo o CEAK a usar estes dados, inclusive o relato, para organizar o meu
                    atendimento. <Link href="/privacidade">Política de privacidade</Link>.
                  </span>
                </label>
                {erros.consentimento ? (
                  <p role="alert" className="text-danger m-0 mt-1 text-xs font-medium">
                    {erros.consentimento}
                  </p>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        {etapa === 3 ? (
          <>
            <h1 ref={titulo} tabIndex={-1} className={`${h1} text-[40px]`}>
              Escolha uma data
            </h1>
            {vagas.length === 0 ? (
              <p className="text-muted m-0">
                No momento não há horários com vagas. Fale com a recepção, de terça a sábado, das
                19h às 21h30.
              </p>
            ) : (
              <fieldset className="m-0 border-0 p-0">
                <legend className="sr-only">Horários disponíveis</legend>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
                  {vagas.map((v) => {
                    const on = v.id === dados.vagaId;
                    return (
                      <label
                        key={v.id}
                        className={cn(
                          'rounded-card has-[:focus-visible]:outline-green flex cursor-pointer flex-col gap-1 border p-[18px] text-left has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                          on ? 'border-green bg-green text-white' : 'border-line text-ink bg-white',
                        )}
                      >
                        <input
                          type="radio"
                          name="vaga-escolha"
                          value={v.id}
                          checked={on}
                          onChange={() => setDados({ ...dados, vagaId: v.id })}
                          className="sr-only"
                        />
                        <span className="text-base font-semibold">{v.data}</span>
                        <span className="text-sm">{v.horario}</span>
                        <span className="text-xs opacity-90">{v.restantes}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
            {erros.vagaId ? (
              <p role="alert" className="text-danger mt-2 mb-0 text-sm font-medium">
                {erros.vagaId}
              </p>
            ) : null}
          </>
        ) : null}

        {etapa === 4 ? (
          <>
            <h1 ref={titulo} tabIndex={-1} className={`${h1} text-[40px]`}>
              Confirme sua solicitação
            </h1>
            <div className="border-line rounded-card-lg relative border bg-white p-[26px] text-base">
              <Ficha
                larguraRotulo={130}
                className="text-base"
                linhas={[
                  ['Atendimento', nome],
                  ['Data', vaga ? `${vaga.data}, ${vaga.horario}` : '—'],
                  ['Nome', dados.nome],
                  ['Contato', dados.whatsapp],
                  ['Local', 'Recepção do CEAK · chegue 15 min antes'],
                ]}
              />
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Site
                  <input type="text" name="site" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
            </div>
            {estado.erro ? (
              <p
                role="alert"
                className="bg-pill-err-bg text-pill-err-fg rounded-input mt-4 mb-0 p-3 text-sm"
              >
                {estado.erro}
              </p>
            ) : null}
          </>
        ) : null}

        <div className="mt-8 flex justify-between gap-3">
          {etapa === 0 ? (
            <Link
              href="/preciso-de-ajuda"
              className="rounded-pill border-line-3 text-ink inline-flex min-h-12 items-center border px-[22px] py-[13px] text-[15px] no-underline hover:no-underline"
            >
              Voltar
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setEtapa((x) => x - 1)}
              className="rounded-pill border-line-3 text-ink min-h-12 border bg-transparent px-[22px] py-[13px] text-[15px]"
            >
              Voltar
            </button>
          )}
          {etapa < 4 ? (
            <button
              key="avancar"
              type="button"
              onClick={avancar}
              disabled={etapa === 3 && vagas.length === 0}
              className="rounded-pill bg-green hover:bg-green-dark min-h-12 px-[26px] py-[13px] text-[15px] font-medium text-white disabled:opacity-50"
            >
              {PROXIMO[etapa]}
            </button>
          ) : (
            <button
              key="enviar"
              type="submit"
              disabled={enviando}
              className="rounded-pill bg-green hover:bg-green-dark min-h-12 px-[26px] py-[13px] text-[15px] font-medium text-white disabled:opacity-60"
            >
              {enviando ? 'Enviando…' : 'Confirmar'}
            </button>
          )}
        </div>
      </form>
      <p className="border-line text-muted-2 mt-10 mb-0 border-t pt-[18px] text-sm leading-[1.55]">
        {aviso}
      </p>
    </>
  );
}
