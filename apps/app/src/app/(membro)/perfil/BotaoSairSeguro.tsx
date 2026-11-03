'use client';

import { useState, useTransition } from 'react';
import { sair } from './actions';

/**
 * Desvincula as notificações deste aparelho antes de encerrar a sessão.
 * Em dispositivos compartilhados, isto impede que avisos pessoais da conta
 * anterior continuem chegando após a troca de usuário.
 */
export function BotaoSairSeguro() {
  const [ocupado, iniciar] = useTransition();
  const [erro, setErro] = useState('');

  async function confirmarSaida() {
    setErro('');
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager?.getSubscription();
        if (sub) {
          const res = await fetch('/api/push', {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          if (!res.ok) throw new Error('falha_ao_desvincular');
          const desinscrito = await sub.unsubscribe();
          if (!desinscrito) throw new Error('falha_ao_desinscrever');
        }
      }
    } catch {
      setErro(
        'Não foi possível desvincular as notificações deste aparelho. ' +
          'Verifique sua conexão e tente novamente antes de sair, para proteger sua privacidade.',
      );
      return;
    }
    iniciar(() => {
      void sair();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void confirmarSaida()}
        disabled={ocupado}
        className="rounded-pill border-line-2 text-danger hover:border-danger min-h-12 w-full border bg-transparent p-3.5 text-[15px] disabled:opacity-60"
      >
        {ocupado ? 'Saindo…' : 'Sair'}
      </button>
      {erro ? (
        <div role="alert" className="mt-3 space-y-2">
          <p className="text-sm text-red-700">{erro}</p>
          <button
            type="button"
            disabled={ocupado}
            onClick={() =>
              iniciar(() => {
                void sair();
              })
            }
            className="text-sm font-semibold underline"
          >
            Sair mesmo assim
          </button>
          <p className="text-xs text-red-700">
            Se continuar, as notificações podem permanecer neste aparelho. Desative-as também nas
            configurações do navegador.
          </p>
        </div>
      ) : null}
    </div>
  );
}
