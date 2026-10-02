import { type AuthProvider, type CanalCodigo, type IdentidadeConfirmada } from './provider';

interface SupabaseAuthConfig {
  url: string;
  anonKey: string;
  /** URL para onde o link de redefinição de senha leva. */
  redirectTo?: string;
  fetch?: typeof fetch;
}

interface GoTrueUser {
  id: string;
  email?: string;
  phone?: string;
}

/** Supabase Auth via REST (GoTrue), sem SDK. */
export function criarSupabaseAuthProvider(cfg: SupabaseAuthConfig): AuthProvider {
  const f = cfg.fetch ?? fetch;
  const base = cfg.url.replace(/\/+$/, '') + '/auth/v1';
  const headers = { apikey: cfg.anonKey, 'Content-Type': 'application/json' };

  const post = (path: string, body: unknown) =>
    f(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });

  const ident = (u: GoTrueUser): IdentidadeConfirmada => ({
    authId: u.id,
    email: u.email || undefined,
    telefone: u.phone || undefined,
  });

  const campo = (destino: string, canal: CanalCodigo) =>
    canal === 'email' ? { email: destino } : { phone: destino, channel: 'whatsapp' };

  return {
    nome: 'supabase',
    async entrarComSenha(email, senha) {
      const res = await post('/token?grant_type=password', { email, password: senha });
      if (!res.ok) return null;
      const data = (await res.json()) as { user?: GoTrueUser };
      return data.user ? ident(data.user) : null;
    },
    async enviarCodigo(destino, canal) {
      const res = await post('/otp', { ...campo(destino, canal), create_user: false });
      if (!res.ok) throw new Error(`Supabase OTP falhou (${res.status}).`);
    },
    async verificarCodigo(destino, canal, codigo) {
      const body =
        canal === 'email'
          ? { email: destino, token: codigo, type: 'email' }
          : { phone: destino, token: codigo, type: 'sms' };
      const res = await post('/verify', body);
      if (!res.ok) return null;
      const data = (await res.json()) as { user?: GoTrueUser };
      return data.user ? ident(data.user) : null;
    },
    async enviarRecuperacaoSenha(email) {
      const q = cfg.redirectTo ? `?redirect_to=${encodeURIComponent(cfg.redirectTo)}` : '';
      await post(`/recover${q}`, { email });
    },
  };
}
