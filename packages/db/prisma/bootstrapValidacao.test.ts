import { describe, expect, it } from 'vitest';
import { validarBootstrap } from './bootstrapValidacao';

const seguro = {
  CEAK_BOOTSTRAP_CONFIRM: 'CRIAR_PRIMEIRO_ADMIN_REAL',
  AUTH_PROVIDER: 'local',
  CEAK_DB_SCHEMA: 'ceak_v2',
  DATABASE_URL: 'postgresql://usuario:senha@localhost:5432/ceak',
  AUTH_SECRET: 'segredo-aleatorio-real-1234567890abcdefgh',
  CEAK_ADMIN_NOME: 'Administrador Institucional',
  CEAK_ADMIN_EMAIL: 'admin@exemplo.org',
  CEAK_ADMIN_SENHA: 'SenhaUnica#Segura2026!XYZ',
};
describe('bootstrap seguro de primeiro acesso', () => {
  it('aceita credenciais explicitamente fornecidas', () => {
    expect(validarBootstrap(seguro).email).toBe('admin@exemplo.org');
  });
  it.each([
    { CEAK_BOOTSTRAP_CONFIRM: undefined },
    { AUTH_PROVIDER: undefined },
    { CEAK_DB_SCHEMA: 'public' },
    { DATABASE_URL: 'postgresql://localhost/ceak?schema=public' },
    { AUTH_SECRET: 'dev-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz' },
    { CEAK_ADMIN_SENHA: 'ceak-dev-2026' },
    { CEAK_ADMIN_EMAIL: 'email-errado' },
  ])('bloqueia configuração insegura %o', (alteracao) => {
    expect(() => validarBootstrap({ ...seguro, ...alteracao })).toThrow();
  });
});
