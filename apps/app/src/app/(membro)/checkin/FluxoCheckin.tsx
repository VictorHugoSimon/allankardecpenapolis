'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { EmptyState } from '@ceak/ui';
import { Sucesso } from '@/components/Sucesso';
import { botaoPrimario, textoErro } from '@/lib/estilos';
import { registrarCheckin, type EstadoCheckin } from './actions';
import { LeitorQr } from './LeitorQr';

export interface AtividadeCheckin {
  id: string;
  descricao: string;
  aberto: boolean;
  /** Token do QR Code quando a página foi aberta pela câmera do celular. */
  token?: string;
}

const NOME_INSTITUICAO = 'Centro Espírita Allan Kardec';

/** Lê `/checkin?evento=…&t=…` de um QR Code (aceita URL absoluta ou relativa). */
function lerQr(texto: string): { evento: string; t: string } | null {
  try {
    const u = new URL(texto, window.location.origin);
    const evento = u.searchParams.get('evento');
    const t = u.searchParams.get('t');
    return u.pathname.replace(/\/$/, '') === '/checkin' && evento && t ? { evento, t } : null;
  } catch {
    return null;
  }
}

export function FluxoCheckin({
  atividade,
  doQr,
}: {
  atividade: AtividadeCheckin | null;
  doQr: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(registrarCheckin, {} as EstadoCheckin);
  const [, iniciar] = useTransition();
  const [lendo, setLendo] = useState(false);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);
  const tituloSucesso = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (estado.feito)
      tituloSucesso.current?.querySelector<HTMLElement>('[data-foco-sucesso]')?.focus();
  }, [estado.feito]);

  function enviarCheckin(dados: Record<string, string>) {
    const f = new FormData();
    for (const [k, v] of Object.entries(dados)) f.set(k, v);
    iniciar(() => enviar(f));
  }

  if (estado.feito) {
    const r = estado.feito;
    return (
      <div ref={tituloSucesso}>
        <Sucesso titulo={r.jaRegistrado ? 'Check-in já registrado' : 'Check-in realizado'}>
          <p className="m-0 text-base">{NOME_INSTITUICAO}</p>
          <p className="text-muted m-0 text-[15px]">
            {r.data} · {r.hora}
          </p>
          <p className="border-line text-ink-2 m-0 mt-2 rounded-2xl border bg-white px-[18px] py-3.5 text-sm">
            {r.visitaDoMes}
          </p>
          {r.conquistas.map((c) => (
            <p
              key={c}
              className="bg-green-soft text-green-dark m-0 rounded-2xl px-[18px] py-2.5 text-sm font-medium"
            >
              Nova conquista: {c}
            </p>
          ))}
        </Sucesso>
      </div>
    );
  }

  if (!atividade) {
    return (
      <div className="flex flex-col gap-3 pt-1.5">
        <h2 className="m-0 font-serif text-[28px] font-normal">Fazer check-in</h2>
        <EmptyState
          title="Nenhuma atividade hoje"
          description="O check-in abre 2 horas antes de cada atividade da agenda."
          action={<Link href="/agenda">Ver agenda</Link>}
        />
      </div>
    );
  }

  if (lendo) {
    return (
      <div className="flex flex-col gap-4 pt-1.5">
        <h2 className="sr-only">Escanear QR Code</h2>
        <LeitorQr
          onLeitura={(texto) => {
            const qr = lerQr(texto);
            setLendo(false);
            if (!qr) {
              setErroLeitura(
                'Este QR Code não é do check-in do CEAK. Use o código afixado na entrada do salão.',
              );
              return;
            }
            enviarCheckin({ evento: qr.evento, t: qr.t, origem: 'QR' });
          }}
          onErro={(msg) => {
            setLendo(false);
            setErroLeitura(msg);
          }}
        />
        <button
          type="button"
          onClick={() => setLendo(false)}
          className="rounded-pill border-line-2 text-ink min-h-12 border bg-white p-[15px] text-[15px]"
        >
          Cancelar
        </button>
      </div>
    );
  }

  const erro = estado.erro ?? erroLeitura;
  return (
    <div className="flex flex-col gap-3 pt-1.5">
      <h2 className="m-0 font-serif text-[28px] font-normal">Fazer check-in</h2>
      <p className="text-muted m-0 text-[15px] leading-normal">{atividade.descricao}</p>
      {erro ? (
        <p role="alert" className={textoErro}>
          {erro}
        </p>
      ) : null}
      {!atividade.aberto ? (
        <p role="status" className="bg-beige text-ink-2 m-0 rounded-xl p-3 text-sm">
          O check-in abre 2 horas antes do início da atividade.
        </p>
      ) : null}
      {doQr ? (
        <button
          type="button"
          disabled={enviando || !atividade.aberto}
          onClick={() =>
            enviarCheckin({ evento: atividade.id, t: atividade.token ?? '', origem: 'QR' })
          }
          className={`${botaoPrimario} mt-2`}
        >
          {enviando ? 'Registrando…' : 'Confirmar check-in'}
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={enviando || !atividade.aberto}
            onClick={() => {
              setErroLeitura(null);
              setLendo(true);
            }}
            className="bg-green mt-2 rounded-[20px] border-0 p-[22px] text-left text-white disabled:opacity-60"
          >
            <span className="block text-[17px] font-semibold">Escanear QR Code</span>
            <span className="text-green-on-dark mt-1 block text-[13px]">
              O código está na entrada do salão
            </span>
          </button>
          <button
            type="button"
            disabled={enviando || !atividade.aberto}
            onClick={() => enviarCheckin({ evento: atividade.id, origem: 'MANUAL' })}
            className="border-line text-ink rounded-[20px] border bg-white p-[22px] text-left disabled:opacity-60"
          >
            <span className="block text-[17px] font-semibold">
              {enviando ? 'Registrando…' : 'Confirmar presença'}
            </span>
            <span className="text-muted mt-1 block text-[13px]">
              Use se estiver no CEAK e não encontrar o código
            </span>
          </button>
        </>
      )}
      <p className="text-muted-2 m-0 mt-2 text-[13px] leading-normal">
        O check-in registra sua presença na sua jornada pessoal e ajuda a organização da casa. Não é
        obrigatório.
      </p>
    </div>
  );
}
