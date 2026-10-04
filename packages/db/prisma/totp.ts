/**
 * Mostra o código atual do autenticador de um usuário (só em desenvolvimento).
 * Uso: pnpm db:totp antonio.ferreira@allankardecpenapolis.com.br
 */
import { codigoTotp, decifrarSegredo, passoTotp } from '@ceak/core/auth';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(import.meta.dirname, '../../../.env'), quiet: true });
if (process.env.NODE_ENV === 'production') {
  console.error('Indisponível em produção.');
  process.exit(1);
}
const { prisma } = await import('../src/client');
const email = process.argv[2];
if (!email) {
  console.error('Informe o e-mail: pnpm db:totp <e-mail>');
  process.exit(1);
}
const c = await prisma.credencial.findFirst({
  where: { usuario: { email } },
  select: { totpSegredo: true },
});
if (!c?.totpSegredo) {
  console.error('Este usuário não tem autenticador ativo.');
  process.exit(1);
}
const s = process.env.AUTH_SECRET;
const segredo = decifrarSegredo(
  c.totpSegredo,
  s && s.length >= 32 ? s : 'dev-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz',
);
const restam = 30 - (Math.floor(Date.now() / 1000) % 30);
console.log(`${codigoTotp(segredo, passoTotp())}  (vale por mais ${restam}s)`);
await prisma.$disconnect();
