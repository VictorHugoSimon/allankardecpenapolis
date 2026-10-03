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

// ─── Formulários do site público ──────────────────────────────────────

const nome = z.string().trim().min(3, 'Informe seu nome.').max(120);
const emailOpcional = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(z.string().email('Informe um e-mail válido.').optional());
const consentimento = z.literal(true, {
  error: 'Para continuar, autorize o uso dos seus dados.',
});
/** Campo-isca contra robôs: precisa chegar vazio. */
const isca = z
  .string()
  .optional()
  .refine((v) => !v, 'Envio inválido.');

export const inscricaoSchema = z.object({
  nome,
  whatsapp: telefoneBR,
  email: emailOpcional,
  primeiraVez: z.boolean().default(false),
  consentimento,
  site: isca,
});
export type InscricaoInput = z.infer<typeof inscricaoSchema>;

export const solicitacaoAjudaSchema = z.object({
  nome,
  whatsapp: telefoneBR,
  relato: z
    .string()
    .trim()
    .max(2000, 'Use no máximo 2.000 caracteres.')
    .optional()
    .transform((v) => (v ? v : undefined)),
  vagaId: z.string().uuid('Escolha uma data.'),
  consentimento,
  site: isca,
});
export type SolicitacaoAjudaInput = z.infer<typeof solicitacaoAjudaSchema>;

export const doacaoSchema = z.object({
  valorCentavos: z
    .number()
    .int()
    .min(100, 'O valor mínimo é R$ 1,00.')
    .max(10_000_000, 'Para valores acima de R$ 100.000, fale com a tesouraria.'),
  destino: z.string().trim().min(3).max(80),
  nome: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
  email: emailOpcional,
  site: isca,
});
export type DoacaoInput = z.infer<typeof doacaoSchema>;

export const checkoutSchema = z.object({
  nome,
  whatsapp: telefoneBR,
  itens: z
    .array(z.object({ produtoId: z.string().uuid(), quantidade: z.number().int().min(1).max(20) }))
    .min(1, 'Seu carrinho está vazio.')
    .max(30),
  consentimento,
  site: isca,
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const contatoSchema = z.object({
  nome,
  email,
  assunto: z.string().trim().min(3).max(80),
  mensagem: z.string().trim().min(5, 'Escreva sua mensagem.').max(4000),
  consentimento,
  site: isca,
});
export type ContatoInput = z.infer<typeof contatoSchema>;

export const intencaoAjudaSchema = z.object({
  tipo: z.enum(['ALIMENTOS', 'ROUPAS', 'PRODUTOS', 'VOLUNTARIO', 'EVENTOS', 'HABILIDADE']),
  nome,
  whatsapp: telefoneBR,
  habilidades: z.array(z.string().max(40)).max(20).default([]),
  consentimento,
  site: isca,
});
export type IntencaoAjudaInput = z.infer<typeof intencaoAjudaSchema>;

// ─── CEAK App ─────────────────────────────────────────────────────────

const nota = z.coerce.number().int().min(1).max(5).optional();

export const avaliacaoSchema = z.object({
  nps: z.coerce
    .number({ error: 'Escolha uma nota de 0 a 10.' })
    .int()
    .min(0, 'Escolha uma nota de 0 a 10.')
    .max(10),
  conteudo: nota,
  clareza: nota,
  aplicabilidade: nota,
  comentario: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  sugestao: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type AvaliacaoInput = z.infer<typeof avaliacaoSchema>;

export const perguntaIaSchema = z.object({
  pergunta: z
    .string()
    .trim()
    .min(2, 'Escreva sua pergunta.')
    .max(500, 'Use no máximo 500 caracteres.'),
});
