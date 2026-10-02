import 'server-only';

/** Segredo da sessão. Em produção é obrigatório; em dev há um padrão inseguro com aviso. */
export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET ausente ou curto (mínimo 32 caracteres).');
  }
  return 'dev-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
}
