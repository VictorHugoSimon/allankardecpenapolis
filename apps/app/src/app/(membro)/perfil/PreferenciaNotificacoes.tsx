'use client';

import { useEffect, useState } from 'react';
import { AtivarPush } from './AtivarPush';

/**
 * A preferência começa em "Sim", mas isso não equivale à permissão do sistema.
 * A inscrição push só ocorre após o gesto explícito no botão e consentimento
 * concedido pelo Android/iOS/navegador.
 */
export function PreferenciaNotificacoes({
  chavePublica,
  pessoaId,
}: {
  chavePublica: string | null;
  pessoaId: string;
}) {
  const [preferencia, setPreferencia] = useState<'sim' | 'nao'>('sim');
  const [montado, setMontado] = useState(false);
  const chavePreferencia = `ceak-preferencia-push:${pessoaId}`;

  useEffect(() => {
    try {
      const armazenado = window.localStorage.getItem(chavePreferencia);
      setPreferencia(armazenado === 'nao' ? 'nao' : 'sim');
    } catch {
      // A escolha continua disponível mesmo sem armazenamento local.
      setPreferencia('sim');
    }
    setMontado(true);
  }, [chavePreferencia]);

  async function escolher(valor: 'sim' | 'nao') {
    if (valor === 'nao' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const inscricao = await reg?.pushManager?.getSubscription();
        if (inscricao) {
          const resposta = await fetch('/api/push', {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ endpoint: inscricao.endpoint }),
          });
          if (!resposta.ok || !(await inscricao.unsubscribe())) throw new Error('falha');
        }
      } catch {
        window.alert(
          'Não foi possível desativar o envio neste aparelho. Verifique sua conexão e tente novamente.',
        );
        return;
      }
    }
    setPreferencia(valor);
    try {
      window.localStorage.setItem(chavePreferencia, valor);
    } catch {
      // O navegador pode bloquear armazenamento; não altera o consentimento push.
    }
  }

  if (!montado) return null;
  return (
    <section
      className="border-line rounded-[18px] border bg-white p-4"
      aria-label="Preferência de notificações"
    >
      <h2 className="m-0 text-base font-semibold">Receber notificações do CEAK?</h2>
      <p className="text-muted-2 mt-1 mb-3 text-sm">
        A opção inicial é Sim. Você pode mudar quando quiser. O celular solicitará sua autorização
        antes de enviar avisos externos.
      </p>
      <fieldset className="flex gap-5 border-0 p-0">
        <legend className="sr-only">Deseja receber notificações?</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="preferenciaPush"
            checked={preferencia === 'sim'}
            onChange={() => void escolher('sim')}
          />
          Sim
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="preferenciaPush"
            checked={preferencia === 'nao'}
            onChange={() => void escolher('nao')}
          />
          Não
        </label>
      </fieldset>
      {preferencia === 'sim' ? (
        <div className="mt-3 border-t border-[#e1e7df] pt-3">
          <AtivarPush chavePublica={chavePublica} />
          <p className="text-muted-2 mt-2 text-xs">
            Caso o botão esteja desligado, toque nele para concluir a autorização. Receber avisos
            dentro do aplicativo não depende de push.
          </p>
        </div>
      ) : (
        <p className="text-muted-2 mt-3 text-xs">
          Notificações externas desativadas neste aparelho. Você continua podendo consultar os
          avisos dentro do aplicativo.
        </p>
      )}
    </section>
  );
}
