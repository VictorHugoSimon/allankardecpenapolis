import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const scrypt = (pw: string, salt: Buffer, len: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(pw, salt, len, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );

const PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEYLEN = 64;

/** Gera hash `scrypt$N$r$p$salt$hash` (base64url). */
export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(senha.normalize('NFKC'), salt, KEYLEN, PARAMS);
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$');
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  const [alg, n, r, p, salt, key] = hash.split('$');
  if (alg !== 'scrypt' || !n || !r || !p || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64url');
  const actual = await scrypt(
    senha.normalize('NFKC'),
    Buffer.from(salt, 'base64url'),
    expected.length,
    {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    },
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Código numérico de 6 dígitos para login por WhatsApp ou e-mail. */
export function gerarCodigoAcesso(): string {
  return String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, '0');
}
