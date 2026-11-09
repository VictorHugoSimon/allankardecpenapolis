import { describe, expect, it } from 'vitest';
import {
  podeEnviarAgradecimento,
  estadoAtualDosCanais,
  type RequisitosCanal,
} from './politicaEnvioAgradecimentos';

const permitido: RequisitosCanal = {
  doacaoConfirmada: true,
  reciboEmitido: true,
  cadastroAtivo: true,
  consentimentoGeral: true,
  consentimentoEspecificoDoCanal: true,
  destinoVerificado: true,
  provedorHabilitado: true,
  aprovacaoAdministrativa: true,
  exclusaoSolicitada: false,
};

describe('política de envio de agradecimentos', () => {
  it('falha se faltar qualquer requisito', () => {
    for (const canal of ['EMAIL', 'WHATSAPP'] as const) {
      expect(podeEnviarAgradecimento(canal, permitido)).toBe(true);
      for (const campo of Object.keys(permitido) as (keyof RequisitosCanal)[]) {
        const negado = { ...permitido, [campo]: !permitido[campo] };
        expect(podeEnviarAgradecimento(canal, negado)).toBe(false);
      }
    }
  });

  it('consentimento geral não autoriza mensagens de WhatsApp ou e-mail', () => {
    expect(podeEnviarAgradecimento('EMAIL', {
      ...permitido, consentimentoEspecificoDoCanal: false,
    })).toBe(false);
    expect(podeEnviarAgradecimento('WHATSAPP', {
      ...permitido, consentimentoEspecificoDoCanal: false,
    })).toBe(false);
  });

  it('os dois canais atuais permanecem desabilitados até homologação', () => {
    const estado = estadoAtualDosCanais();
    expect(estado.EMAIL.habilitado).toBe(false);
    expect(estado.WHATSAPP.habilitado).toBe(false);
  });
});
