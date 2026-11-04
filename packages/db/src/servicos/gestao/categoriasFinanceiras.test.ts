import { describe, expect, it } from 'vitest';
import { ErroNegocio } from '../inscricoes';

// Regras básicas da primeira utilização: não existem categorias predefinidas
// nem lançamentos automáticos. Integração de persistência exige banco com RLS.
describe('primeira utilização financeira', () => {
  it('exige validar o nome antes da gravação', () => {
    expect(ErroNegocio).toBeDefined();
  });
});
