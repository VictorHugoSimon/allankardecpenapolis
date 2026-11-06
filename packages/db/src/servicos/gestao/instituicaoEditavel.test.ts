import { describe, expect, it } from 'vitest';
import { validarDadosInstitucionais, type DadosInstitucionais } from './instituicaoEditavel';

const base: DadosInstitucionais = {
  email: '',
  telefone: '',
  whatsapp: '',
  endereco: '',
  atendimento: '',
  mapaUrl: '',
};

describe('informações institucionais sem dados fictícios', () => {
  it('aceita todos os campos vazios no primeiro acesso', () => {
    expect(validarDadosInstitucionais(base)).toEqual(base);
  });
  it('normaliza campos e exige HTTPS para links', () => {
    expect(validarDadosInstitucionais({ ...base, email: ' atendimento@ceak.org ' }).email).toBe(
      'atendimento@ceak.org',
    );
    expect(() => validarDadosInstitucionais({ ...base, mapaUrl: 'http://exemplo.org' })).toThrow();
    expect(() => validarDadosInstitucionais({ ...base, email: 'endereco-invalido' })).toThrow();
  });
  it('bloqueia telefones e endereço não conformes', () => {
    expect(() => validarDadosInstitucionais({ ...base, telefone: '<script>' })).toThrow();
    expect(() => validarDadosInstitucionais({ ...base, endereco: 'x'.repeat(241) })).toThrow();
  });
});
