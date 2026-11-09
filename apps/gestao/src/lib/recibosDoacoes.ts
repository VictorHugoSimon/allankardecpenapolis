/** Regras de elegibilidade do recibo administrativo não fiscal. */
export type EstadoDoacaoParaRecibo = {
  statusPagamento: string;
  pagoEm: Date | null;
  reciboEmitidoEm: Date | null;
};
export function podeEmitirRecibo(d: EstadoDoacaoParaRecibo | null | undefined): boolean {
  return !!d && d.statusPagamento === 'PAGO' &&
    d.pagoEm instanceof Date && !Number.isNaN(d.pagoEm.getTime()) &&
    d.reciboEmitidoEm === null;
}
export function reciboJaEmitido(d: EstadoDoacaoParaRecibo | null | undefined): boolean {
  return !!d && d.statusPagamento === 'PAGO' &&
    d.pagoEm instanceof Date && !Number.isNaN(d.pagoEm.getTime()) &&
    d.reciboEmitidoEm instanceof Date && !Number.isNaN(d.reciboEmitidoEm.getTime());
}
export function referenciaReciboInterno(id: string, pagoEm: Date): string {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(id) || Number.isNaN(pagoEm.getTime())) {
    throw new Error('Dados inválidos para referência do recibo.');
  }
  return `CEAK-${pagoEm.getUTCFullYear()}-${id.toUpperCase()}`;
}
