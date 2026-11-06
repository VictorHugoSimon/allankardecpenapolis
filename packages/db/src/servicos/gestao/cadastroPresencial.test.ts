import { describe, expect, it } from 'vitest';
import { validarCadastroPresencial } from './cadastroPresencial';

const base = {
  nome: 'Maria Silva',
  email: 'maria@example.com',
  whatsapp: '',
  cidade: 'Penápolis',
  consentimento: false,
};

describe('cadastro presencial sem dados de exemplo', () => {
  it('normaliza nome e e-mail e não inventa consentimento', () => {
    expect(
      validarCadastroPresencial({ ...base, nome: '  Maria  Silva ', email: ' MARIA@EXAMPLE.COM ' }),
    ).toMatchObject({ nome: 'Maria Silva', email: 'maria@example.com', consentimento: false });
  });
  it('exige um contato', () => {
    expect(() => validarCadastroPresencial({ ...base, email: '' })).toThrow();
  });
  it('rejeita telefone sem formato brasileiro', () => {
    expect(() => validarCadastroPresencial({ ...base, whatsapp: '11999999999' })).toThrow();
  });
  it('aceita telefone +55 com DDD', () => {
    expect(
      validarCadastroPresencial({ ...base, email: '', whatsapp: '+5518999999999' }).whatsapp,
    ).toBe('+5518999999999');
  });
});
