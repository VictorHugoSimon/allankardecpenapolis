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
