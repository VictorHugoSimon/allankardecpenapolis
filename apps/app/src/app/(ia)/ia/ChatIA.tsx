'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { cn } from '@ceak/ui';
import { perguntar, type RespostaChat } from './actions';

const SUGESTOES = [
  'Qual é a próxima palestra?',
  'Como participar de um estudo?',
  'Como posso ajudar?',
  'Como solicitar atendimento?',
  'Onde assistir às palestras?',
];

type Mensagem = { eu: true; texto: string } | ({ eu: false } & RespostaChat);

/** Conversa com o CEAK IA. As mensagens ficam só neste aparelho, enquanto a tela está aberta. */
export function ChatIA() {
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [pensando, iniciar] = useTransition();
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' });
  }, [msgs, pensando]);

  function enviar(q: string) {
    const pergunta = q.trim();
    if (!pergunta || pensando) return;
    setTexto('');
    setMsgs((m) => [...m, { eu: true, texto: pergunta }]);
    iniciar(async () => {
      const r = await perguntar(pergunta).catch((): RespostaChat => ({
        texto: 'Sem conexão. Tente novamente.',
        erro: true,
      }));
      setMsgs((m) => [...m, { eu: false, ...r }]);
    });
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    enviar(texto);
  }

  return (
    <>
      <main
        id="conteudo"
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-6 focus-visible:outline-offset-[-2px]"
      >
        <div className="flex flex-col gap-3">
          <p className="text-muted m-0 text-[13px] leading-normal">
            Respostas com base nas informações oficiais do CEAK. Para questões pessoais, procure o
            atendimento fraterno.
          </p>
          <div
            role="log"
            aria-live="polite"
            aria-label="Conversa com o CEAK IA"
            className="flex flex-col gap-3"
          >
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[86%] rounded-[18px] border px-3.5 py-3 text-sm leading-normal',
                  m.eu
                    ? 'bg-green border-green self-end text-white'
                    : 'border-line text-ink self-start bg-white',
                )}
              >
                <span className="sr-only">{m.eu ? 'Você: ' : 'CEAK IA: '}</span>
                {m.texto}
                {!m.eu && m.encaminhar ? (
                  <Link href="/preciso-de-ajuda" className="mt-2 block font-semibold">
                    Solicitar atendimento fraterno
                  </Link>
                ) : null}
                {!m.eu && m.fonte && !m.erro ? (
                  <p className="border-line-soft text-muted m-0 mt-2.5 border-t pt-2 text-xs">
                    Fonte consultada: <span className="text-green font-semibold">{m.fonte}</span>
                  </p>
                ) : null}
              </div>
            ))}
            {pensando ? (
              <p className="text-muted-2 m-0 self-start text-[13px]" role="status">
                Consultando a base do CEAK…
              </p>
            ) : null}
          </div>
          {msgs.length === 0 ? (
            <section aria-labelledby="sugestoes" className="mt-2 flex flex-col gap-2">
              <h2 id="sugestoes" className="m-0 text-[13px] font-semibold">
                Sugestões
              </h2>
              {SUGESTOES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => enviar(q)}
                  className="border-line text-ink hover:border-green min-h-11 rounded-[14px] border bg-white px-3.5 py-[13px] text-left text-sm"
                >
                  {q}
                </button>
              ))}
            </section>
          ) : null}
          <div ref={fim} />
        </div>
      </main>
      <form
        onSubmit={aoEnviar}
        className="border-line bg-bg flex flex-none gap-2 border-t px-3.5 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] min-[600px]:pb-[22px]"
      >
        <label htmlFor="pergunta" className="sr-only">
          Sua pergunta
        </label>
        <input
          id="pergunta"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={500}
          autoComplete="off"
          placeholder="Escreva sua pergunta"
          className="rounded-pill border-line-2 placeholder:text-muted-2 min-h-11 min-w-0 flex-1 border bg-white px-4 py-3 text-[15px]"
        />
        <button
          type="submit"
          disabled={pensando || !texto.trim()}
          className="rounded-pill bg-green hover:bg-green-dark min-h-11 px-4 text-sm text-white disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </>
  );
}
