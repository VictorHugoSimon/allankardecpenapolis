import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Informe um e-mail válido.');

/** WhatsApp no formato brasileiro, normalizado para E.164 (+55DDDNÚMERO). */
export const telefoneBR = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => /^(55)?\d{10,11}$/.test(v), 'Informe o WhatsApp com DDD.')
  .transform((v) => `+${v.startsWith('55') && v.length > 11 ? v : `55${v}`}`);

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, 'Informe a senha.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const recuperarSenhaSchema = z.object({ email });

export const solicitarCodigoSchema = z.discriminatedUnion('canal', [
  z.object({ canal: z.literal('email'), destino: email }),
  z.object({ canal: z.literal('whatsapp'), destino: telefoneBR }),
]);

export const verificarCodigoSchema = z.object({
  destino: z.string().min(3),
  canal: z.enum(['email', 'whatsapp']),
  codigo: z.string().regex(/^\d{6}$/, 'O código tem 6 dígitos.'),
});

export const senhaForte = z
  .string()
  .min(10, 'A senha precisa ter pelo menos 10 caracteres.')
  .regex(/[A-Za-z]/, 'Use ao menos uma letra.')
  .regex(/\d/, 'Use ao menos um número.');

/** Versão vigente do termo de consentimento (Configurações › Segurança e LGPD). */
export const TERMO_LGPD_VERSAO = '2026.1';

export const cadastroSchema = z.object({
  nome: z.string().trim().min(3, 'Informe seu nome completo.'),
  email,
  whatsapp: telefoneBR.optional(),
  senha: senhaForte,
  primeiraVez: z.boolean().default(false),
  consentimentoLgpd: z.literal(true, { error: 'É necessário aceitar o termo de consentimento.' }),
});
export type CadastroInput = z.infer<typeof cadastroSchema>;

/** Valor em reais (string "1.234,56" ou número) → centavos. */
export const centavos = z.union([z.number(), z.string()]).transform((v, ctx) => {
  const n = typeof v === 'number' ? v : Number(v.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) {
    ctx.addIssue({ code: 'custom', message: 'Valor inválido.' });
    return z.NEVER;
  }
  return Math.round(n * 100);
});
