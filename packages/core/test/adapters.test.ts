import { describe, expect, it } from 'vitest';
import {
  crc16,
  criarAdapters,
  criarMockAIProvider,
  criarMockPaymentProvider,
  gerarBrCode,
  MENSAGEM_ENCAMINHAMENTO,
} from '../src/adapters';

describe('BR Code PIX', () => {
  it('calcula CRC16-CCITT conforme o padrão', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('gera payload EMV com valor, txid e CRC válido', () => {
    const code = gerarBrCode({
      chave: 'ceak-penapolis@pix.org.br',
      nomeRecebedor: 'Centro Espírita Allan Kardec',
      cidade: 'Penápolis',
      valorCentavos: 5000,
      txid: 'DOACAO8812',
    });
    expect(code.startsWith('000201')).toBe(true);
    expect(code).toContain('0014br.gov.bcb.pix');
    expect(code).toContain('540550.00');
    expect(code).toContain('5802BR');
    expect(code).toContain('6009PENAPOLIS');
    expect(code).toContain('0510DOACAO8812');
    const corpo = code.slice(0, -4);
    expect(code.slice(-4)).toBe(crc16(corpo));
  });
});

describe('PaymentProvider mock', () => {
  const cfg = {
    chave: 'k@pix',
    nomeRecebedor: 'CEAK',
    cidade: 'Penapolis',
    webhookSecret: 's3cr3t',
  };

  it('cria cobrança e confirma via webhook assinado', async () => {
    const p = criarMockPaymentProvider(cfg);
    const c = await p.criarCobranca({
      valorCentavos: 2000,
      descricao: 'Doação',
      referencia: 'doacao-1',
    });
    expect(c.status).toBe('AGUARDANDO');
    const { corpo, assinatura } = p.simularPagamento(c);
    const ev = await p.lerWebhook(corpo, assinatura);
    expect(ev).toMatchObject({
      cobrancaId: c.id,
      referencia: 'doacao-1',
      status: 'PAGO',
      valorCentavos: 2000,
    });
    expect((await p.consultar(c.id))?.status).toBe('PAGO');
  });

  it('rejeita webhook com assinatura inválida', async () => {
    const p = criarMockPaymentProvider(cfg);
    const c = await p.criarCobranca({ valorCentavos: 100, descricao: 'x', referencia: 'r' });
    const { corpo } = p.simularPagamento(c);
    await expect(p.lerWebhook(corpo, 'falsa')).rejects.toThrow(/inválida/);
    await expect(p.lerWebhook(corpo, null)).rejects.toThrow(/inválida/);
  });
});

describe('AIProvider mock', () => {
  const base = [
    {
      id: '1',
      titulo: 'Agenda de outubro',
      fonte: 'Agenda CEAK · outubro/2026',
      texto:
        'As palestras públicas acontecem às quartas e sextas-feiras, às 20h, no salão principal.',
    },
    {
      id: '2',
      titulo: 'Regulamento ESDE',
      fonte: 'Regulamento ESDE 2027',
      texto: 'A pré-inscrição do ESDE 2027 está aberta na secretaria.',
    },
  ];

  it('sempre cita a fonte', async () => {
    const r = await criarMockAIProvider().responder('Que horas são as palestras públicas?', base);
    expect(r.fontes).toEqual(['Agenda CEAK · outubro/2026']);
    expect(r.texto).toContain('20h');
  });

  it('encaminha questões pessoais ao atendimento fraterno', async () => {
    const r = await criarMockAIProvider().responder(
      'Estou passando por um luto muito difícil',
      base,
    );
    expect(r.encaminharAtendimento).toBe(true);
    expect(r.texto).toBe(MENSAGEM_ENCAMINHAMENTO);
    expect(r.fontes.length).toBeGreaterThan(0);
  });
});

describe('criarAdapters', () => {
  it('usa mocks sem credenciais', () => {
    const a = criarAdapters({});
    expect(a.pagamento.nome).toBe('mock');
    expect(a.ia.nome).toBe('mock');
  });

  it('falha alto para provedor real ainda não implementado', () => {
    expect(() => criarAdapters({ PAYMENT_PROVIDER: 'mercadopago' })).toThrow(
      /não está implementado/,
    );
  });
});
