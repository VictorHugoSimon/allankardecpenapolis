#!/usr/bin/env node
/**
 * CEAK Digital — verificação de segurança pré-publicação.
 * Não tenta ler valores secretos do disco nem imprime credenciais.
 * Dados institucionais vazios são permitidos, nunca dados de demonstração.
 * A publicação ainda exige configuração de segurança e homologação.
 */
import { readFileSync } from 'node:fs';

const arquivo = readFileSync(
  new URL('../packages/core/config/instituicao.ts', import.meta.url),
  'utf8',
);
const pendencias = [];

const exigirAusencia = (trecho, descricao) => {
  if (arquivo.includes(trecho)) pendencias.push(descricao);
};

// Dados institucionais são opcionais no primeiro deploy, mas exemplos conhecidos
// continuam proibidos para evitar publicação de dados falsos.
for (const [trecho, descricao] of [
  ["cnpj: '00.000.000/0001-00'", 'CNPJ de exemplo'],
  ["telefone: '(18) 3652-0000'", 'telefone de exemplo'],
  ["whatsapp: '(18) 3652-0000'", 'WhatsApp de exemplo'],
  ["chave: 'ceak-penapolis@pix.org.br'", 'chave PIX de exemplo'],
  ["{ nome: 'Antônio Ferreira', cargo: 'Presidente' }", 'diretoria fictícia'],
  ["titulo: 'Reestruturação'", 'histórico fictício'],
  ["atividade: 'Palestra pública · 20h'", 'programação fictícia'],
]) {
  exigirAusencia(trecho, descricao);
}

if (process.argv.includes('--ambiente')) {
  if (!process.env.DATABASE_URL) pendencias.push('DATABASE_URL ausente.');
  if (process.env.CEAK_DB_SCHEMA !== 'ceak_v2') pendencias.push('CEAK_DB_SCHEMA deve ser ceak_v2.');
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)
    pendencias.push('AUTH_SECRET não configurado com segurança.');
  if (process.env.NEXT_PUBLIC_CEAK_E2E === 'sim')
    pendencias.push('Modo de teste E2E deve estar desativado no ambiente público.');
  if (process.env.CEAK_ENABLE_MOCK_PAYMENT_CONFIRMATION === 'sim')
    pendencias.push('Confirmação fictícia de pagamentos deve estar desativada.');
  if (!['local', 'supabase'].includes(process.env.AUTH_PROVIDER ?? ''))
    pendencias.push('AUTH_PROVIDER não configurado explicitamente.');
  for (const [chave, endereco] of [
    ['NEXT_PUBLIC_SITE_URL', 'site'],
    ['NEXT_PUBLIC_APP_URL', 'app'],
    ['NEXT_PUBLIC_GESTAO_URL', 'gestão'],
  ]) {
    const url = process.env[chave];
    if (!url || !/^https:\/\//.test(url))
      pendencias.push(`URL HTTPS do ${endereco} não configurada (${chave}).`);
  }
  if (process.env.PAYMENT_PROVIDER === 'mock' && process.env.CEAK_ENABLE_MOCK_PAYMENT_CONFIRMATION === 'sim')
    pendencias.push('Confirmação de pagamento simulado não pode estar ativada.');
}

if (pendencias.length) {
  console.error('CEAK Digital: PUBLICAÇÃO BLOQUEADA.');
  for (const aviso of pendencias) console.error(`- ${aviso}`);
  process.exitCode = 1;
} else {
  console.log('CEAK Digital: verificações estáticas de pré-publicação aprovadas.');
  console.log('A homologação humana, testes em celulares e revisão de RLS continuam obrigatórios.');
}
