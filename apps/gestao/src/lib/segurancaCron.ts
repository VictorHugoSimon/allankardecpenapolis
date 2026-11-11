import { timingSafeEqual } from 'node:crypto';

/**
 * A automação exige uma credencial exclusiva e longa. Cookies de sessão,
 * parâmetros de URL e tokens parciais nunca autorizam o processamento.
 */
export function cronAutorizado(cabecalho: string | null, segredo: string | undefined): boolean {
  if (!segredo || segredo.length < 32) return false;
  const recebido = Buffer.from(cabecalho ?? '');
  const esperado = Buffer.from(`Bearer ${segredo}`);
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}
