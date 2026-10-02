import { TERMO_LGPD_VERSAO } from '@ceak/core/validacao';
import { type Tx } from '../rls';

export interface DadosPessoa {
  nome: string;
  /** WhatsApp em E.164. */
  whatsapp: string;
  email?: string;
}

/**
 * Encontra a pessoa pelo WhatsApp (ou e-mail) ou cria um cadastro de Visitante.
 * Só é chamada com consentimento LGPD dado no formulário: registra data e versão do termo.
 */
export async function encontrarOuCriarPessoa(
  tx: Tx,
  d: DadosPessoa,
): Promise<{ id: string; nova: boolean }> {
  const existente = await tx.pessoa.findFirst({
    where: {
      anonimizadaEm: null,
      OR: [{ whatsapp: d.whatsapp }, ...(d.email ? [{ email: d.email }] : [])],
    },
    select: { id: true, email: true, whatsapp: true, consentimentoEm: true },
  });
  // E-mail é único: só grava se ainda não pertence a outro cadastro.
  const donoEmail = d.email
    ? await tx.pessoa.findUnique({ where: { email: d.email }, select: { id: true } })
    : null;
  const emailLivre =
    d.email && (!donoEmail || donoEmail.id === existente?.id) ? d.email : undefined;
  const consentimento = { consentimentoEm: new Date(), consentimentoVersao: TERMO_LGPD_VERSAO };

  if (existente) {
    await tx.pessoa.update({
      where: { id: existente.id },
      data: {
        whatsapp: existente.whatsapp ?? d.whatsapp,
        email: existente.email ?? emailLivre,
        ...(existente.consentimentoEm ? {} : consentimento),
      },
    });
    return { id: existente.id, nova: false };
  }
  const nova = await tx.pessoa.create({
    data: {
      nome: d.nome,
      whatsapp: d.whatsapp,
      email: emailLivre,
      perfil: 'VISITANTE',
      status: 'NOVO',
      primeiraVisitaEm: new Date(),
      ...consentimento,
    },
    select: { id: true },
  });
  return { id: nova.id, nova: true };
}
