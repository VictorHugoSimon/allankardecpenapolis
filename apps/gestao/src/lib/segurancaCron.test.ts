import { describe, expect, it } from 'vitest';
import { cronAutorizado } from './segurancaCron';

describe('autorização da automação de notificações', () => {
  const segredo = 'chave-exclusiva-do-cron-com-mais-de-32-caracteres';

  it('aceita somente o Bearer com segredo completo', () => {
    expect(cronAutorizado(`Bearer ${segredo}`, segredo)).toBe(true);
  });

  it('não permite cron com credencial ausente, curta ou inválida', () => {
    for (const tentativa of [
      null,
      '',
      segredo,
      `bearer ${segredo}`,
      `Bearer ${segredo.slice(0, -1)}`,
      `Bearer ${segredo} `,
      'Basic autenticado',
      'Bearer outro-token',
    ]) {
      expect(cronAutorizado(tentativa, segredo)).toBe(false);
    }
    expect(cronAutorizado(`Bearer ${segredo}`, undefined)).toBe(false);
    expect(cronAutorizado('Bearer pequeno', 'pequeno')).toBe(false);
  });
});
