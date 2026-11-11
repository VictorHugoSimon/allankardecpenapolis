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
  const contemCaracterePerigoso = Array.from(url).some((caractere) => {
    const codigo = caractere.charCodeAt(0);
    return codigo < 32 || codigo === 127 || caractere === '\\';
  });
  if (contemCaracterePerigoso || /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(url)) {
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

/** A seleção SQL limita o claim a 50; o provedor recebe no máximo 10 envios concorrentes. */
export const TAMANHO_CLAIM_PUSH = 50;
export const CONCORRENCIA_PUSH = 10;

/** Preserva a ordem, sem omitir ou repetir destinos em lotes independentes. */
export function dividirEmLotes<T>(itens: readonly T[], tamanho: number): T[][] {
  if (!Number.isSafeInteger(tamanho) || tamanho < 1) {
    throw new Error('Tamanho de lote inválido.');
  }
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }
  return lotes;
}
