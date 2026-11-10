import { describe, expect, it } from 'vitest';
import {
  diagnosticarEnvioAgradecimento,
  requisitosSemCanalHomologado,
} from './diagnosticoEnvioAgradecimentos';
import type { RequisitosCanal } from './politicaEnvioAgradecimentos';

const completo: RequisitosCanal = {
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

describe('diagnóstico de envio de agradecimento', () => {
  it('bloqueia todos os canais sem integração e consulta do opt-in homologadas', () => {
    const seguro = requisitosSemCanalHomologado({
      doacaoConfirmada: true,
      reciboEmitido: true,
      cadastroAtivo: true,
      consentimentoGeral: true,
      exclusaoSolicitada: false,
    });
    for (const canal of ['EMAIL', 'WHATSAPP'] as const) {
      const resultado = diagnosticarEnvioAgradecimento(canal, seguro);
      expect(resultado.pronto).toBe(false);
      expect(resultado.impedimentos).toContain('Autorização específica do canal não verificada');
      expect(resultado.impedimentos).toContain('Integração de entrega não homologada');
    }
  });
  it('falha fechado mesmo se apenas um dos requisitos estiver ausente', () => {
    for (const campo of Object.keys(completo) as (keyof RequisitosCanal)[]) {
      const r = diagnosticarEnvioAgradecimento('EMAIL', {
        ...completo,
        [campo]: !completo[campo],
      });
      expect(r.pronto).toBe(false);
      expect(r.impedimentos.length).toBeGreaterThan(0);
    }
  });
  it('só fica pronto com todos os requisitos verdadeiros e sem exclusão', () => {
    const r = diagnosticarEnvioAgradecimento('EMAIL', completo);
    expect(r.pronto).toBe(true);
    expect(r.impedimentos).toEqual([]);
  });
  it('prioriza solicitação de exclusão', () => {
    const r = diagnosticarEnvioAgradecimento('WHATSAPP', {
      ...completo,
      exclusaoSolicitada: true,
    });
    expect(r.pronto).toBe(false);
    expect(r.impedimentos[0]).toMatch(/exclusão/);
  });
});
