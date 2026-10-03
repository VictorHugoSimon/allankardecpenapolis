'use client';

import { useEffect, useState } from 'react';
import { Toggle } from '@ceak/ui';

function chaveParaBytes(base64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const bin = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

type Estado = 'carregando' | 'desligado' | 'indisponivel' | 'bloqueado' | 'ativo' | 'inativo';

/** Liga e desliga as notificações push deste aparelho (Web Push com VAPID). */
export function AtivarPush({ chavePublica }: { chavePublica: string | null }) {
  const [estado, setEstado] = useState<Estado>('carregando');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    (async () => {
      if (!chavePublica) {
        setEstado('desligado');
        return;
      }
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setEstado('indisponivel');
        return;
      }
      if (Notification.permission === 'denied') {
        setEstado('bloqueado');
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setEstado(sub ? 'ativo' : 'inativo');
    })().catch(() => setEstado('indisponivel'));
  }, [chavePublica]);

  async function alternar(ligar: boolean) {
    setOcupado(true);
    setAviso('');
    try {
      const reg = await navigator.serviceWorker.ready;
      if (ligar) {
        if ((await Notification.requestPermission()) !== 'granted') {
          setEstado('bloqueado');
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: chaveParaBytes(chavePublica!),
        });
        const r = await fetch('/api/push', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
        if (!r.ok) throw new Error(String(r.status));
        setEstado('ativo');
        setAviso('Notificações ativadas neste aparelho.');
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/push', {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setEstado('inativo');
        setAviso('Notificações desativadas neste aparelho.');
      }
    } catch {
      setAviso('Não foi possível alterar agora. Tente novamente.');
    } finally {
      setOcupado(false);
    }
  }

  const descricao =
    estado === 'desligado'
      ? 'Em breve: o envio de notificações ainda está sendo configurado.'
      : estado === 'indisponivel'
        ? 'Este navegador não recebe notificações. Instale o App na tela inicial.'
        : estado === 'bloqueado'
          ? 'Bloqueadas nas configurações do navegador.'
          : 'Lembretes de palestras, estudos e campanhas.';
  return (
    <>
      <Toggle
        label="Notificações neste aparelho"
        description={descricao}
        checked={estado === 'ativo'}
        disabled={ocupado || !['ativo', 'inativo'].includes(estado)}
        onChange={(v) => void alternar(v)}
      />
      <p role="status" className="text-muted-2 m-0 text-xs empty:hidden">
        {aviso}
      </p>
    </>
  );
}
