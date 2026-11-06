/** Valida a primeira credencial real sem produzir senhas ou usuários de exemplo. */
export function validarBootstrap(env: NodeJS.ProcessEnv) {
  if (env.CEAK_BOOTSTRAP_CONFIRM !== 'CRIAR_PRIMEIRO_ADMIN_REAL') {
    throw new Error('Confirmação explícita ausente para criar administrador.');
  }
  if (env.AUTH_PROVIDER !== 'local') {
    throw new Error('Bootstrap local exige AUTH_PROVIDER=local.');
  }
  if (env.CEAK_DB_SCHEMA !== 'ceak_v2') {
    throw new Error('Use exclusivamente o schema ceak_v2.');
  }
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL ausente.');
  const url = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw new Error('DATABASE_URL deve apontar para PostgreSQL.');
  if (url.searchParams.has('schema') && url.searchParams.get('schema') !== 'ceak_v2')
    throw new Error('Schema da conexão diferente de ceak_v2.');
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32 || env.AUTH_SECRET.startsWith('dev-only-'))
    throw new Error('AUTH_SECRET deve ser um segredo real de ao menos 32 caracteres.');
  const nome = env.CEAK_ADMIN_NOME?.trim();
  const email = env.CEAK_ADMIN_EMAIL?.trim().toLowerCase();
  const senha = env.CEAK_ADMIN_SENHA;
  if (!nome || nome.length < 3 || nome.length > 160) throw new Error('CEAK_ADMIN_NOME inválido.');
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('CEAK_ADMIN_EMAIL inválido.');
  if (
    !senha ||
    senha.length < 6 ||
    senha.length > 256 ||
    !/[a-z]/i.test(senha) ||
    !/[^a-z0-9]/i.test(senha) ||
    senha.toLowerCase().includes('ceak-dev')
  )
    throw new Error('CEAK_ADMIN_SENHA precisa ter 6–256 caracteres, letras e símbolo.');
  return { nome, email, senha };
}
