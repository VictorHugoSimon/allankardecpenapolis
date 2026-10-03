import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * QR Code de check-in: aponta para `/checkin?evento=<id>&t=<token>`, em que o token
 * é um HMAC do ID do evento. Impede check-in em eventos arbitrários pela URL.
 */
export function tokenCheckin(eventoId: string, segredo: string): string {
  return createHmac('sha256', segredo)
    .update(`checkin:${eventoId}`)
    .digest('base64url')
    .slice(0, 22);
}

export function tokenCheckinValido(
  eventoId: string,
  token: string | null | undefined,
  segredo: string,
): boolean {
  if (!token) return false;
  const esperado = Buffer.from(tokenCheckin(eventoId, segredo));
  const recebido = Buffer.from(token);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

export function urlCheckin(appUrl: string, eventoId: string, segredo: string): string {
  return `${appUrl.replace(/\/$/, '')}/checkin?evento=${eventoId}&t=${tokenCheckin(eventoId, segredo)}`;
}
