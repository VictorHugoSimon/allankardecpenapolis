/** Política de habilitação futura de agradecimentos por canal.
 * Consentimento genérico de cadastro não equivale a permissão de marketing
 * por e-mail ou WhatsApp. Falha fechada por padrão.
 */
export type CanalAgradecimento = 'EMAIL' | 'WHATSAPP';
export type RequisitosCanal = {
  doacaoConfirmada: boolean;
  reciboEmitido: boolean;
  cadastroAtivo: boolean;
  consentimentoGeral: boolean;
  consentimentoEspecificoDoCanal: boolean;
  destinoVerificado: boolean;
  provedorHabilitado: boolean;
  aprovacaoAdministrativa: boolean;
  exclusaoSolicitada: boolean;
};

export function podeEnviarAgradecimento(
  canal: CanalAgradecimento,
  requisitos: RequisitosCanal,
): boolean {
  if (canal !== 'EMAIL' && canal !== 'WHATSAPP') return false;
  return (
    requisitos.doacaoConfirmada &&
    requisitos.reciboEmitido &&
    requisitos.cadastroAtivo &&
    requisitos.consentimentoGeral &&
    requisitos.consentimentoEspecificoDoCanal &&
    requisitos.destinoVerificado &&
    requisitos.provedorHabilitado &&
    requisitos.aprovacaoAdministrativa &&
    !requisitos.exclusaoSolicitada
  );
}

/** Estado verificável da integração atual; não inventar preferências individuais. */
export function estadoAtualDosCanais() {
  return {
    EMAIL: {
      habilitado: false,
      motivo:
        'Sem preferência de consentimento específica por e-mail e sem fluxo de aprovação e entrega homologado.',
    },
    WHATSAPP: {
      habilitado: false,
      motivo:
        'Sem preferência de consentimento específica por WhatsApp, opt-in verificável e fluxo de envio homologado.',
    },
  } as const;
}
