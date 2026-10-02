/**
 * Provedor de identidade. A sessão do CEAK é sempre emitida pelo próprio sistema
 * (cookie assinado); o provedor só confirma a identidade.
 *
 * - `local`: senha (scrypt) e códigos guardados no banco. Roda sem credenciais.
 * - `supabase`: Supabase Auth (GoTrue) via REST.
 */
export type CanalCodigo = 'email' | 'whatsapp';

export interface IdentidadeConfirmada {
  /** E-mail ou telefone confirmado pelo provedor. */
  email?: string;
  telefone?: string;
  /** ID do usuário no provedor externo (Supabase `auth.users.id`). */
  authId?: string;
}

export interface AuthProvider {
  readonly nome: 'local' | 'supabase';
  entrarComSenha(email: string, senha: string): Promise<IdentidadeConfirmada | null>;
  enviarCodigo(destino: string, canal: CanalCodigo): Promise<void>;
  verificarCodigo(
    destino: string,
    canal: CanalCodigo,
    codigo: string,
  ): Promise<IdentidadeConfirmada | null>;
  enviarRecuperacaoSenha(email: string): Promise<void>;
}
