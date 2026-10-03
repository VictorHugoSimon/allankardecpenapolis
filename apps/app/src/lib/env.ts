import 'server-only';

export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production')
    throw new Error('AUTH_SECRET ausente ou curto (mínimo 32 caracteres).');
  return 'dev-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
}

/** Segredo do QR Code de check-in (padrão: o mesmo da sessão). */
export function checkinSecret(): string {
  return process.env.CHECKIN_SECRET && process.env.CHECKIN_SECRET.length >= 16
    ? process.env.CHECKIN_SECRET
    : authSecret();
}
