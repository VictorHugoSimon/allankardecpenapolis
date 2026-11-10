/** Regras puras do processamento, compartilhadas com os testes unitários. */
export function atrasoRetentativaMs(tentativas: number): number {
  if (!Number.isInteger(tentativas) || tentativas < 1) {
    throw new Error('Contagem de tentativas inválida.');
  }
  return Math.min(16, 2 ** (tentativas - 1)) * 60_000;
}

/** Apenas rotas internas do PWA podem ser abertas pelo clique no push. */
export function destinoInternoPush(url: unknown): string {
  if (
    typeof url !== 'string' ||
    !url.startsWith('/') ||
    url.startsWith('//') ||
    url.startsWith('/\\')
  ) {
    return '/notificacoes';
  }
  return url;
}
