'use client';

import { useEffect, useState } from 'react';
import { AtivarPush } from './AtivarPush';

/**
 * A preferência começa em "Sim", mas isso não equivale à permissão do sistema.
 * A inscrição push só ocorre após o gesto explícito no botão e consentimento
 * concedido pelo Android/iOS/navegador.
 */
export function PreferenciaNotificacoes({ chavePublica }: { chavePublica: string | null }) {
  const [preferencia, setPreferencia] = useState<'sim' | 'nao'>('sim');
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    try {
      const armazenado = window.localStorage.getItem('ceak-preferencia-push');
      if (armazenado === 'nao') setPreferencia('nao');
    } catch {
      // A escolha continua disponível mesmo sem armazenamento local.
    }
    setMontado(true);
  }, []);

  function escolher(valor: 'sim' | 'nao') {
    setPreferencia(valor);
    try {
      window.localStorage.setItem('ceak-preferencia-push', valor);
    } catch {
      // O navegador pode bloquear armazenamento; não altera o consentimento push.
    }
  }

  if (!montado) return null;
  return (
    <section className="border-line rounded-[18px] border bg-white p-4" aria-label="Preferência de notificações">
      <h2 className="m-0 text-base font-semibold">Receber notificações do CEAK?</h2>
      <p className="text-muted-2 mt-1 mb-3 text-sm">
        A opção inicial é Sim. Você pode mudar quando quiser. O celular solicitará sua autorização antes de enviar avisos externos.
      </p>
      <fieldset className="flex gap-5 border-0 p-0">
        <legend className="sr-only">Deseja receber notificações?</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="preferenciaPush" checked={preferencia === 'sim'} onChange={() => escolher('sim')} />
          Sim
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="preferenciaPush" checked={preferencia === 'nao'} onChange={() => escolher('nao')} />
          Não
        </label>
      </fieldset>
      {preferencia === 'sim' ? (
        <div className="mt-3 border-t border-[#e1e7df] pt-3">
          <AtivarPush chavePublica={chavePublica} />
          <p className="text-muted-2 mt-2 text-xs">
            Caso o botão esteja desligado, toque nele para concluir a autorização. Receber avisos dentro do aplicativo não depende de push.
          </p>
        </div>
      ) : (
        <p className="text-muted-2 mt-3 text-xs">
          Você ainda poderá consultar mensagens na caixa de avisos do aplicativo.
          Se já autorizou push anteriormente, desligue também o botão em Perfil para parar o envio ao aparelho.
        </p>
      )}
    </section>
  );
}
