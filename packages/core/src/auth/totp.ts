import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

/**
 * Autenticador (TOTP, RFC 6238): códigos de 6 dígitos a cada 30 segundos,
 * compatível com Google Authenticator, Microsoft Authenticator, Authy etc.
 */
export const TOTP_PERIODO_S = 30;
export const TOTP_DIGITOS = 6;
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32(buf: Buffer): string {
  let bits = 0;
  let valor = 0;
  let out = '';
  for (const b of buf) {
    valor = (valor << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALFABETO[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALFABETO[(valor << (5 - bits)) & 31];
  return out;
}

export function deBase32(s: string): Buffer {
  const limpo = s.replace(/[\s=-]/g, '').toUpperCase();
  let bits = 0;
  let valor = 0;
  const out: number[] = [];
  for (const c of limpo) {
    const i = ALFABETO.indexOf(c);
    if (i < 0) throw new Error('Segredo inválido.');
    valor = (valor << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Segredo novo (160 bits), em base32. */
export function gerarSegredoTotp(): string {
  return base32(randomBytes(20));
}

export function passoTotp(agora = Date.now()): number {
  return Math.floor(agora / 1000 / TOTP_PERIODO_S);
}

/** Código do passo (HOTP com HMAC-SHA1, RFC 4226). */
export function codigoTotp(segredoBase32: string, passo: number, digitos = TOTP_DIGITOS): string {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(passo));
  const h = createHmac('sha1', deBase32(segredoBase32)).update(contador).digest();
  const o = h[h.length - 1]! & 0xf;
  const n = ((h[o]! & 0x7f) << 24) | (h[o + 1]! << 16) | (h[o + 2]! << 8) | h[o + 3]!;
  return String(n % 10 ** digitos).padStart(digitos, '0');
}

/**
 * Confere o código aceitando um passo de tolerância para cada lado (relógio do
 * celular adiantado ou atrasado). Recusa passos já usados (`ultimoPasso`): o
 * mesmo código não serve duas vezes. Retorna o passo aceito ou `null`.
 */
export function verificarTotp(
  segredoBase32: string,
  codigo: string,
  opcoes: { agora?: number; ultimoPasso?: number | null } = {},
): number | null {
  const c = codigo.replace(/\s/g, '');
  if (!/^\d{6}$/.test(c)) return null;
  const atual = passoTotp(opcoes.agora);
  for (const p of [atual - 1, atual, atual + 1]) {
    if (opcoes.ultimoPasso != null && p <= opcoes.ultimoPasso) continue;
    const esperado = codigoTotp(segredoBase32, p);
    if (timingSafeEqual(Buffer.from(esperado), Buffer.from(c))) return p;
  }
  return null;
}

/** URI para o QR Code do aplicativo autenticador. */
export function uriTotp(segredoBase32: string, conta: string, emissor = 'CEAK Gestão'): string {
  const rotulo = encodeURIComponent(`${emissor}:${conta}`);
  const p = new URLSearchParams({
    secret: segredoBase32,
    issuer: emissor,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITOS),
    period: String(TOTP_PERIODO_S),
  });
  return `otpauth://totp/${rotulo}?${p.toString()}`;
}

/** Códigos de recuperação (uso único), no formato "abcd-efgh". */
export function gerarCodigosRecuperacao(n = 8): string[] {
  return Array.from({ length: n }, () => {
    const s = base32(randomBytes(5)).toLowerCase();
    return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
  });
}

export function hashCodigoRecuperacao(codigo: string): string {
  return createHash('sha256').update(codigo.trim().toLowerCase()).digest('hex');
}

// ─── Segredo guardado cifrado (AES-256-GCM, chave derivada do AUTH_SECRET) ──

function chave(secret: string): Buffer {
  return Buffer.from(hkdfSync('sha256', secret, 'ceak-digital', 'totp-segredo', 32));
}

export function cifrarSegredo(texto: string, secret: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', chave(secret), iv);
  const dados = Buffer.concat([c.update(texto, 'utf8'), c.final()]);
  return [
    'v1',
    iv.toString('base64url'),
    c.getAuthTag().toString('base64url'),
    dados.toString('base64url'),
  ].join('.');
}

export function decifrarSegredo(cifrado: string, secret: string): string {
  const [v, iv, tag, dados] = cifrado.split('.');
  if (v !== 'v1' || !iv || !tag || !dados) throw new Error('Segredo cifrado inválido.');
  const d = createDecipheriv('aes-256-gcm', chave(secret), Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(dados, 'base64url')), d.final()]).toString('utf8');
}
