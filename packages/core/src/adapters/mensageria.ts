import { appendFileSync } from 'node:fs';
/** Canais de saída: push (Web Push/VAPID), e-mail (Resend) e WhatsApp. */
export interface MensagemEnviada {
  canal: 'push' | 'email' | 'whatsapp';
  destino: string;
  assunto?: string;
  corpo: string;
  enviadaEm: Date;
}

export interface PushProvider {
  readonly nome: string;
  enviar(inscricao: string, titulo: string, corpo: string, url?: string): Promise<void>;
}

export interface EmailProvider {
  readonly nome: string;
  enviar(para: string, assunto: string, html: string): Promise<void>;
}

export interface WhatsAppProvider {
  readonly nome: string;
  enviar(telefone: string, texto: string): Promise<void>;
}

/**
 * Caixa de saída dos mocks (em memória). Com MOCK_CAIXA_ARQUIVO definido, cada mensagem
 * também é gravada em JSON Lines nesse arquivo — os testes E2E leem os códigos de acesso dali.
 */
export class CaixaDeSaida {
  readonly mensagens: MensagemEnviada[] = [];
  constructor(private readonly arquivo = process.env.MOCK_CAIXA_ARQUIVO) {}
  registrar(m: Omit<MensagemEnviada, 'enviadaEm'>) {
    const msg = { ...m, enviadaEm: new Date() };
    this.mensagens.push(msg);
    if (this.arquivo) appendFileSync(this.arquivo, JSON.stringify(msg) + '\n');
    if (process.env.NODE_ENV !== 'test') {
      process.stdout.write(
        `[mock:${m.canal}] → ${m.destino}: ${m.assunto ? `${m.assunto} · ` : ''}${m.corpo}\n`,
      );
    }
  }
  ultima(canal?: MensagemEnviada['canal']) {
    return [...this.mensagens].reverse().find((m) => !canal || m.canal === canal);
  }
}

export function criarMocksMensageria(caixa = new CaixaDeSaida()) {
  const push: PushProvider = {
    nome: 'mock',
    async enviar(inscricao, titulo, corpo) {
      caixa.registrar({ canal: 'push', destino: inscricao, assunto: titulo, corpo });
    },
  };
  const email: EmailProvider = {
    nome: 'mock',
    async enviar(para, assunto, html) {
      caixa.registrar({ canal: 'email', destino: para, assunto, corpo: html });
    },
  };
  const whatsapp: WhatsAppProvider = {
    nome: 'mock',
    async enviar(telefone, texto) {
      caixa.registrar({ canal: 'whatsapp', destino: telefone, corpo: texto });
    },
  };
  return { caixa, push, email, whatsapp };
}
