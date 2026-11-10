import {
  podeEnviarAgradecimento,
  type CanalAgradecimento,
  type RequisitosCanal,
} from './politicaEnvioAgradecimentos';

const MOTIVOS: Array<[keyof RequisitosCanal, string]> = [
  ['doacaoConfirmada', 'Doação não confirmada'],
  ['reciboEmitido', 'Recibo interno ainda não emitido'],
  ['cadastroAtivo', 'Cadastro do doador inativo ou indisponível'],
  ['consentimentoGeral', 'Consentimento geral não registrado'],
  ['consentimentoEspecificoDoCanal', 'Autorização específica do canal não verificada'],
  ['destinoVerificado', 'Endereço ou número de destino não verificado'],
  ['provedorHabilitado', 'Integração de entrega não homologada'],
  ['aprovacaoAdministrativa', 'Aprovação individual não registrada'],
];

export type DiagnosticoEnvio = {
  canal: CanalAgradecimento;
  pronto: boolean;
  impedimentos: string[];
};

/** Diagnóstico somente leitura: nunca dispara, agenda ou grava comunicação. */
export function diagnosticarEnvioAgradecimento(
  canal: CanalAgradecimento,
  requisitos: RequisitosCanal,
): DiagnosticoEnvio {
  const impedimentos = MOTIVOS.flatMap(([campo, motivo]) => (requisitos[campo] ? [] : [motivo]));
  if (requisitos.exclusaoSolicitada) {
    impedimentos.unshift('Titular solicitou exclusão ou anonimização');
  }
  return {
    canal,
    pronto: impedimentos.length === 0 && podeEnviarAgradecimento(canal, requisitos),
    impedimentos,
  };
}

/** Até uma integração segura de consulta administrativa existir, opt-in não é presumido. */
export function requisitosSemCanalHomologado(
  base: Pick<
    RequisitosCanal,
    | 'doacaoConfirmada'
    | 'reciboEmitido'
    | 'cadastroAtivo'
    | 'consentimentoGeral'
    | 'exclusaoSolicitada'
  >,
): RequisitosCanal {
  return {
    ...base,
    consentimentoEspecificoDoCanal: false,
    destinoVerificado: false,
    provedorHabilitado: false,
    aprovacaoAdministrativa: false,
  };
}
