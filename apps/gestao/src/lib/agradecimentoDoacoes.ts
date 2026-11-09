/**
 * Gera um texto individual de agradecimento, sem qualquer efeito colateral.
 * Não inclui valor, meio de pagamento, ID da doação ou dados sensíveis.
 */
export function mensagemAgradecimento(nome: string, destino: string): string {
  const saudacao = nome.trim().slice(0, 80) || 'Apoiador(a)';
  const finalidade = destino.trim().slice(0, 160);
  return [
    `Olá, ${saudacao}!`,
    'O Centro Espírita Allan Kardec agradece de coração sua contribuição.',
    finalidade ? `Seu apoio à iniciativa ${finalidade} é muito importante para nossas atividades.`
      : 'Seu apoio é muito importante para nossas atividades.',
    'Muito obrigado por fazer parte desta corrente de solidariedade!',
    'Centro Espírita Allan Kardec',
  ].join('\n\n');
}
export type ContextoAgradecimento = {
  statusPagamento: string;
  pagoEm: Date | null;
  reciboEmitidoEm: Date | null;
  pessoaId: string | null;
  consentimentoEm: Date | null;
  exclusaoSolicitadaEm: Date | null;
  anonimizadaEm: Date | null;
  usuarioAtivo: boolean;
};
/** Só disponibiliza a preparação quando há identificação e consentimento válido. */
export function agradecimentoElegivel(d: ContextoAgradecimento): boolean {
  return d.statusPagamento === 'PAGO' &&
    d.pagoEm instanceof Date && !Number.isNaN(d.pagoEm.getTime()) &&
    d.reciboEmitidoEm instanceof Date && !Number.isNaN(d.reciboEmitidoEm.getTime()) &&
    !!d.pessoaId && d.consentimentoEm instanceof Date &&
    d.exclusaoSolicitadaEm === null && d.anonimizadaEm === null &&
    d.usuarioAtivo;
}
