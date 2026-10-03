import { instituicao } from '../../config/instituicao';
import { criarMockAIProvider, type AIProvider } from './ai';
import {
  criarMocksMensageria,
  type CaixaDeSaida,
  type EmailProvider,
  type PushProvider,
  type WhatsAppProvider,
} from './mensageria';
import { criarMockPaymentProvider, type PaymentProvider } from './payment';
import { criarMockSocialProvider, type SocialProvider } from './social';
import { criarWebPushProvider } from './webpush';

export * from './ai';
export * from './mensageria';
export * from './payment';
export * from './pix-brcode';
export * from './social';
export * from './webpush';

export interface Adapters {
  pagamento: PaymentProvider;
  ia: AIProvider;
  push: PushProvider;
  email: EmailProvider;
  whatsapp: WhatsAppProvider;
  social: Record<'facebook' | 'instagram' | 'google' | 'youtube', SocialProvider>;
  caixa: CaixaDeSaida;
}

type Env = Record<string, string | undefined>;

function exigirMock(env: Env, chave: string) {
  const v = env[chave] ?? 'mock';
  if (v !== 'mock') {
    // Os adapters reais entram nas fases 4 e 5; até lá, falhar alto é melhor que simular em produção.
    throw new Error(`${chave}=${v} ainda não está implementado. Use "mock".`);
  }
}

/**
 * Monta os adapters a partir das variáveis de ambiente.
 * Sem variáveis, tudo roda com mocks (100% local, sem credenciais).
 */
export function criarAdapters(env: Env = process.env): Adapters {
  for (const k of [
    'PAYMENT_PROVIDER',
    'AI_PROVIDER',
    'EMAIL_PROVIDER',
    'WHATSAPP_PROVIDER',
    'SOCIAL_PROVIDER',
  ]) {
    exigirMock(env, k);
  }
  const msg = criarMocksMensageria();
  // Web Push real quando as chaves VAPID estão configuradas; senão, mock.
  const vapid =
    env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY
      ? {
          publicKey: env.VAPID_PUBLIC_KEY,
          privateKey: env.VAPID_PRIVATE_KEY,
          subject: env.VAPID_SUBJECT ?? `mailto:${instituicao.contato.email}`,
        }
      : null;
  if (env.PUSH_PROVIDER && !['mock', 'webpush'].includes(env.PUSH_PROVIDER)) {
    throw new Error(`PUSH_PROVIDER=${env.PUSH_PROVIDER} desconhecido. Use "mock" ou "webpush".`);
  }
  if (env.PUSH_PROVIDER === 'webpush' && !vapid) {
    throw new Error('PUSH_PROVIDER=webpush exige VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.');
  }
  return {
    pagamento: criarMockPaymentProvider({
      chave: instituicao.pix.chave,
      nomeRecebedor: instituicao.pix.nomeRecebedor,
      cidade: instituicao.endereco.cidade,
      webhookSecret: env.PIX_WEBHOOK_SECRET ?? 'dev-webhook-secret',
    }),
    ia: criarMockAIProvider(),
    push: vapid && env.PUSH_PROVIDER !== 'mock' ? criarWebPushProvider(vapid) : msg.push,
    email: msg.email,
    whatsapp: msg.whatsapp,
    caixa: msg.caixa,
    social: {
      facebook: criarMockSocialProvider('FACEBOOK'),
      instagram: criarMockSocialProvider('INSTAGRAM'),
      google: criarMockSocialProvider('GOOGLE_BUSINESS'),
      youtube: criarMockSocialProvider('YOUTUBE'),
    },
  };
}
