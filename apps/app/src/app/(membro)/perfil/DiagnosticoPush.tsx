'use client';

import { useState } from 'react';

type Diagnostico = {
  instalacao: string;
  suporte: string;
  permissao: string;
  servico: string;
  inscricao: string;
};

function estaInstalado() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Diagnóstico somente leitura para homologação do Web Push em aparelhos reais.
 * Não cria inscrição, não solicita permissão e não envia endpoints ou chaves à tela.
 */
export function DiagnosticoPush() {
  const [dados, setDados] = useState<Diagnostico | null>(null);
  const [verificando, setVerificando] = useState(false);

  async function verificar() {
    setVerificando(true);
    try {
      const instalacao = estaInstalado() ? 'Instalado' : 'Aberto no navegador';
      const suportado =
        'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (!suportado) {
        setDados({
          instalacao,
          suporte: 'Indisponível neste navegador',
          permissao: 'Indisponível',
          servico: 'Indisponível',
          inscricao: 'Indisponível',
        });
        return;
      }
      const permissao =
        Notification.permission === 'granted'
          ? 'Concedida'
          : Notification.permission === 'denied'
            ? 'Bloqueada'
            : 'Ainda não concedida';
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      let inscricao = sub ? 'Não foi possível confirmar o vínculo' : 'Sem inscrição neste aparelho';
      if (sub) {
        const resposta = await fetch(
          `/api/push?endpoint=${encodeURIComponent(sub.endpoint)}`,
          { cache: 'no-store' },
        );
        if (resposta.ok) {
          const vinculo = (await resposta.json()) as {
            vinculado: boolean;
            pertenceOutraConta: boolean;
          };
          inscricao = vinculo.vinculado
            ? 'Vinculada a esta conta'
            : vinculo.pertenceOutraConta
              ? 'Vinculada a outra conta'
              : 'Sem vínculo com esta conta';
        } else if (resposta.status === 401) {
          inscricao = 'Sessão expirada; entre novamente';
        }
      }
      setDados({
        instalacao,
        suporte: 'Compatível',
        permissao,
        servico: reg?.active ? 'Ativo' : 'Não ativo',
        inscricao,
      });
    } catch {
      setDados({
        instalacao: estaInstalado() ? 'Instalado' : 'Aberto no navegador',
        suporte: 'Verificação incompleta',
        permissao: 'Não verificada',
        servico: 'Não verificado',
        inscricao: 'Erro de conexão ou leitura',
      });
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className="border-line mt-3 border-t pt-3 text-sm">
      <h3 className="m-0 text-sm font-semibold">Diagnóstico deste aparelho</h3>
      <p className="text-muted-2 my-2 text-xs">
        Verifique as condições de recebimento, sem enviar mensagens ou ativar permissões.
      </p>
      <button
        type="button"
        disabled={verificando}
        onClick={() => void verificar()}
        className="border-line rounded-input min-h-11 border bg-white px-3 text-sm font-medium disabled:opacity-50"
      >
        {verificando ? 'Verificando...' : 'Verificar notificações'}
      </button>
      {dados && (
        <dl aria-live="polite" className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <dt className="text-muted-2">Instalação</dt>
          <dd className="m-0 font-medium">{dados.instalacao}</dd>
          <dt className="text-muted-2">Navegador</dt>
          <dd className="m-0 font-medium">{dados.suporte}</dd>
          <dt className="text-muted-2">Permissão</dt>
          <dd className="m-0 font-medium">{dados.permissao}</dd>
          <dt className="text-muted-2">Service worker</dt>
          <dd className="m-0 font-medium">{dados.servico}</dd>
          <dt className="text-muted-2">Inscrição push</dt>
          <dd className="m-0 font-medium">{dados.inscricao}</dd>
        </dl>
      )}
      <p className="text-muted-2 mt-3 mb-0 text-xs">
        No iPhone, instale o aplicativo pela opção Adicionar à Tela de Início para receber Web Push.
        A compatibilidade não garante que um alerta será exibido pelo sistema.
      </p>
    </div>
  );
}
