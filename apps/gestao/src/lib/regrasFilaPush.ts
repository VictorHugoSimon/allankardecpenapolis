/** Regras puras do processamento, compartilhadas com os testes unitários. */
export function atrasoRetentativaMs(tentativas: number): number {
  if (!Number.isInteger(tentativas) || tentativas < 1) {
    throw new Error('Contagem de tentativas inválida.');
  }
  return Math.min(16, 2 ** (tentativas - 1)) * 60_000;
}

/**
 * O push só pode abrir páginas na origem do aplicativo.
 * Recusa barras invertidas, caracteres de controle e barras codificadas
 * para impedir que o navegador reinterprete o destino como outra origem.
 */
export function destinoInternoPush(url: unknown): string {
  const fallback = '/notificacoes';
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) {
    return fallback;
  }
  if (
    /[\\\u0000-\u001f\u007f]/.test(url) ||
    /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(url)
  ) {
    return fallback;
  }
  try {
    const base = 'https://ceak.invalid';
    const destino = new URL(url, base);
    if (destino.origin !== base) return fallback;
    return url;
  } catch {
    return fallback;
  }
}
