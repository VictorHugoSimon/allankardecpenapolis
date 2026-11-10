/** Estado explícito para opt-in específico de agradecimentos.
 * A ausência da linha nunca equivale a consentimento.
 */
export type PreferenciaCanal = {
  canal: string;
  finalidade: string;
  autorizado: boolean;
  consentidoEm: Date | null;
  revogadoEm: Date | null;
  versao: string;
};
export function temConsentimentoCanal(
  preferencia: PreferenciaCanal | null | undefined,
  canal: 'EMAIL' | 'WHATSAPP',
): boolean {
  return (
    !!preferencia &&
    preferencia.canal === canal &&
    preferencia.finalidade === 'AGRADECIMENTO_DOACAO' &&
    preferencia.autorizado === true &&
    preferencia.consentidoEm instanceof Date &&
    !Number.isNaN(preferencia.consentidoEm.getTime()) &&
    preferencia.revogadoEm === null &&
    preferencia.versao.trim().length > 0
  );
}
