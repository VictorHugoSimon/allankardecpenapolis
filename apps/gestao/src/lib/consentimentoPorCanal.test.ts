import { describe, expect, it } from 'vitest';
import { temConsentimentoCanal } from './consentimentoPorCanal';

const data = new Date('2026-11-09T17:00:00.000Z');
const valido = {
  canal: 'EMAIL',
  finalidade: 'AGRADECIMENTO_DOACAO',
  autorizado: true,
  consentidoEm: data,
  revogadoEm: null,
  versao: 'agradecimento-doacao-v1',
};

describe('consentimento por canal', () => {
  it('não presume autorização quando inexiste preferência', () => {
    expect(temConsentimentoCanal(null, 'EMAIL')).toBe(false);
    expect(temConsentimentoCanal(undefined, 'WHATSAPP')).toBe(false);
  });
  it('não reutiliza consentimento de e-mail no WhatsApp', () => {
    expect(temConsentimentoCanal(valido, 'EMAIL')).toBe(true);
    expect(temConsentimentoCanal(valido, 'WHATSAPP')).toBe(false);
  });
  it('revogação e estado inconsistente bloqueiam envio', () => {
    expect(temConsentimentoCanal({ ...valido, autorizado: false, revogadoEm: data }, 'EMAIL')).toBe(
      false,
    );
    expect(temConsentimentoCanal({ ...valido, revogadoEm: data }, 'EMAIL')).toBe(false);
    expect(temConsentimentoCanal({ ...valido, consentidoEm: null }, 'EMAIL')).toBe(false);
    expect(temConsentimentoCanal({ ...valido, versao: '' }, 'EMAIL')).toBe(false);
    expect(temConsentimentoCanal({ ...valido, finalidade: 'OUTRA' }, 'EMAIL')).toBe(false);
  });
});
