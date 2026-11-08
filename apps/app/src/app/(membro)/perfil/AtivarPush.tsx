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
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setEstado('indisponivel');
        return;
      }
      if (Notification.permission === 'denied') {
        setEstado('bloqueado');
        return;
      }
      const reg = (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setEstado('inativo');
        return;
      }
      const r = await fetch(`/api/push?endpoint=${encodeURIComponent(sub.endpoint)}`, {
        cache: 'no-store',
      });
      if (!r.ok) throw new Error(String(r.status));
      const status = (await r.json()) as { vinculado: boolean; pertenceOutraConta: boolean };
      setEstado(status.vinculado ? 'ativo' : 'inativo');
      if (status.pertenceOutraConta) {
        setAviso(
          'Este aparelho ainda tem notificações de outra conta. Ao ativar, será criada uma inscrição exclusiva para sua conta.',
        );
      }
    })().catch(() => setEstado('indisponivel'));
  }, [chavePublica]);

  async function alternar(ligar: boolean) {
    setOcupado(true);
    setAviso('');
    try {
      if (!chavePublica) {
        setEstado('desligado');
        setAviso('A chave de envio de notificações precisa ser configurada no servidor.');
        return;
      }
      if (ligar) {
        if (!('Notification' in window)) {
          setEstado('indisponivel');
          setAviso('Este dispositivo não oferece a permissão de notificações web.');
          return;
        }
        const permissao = await Notification.requestPermission();
        if (permissao !== 'granted') {
          setEstado(permissao === 'denied' ? 'bloqueado' : 'inativo');
          setAviso('Autorize notificações nas configurações do aplicativo para ativar os avisos.');
          return;
        }
      }
      const reg = (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));
      if (ligar) {
        // Um navegador pode manter a inscrição anterior após a troca de conta.
        // Nesse caso, revogue-a no próprio dispositivo e gere novo endpoint.
        const anterior = await reg.pushManager.getSubscription();
        if (anterior) {
          const consulta = await fetch(
            `/api/push?endpoint=${encodeURIComponent(anterior.endpoint)}`,
            { cache: 'no-store' },
          );
          if (!consulta.ok) throw new Error(String(consulta.status));
          const vinculo = (await consulta.json()) as { vinculado: boolean };
          if (!vinculo.vinculado) {
            const removido = await anterior.unsubscribe();
            if (!removido) throw new Error('falha_ao_remover_inscricao_antiga');
          }
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
          // Mantenha a inscrição local se a remoção no servidor falhar.
          // Isso evita informar "desativado" quando o destino ainda consta no banco.
          const resposta = await fetch('/api/push', {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          if (!resposta.ok) throw new Error(String(resposta.status));
          await sub.unsubscribe();
        }
        setEstado('inativo');
        setAviso('Notificações desativadas neste aparelho.');
      }
    } catch {
      setAviso('Não foi possível ativar o push. Confira a permissão do sistema, a instalação do PWA e a configuração VAPID.');
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
