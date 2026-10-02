import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { gerarBrCode } from './pix-brcode';

export type StatusCobranca = 'AGUARDANDO' | 'PAGO' | 'EXPIRADO' | 'CANCELADO';

export interface CobrancaPix {
  id: string;
  referencia: string;
  valorCentavos: number;
  /** PIX copia e cola (BR Code). */
  brCode: string;
  status: StatusCobranca;
  expiraEm: Date;
}

export interface CriarCobrancaInput {
  valorCentavos: number;
  descricao: string;
  /** ID interno (doação ou pedido). */
  referencia: string;
  expiraEmMin?: number;
}

export interface EventoWebhookPix {
  cobrancaId: string;
  referencia: string;
  status: StatusCobranca;
  valorCentavos: number;
  pagoEm?: Date;
}

/** Adapter de pagamentos PIX (Mercado Pago, Efí ou mock). */
export interface PaymentProvider {
  readonly nome: string;
  criarCobranca(i: CriarCobrancaInput): Promise<CobrancaPix>;
  consultar(id: string): Promise<CobrancaPix | null>;
  /** Valida a assinatura e interpreta o webhook. Lança erro se a assinatura for inválida. */
  lerWebhook(corpo: string, assinatura: string | null): Promise<EventoWebhookPix>;
}

export interface MockPaymentConfig {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  webhookSecret: string;
}

/** PSP simulado: gera BR Code válido e aceita webhooks assinados com HMAC-SHA256. */
export function criarMockPaymentProvider(cfg: MockPaymentConfig) {
  const cobrancas = new Map<string, CobrancaPix>();

  const assinar = (corpo: string) =>
    createHmac('sha256', cfg.webhookSecret).update(corpo).digest('hex');

  const provider: PaymentProvider & {
    /** Simula o PSP confirmando o pagamento: devolve corpo e assinatura do webhook. */
    simularPagamento(id: string): { corpo: string; assinatura: string };
  } = {
    nome: 'mock',
    async criarCobranca(i) {
      const id = randomUUID().replace(/-/g, '').slice(0, 25);
      const c: CobrancaPix = {
        id,
        referencia: i.referencia,
        valorCentavos: i.valorCentavos,
        brCode: gerarBrCode({
          ...cfg,
          valorCentavos: i.valorCentavos,
          txid: id,
          descricao: i.descricao,
        }),
        status: 'AGUARDANDO',
        expiraEm: new Date(Date.now() + (i.expiraEmMin ?? 30) * 60_000),
      };
      cobrancas.set(id, c);
      return c;
    },
    async consultar(id) {
      return cobrancas.get(id) ?? null;
    },
    async lerWebhook(corpo, assinatura) {
      const esperado = Buffer.from(assinar(corpo));
      const recebido = Buffer.from(assinatura ?? '');
      if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) {
        throw new Error('Assinatura do webhook PIX inválida.');
      }
      const e = JSON.parse(corpo) as Omit<EventoWebhookPix, 'pagoEm'> & { pagoEm?: string };
      const c = cobrancas.get(e.cobrancaId);
      if (c) c.status = e.status;
      return { ...e, pagoEm: e.pagoEm ? new Date(e.pagoEm) : undefined };
    },
    simularPagamento(id) {
      const c = cobrancas.get(id);
      const corpo = JSON.stringify({
        cobrancaId: id,
        referencia: c?.referencia ?? '',
        status: 'PAGO',
        valorCentavos: c?.valorCentavos ?? 0,
        pagoEm: new Date().toISOString(),
      });
      return { corpo, assinatura: assinar(corpo) };
    },
  };
  return provider;
}
