import { describe, expect, it } from 'vitest';
import {
  cadastroSchema,
  centavos,
  loginSchema,
  solicitarCodigoSchema,
  telefoneBR,
} from '../src/validacao';

describe('validação', () => {
  it('normaliza e-mail no login', () => {
    expect(loginSchema.parse({ email: ' Maria.Silva@CEAK.org ', senha: 'x' }).email).toBe(
      'maria.silva@ceak.org',
    );
    expect(loginSchema.safeParse({ email: 'x', senha: 'x' }).success).toBe(false);
  });

  it('normaliza WhatsApp para E.164', () => {
    expect(telefoneBR.parse('(18) 99654-1120')).toBe('+5518996541120');
    expect(telefoneBR.parse('+55 18 3652-0000')).toBe('+551836520000');
    expect(telefoneBR.safeParse('1234').success).toBe(false);
  });

  it('exige consentimento LGPD no cadastro', () => {
    const base = { nome: 'Carla Nogueira', email: 'carla@email.com', senha: 'senhaforte123' };
    expect(cadastroSchema.safeParse({ ...base, consentimentoLgpd: false }).success).toBe(false);
    expect(cadastroSchema.safeParse({ ...base, consentimentoLgpd: true }).success).toBe(true);
    expect(
      cadastroSchema.safeParse({ ...base, senha: 'curta', consentimentoLgpd: true }).success,
    ).toBe(false);
  });

  it('valida canal do código', () => {
    expect(solicitarCodigoSchema.parse({ canal: 'whatsapp', destino: '18996541120' }).destino).toBe(
      '+5518996541120',
    );
    expect(solicitarCodigoSchema.safeParse({ canal: 'email', destino: 'nope' }).success).toBe(
      false,
    );
  });

  it('converte reais em centavos', () => {
    expect(centavos.parse('1.234,56')).toBe(123456);
    expect(centavos.parse(20)).toBe(2000);
    expect(centavos.safeParse('-1').success).toBe(false);
  });
});

describe('formulários do site', async () => {
  const { inscricaoSchema, solicitacaoAjudaSchema, doacaoSchema, checkoutSchema } =
    await import('../src/validacao');

  it('inscrição exige consentimento e WhatsApp; e-mail é opcional', () => {
    const base = { nome: 'Carla Nogueira', whatsapp: '(18) 99712-4408', consentimento: true };
    expect(inscricaoSchema.parse({ ...base, email: '' }).email).toBeUndefined();
    expect(inscricaoSchema.parse(base).whatsapp).toBe('+5518997124408');
    expect(inscricaoSchema.safeParse({ ...base, consentimento: false }).success).toBe(false);
    expect(inscricaoSchema.safeParse({ ...base, email: 'x' }).success).toBe(false);
  });

  it('rejeita robôs pelo campo-isca', () => {
    const r = inscricaoSchema.safeParse({
      nome: 'Robô',
      whatsapp: '18997124408',
      consentimento: true,
      site: 'http://spam',
    });
    expect(r.success).toBe(false);
  });

  it('solicitação de ajuda exige data e limita o relato', () => {
    const base = {
      nome: 'Carla Nogueira',
      whatsapp: '18997124408',
      consentimento: true,
      vagaId: '7f9c0f4e-1d1a-4c55-9a43-0a6c2f4b8a11',
    };
    expect(solicitacaoAjudaSchema.parse({ ...base, relato: '  ' }).relato).toBeUndefined();
    expect(solicitacaoAjudaSchema.safeParse({ ...base, vagaId: 'x' }).success).toBe(false);
    expect(solicitacaoAjudaSchema.safeParse({ ...base, relato: 'a'.repeat(2001) }).success).toBe(
      false,
    );
  });

  it('doação tem valor mínimo', () => {
    expect(
      doacaoSchema.safeParse({ valorCentavos: 50, destino: 'Assistência social' }).success,
    ).toBe(false);
    expect(
      doacaoSchema.parse({ valorCentavos: 5000, destino: 'Assistência social' }).valorCentavos,
    ).toBe(5000);
  });

  it('checkout exige itens', () => {
    const base = { nome: 'Carla Nogueira', whatsapp: '18997124408', consentimento: true };
    expect(checkoutSchema.safeParse({ ...base, itens: [] }).success).toBe(false);
  });
});
