/** "R$ 18.840" (sem centavos, como nos painéis do protótipo). */
export function reais(centavos: number): string {
  return `R$ ${Math.round(centavos / 100).toLocaleString('pt-BR')}`;
}

export function numero(n: number): string {
  return n.toLocaleString('pt-BR');
}
