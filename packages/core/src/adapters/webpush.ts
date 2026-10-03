import webpush from 'web-push';
import { type PushProvider } from './mensageria';

export interface ConfigVapid {
  publicKey: string;
  privateKey: string;
  /** "mailto:contato@…" ou URL do site. */
  subject: string;
}

export class InscricaoPushExpirada extends Error {
  constructor() {
    super('Inscrição de push expirada ou removida pelo navegador.');
    this.name = 'InscricaoPushExpirada';
  }
}

/**
 * Web Push com VAPID. `inscricao` é o JSON da PushSubscription do navegador.
 * Lança InscricaoPushExpirada (404/410) para o chamador remover o dispositivo.
 */
export function criarWebPushProvider(cfg: ConfigVapid): PushProvider {
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  return {
    nome: 'webpush',
    async enviar(inscricao, titulo, corpo, url) {
      try {
        await webpush.sendNotification(
          JSON.parse(inscricao),
          JSON.stringify({ titulo, corpo, url }),
          { TTL: 60 * 60 * 12 },
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) throw new InscricaoPushExpirada();
        throw e;
      }
    },
  };
}
