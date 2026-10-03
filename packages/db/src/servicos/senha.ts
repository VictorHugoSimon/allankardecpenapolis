import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { hashSenha } from '@ceak/core/auth';
import { type Logger } from '@ceak/core/logger';
import { registrarAuditoria } from '../auditoria';
import { prisma } from '../client';

/** Tokens de redefinição ficam na tabela de códigos com destino próprio (não colidem com o login por código). */
const destinoToken = (email: string) => `redefinir:${email.toLowerCase()}`;
const hash = (t: string) => createHash('sha256').update(t).digest('hex');

export const REDEFINICAO_TTL_MS = 30 * 60_000;
export const CONVITE_TTL_MS = 48 * 3_600_000;

/** Gera o link de definição de senha (sem revelar se o e-mail existe). */
async function gerarLink(email: string, ttlMs: number, urlBase: string) {
  const token = randomBytes(32).toString('base64url');
  await prisma.codigoAcesso.create({
    data: {
      destino: destinoToken(email),
      canal: 'EMAIL',
      codigoHash: hash(token),
      expiraEm: new Date(Date.now() + ttlMs),
    },
  });
  const u = new URL('/redefinir-senha', urlBase);
  u.searchParams.set('e', email.toLowerCase());
  u.searchParams.set('t', token);
  return u.toString();
}

export async function solicitarRedefinicaoSenha(
  email: string,
  deps: {
    enviarEmail: (para: string, assunto: string, texto: string) => Promise<unknown>;
    urlBase: string;
    log: Logger;
  },
) {
  const u = await prisma.usuario.findFirst({
    where: { email: email.toLowerCase(), ativo: true },
    select: { id: true },
  });
  if (!u) return; // Mesma resposta para quem não tem conta.
  const link = await gerarLink(email, REDEFINICAO_TTL_MS, deps.urlBase);
  await deps.enviarEmail(
    email,
    'Redefinição de senha · CEAK Gestão',
    `Para criar uma nova senha, abra o link abaixo. Ele expira em 30 minutos.\n\n${link}\n\nSe você não pediu a redefinição, ignore este e-mail.`,
  );
  deps.log.info('SEGURANCA', 'senha.redefinicao.enviada', { rota: '/login', status: 202 });
}

export async function enviarConvite(
  email: string,
  nome: string,
  deps: {
    enviarEmail: (para: string, assunto: string, texto: string) => Promise<unknown>;
    urlBase: string;
  },
) {
  const link = await gerarLink(email, CONVITE_TTL_MS, deps.urlBase);
  await deps.enviarEmail(
    email,
    'Convite · CEAK Gestão',
    `Olá, ${nome.split(' ')[0]}. Você recebeu acesso ao CEAK Gestão. Defina sua senha pelo link abaixo (válido por 48 horas).\n\n${link}`,
  );
}

/** Valida o token e grava a nova senha (uso único). */
export async function redefinirSenha(
  email: string,
  token: string,
  novaSenha: string,
  ip: string | null,
) {
  const c = await prisma.codigoAcesso.findFirst({
    where: {
      destino: destinoToken(email),
      canal: 'EMAIL',
      usadoEm: null,
      expiraEm: { gt: new Date() },
    },
    orderBy: { criadoEm: 'desc' },
  });
  const ok =
    !!c && c.tentativas < 5 && timingSafeEqual(Buffer.from(c.codigoHash), Buffer.from(hash(token)));
  if (!c || !ok) {
    if (c)
      await prisma.codigoAcesso.update({
        where: { id: c.id },
        data: { tentativas: { increment: 1 } },
      });
    return false;
  }
  const u = await prisma.usuario.findFirst({
    where: { email: email.toLowerCase(), ativo: true },
    select: { id: true },
  });
  if (!u) return false;
  const senhaHash = await hashSenha(novaSenha);
  await prisma.$transaction(async (tx) => {
    await tx.codigoAcesso.update({ where: { id: c.id }, data: { usadoEm: new Date() } });
    await tx.credencial.upsert({
      where: { usuarioId: u.id },
      create: { usuarioId: u.id, senhaHash },
      update: { senhaHash },
    });
    await tx.usuario.update({
      where: { id: u.id },
      data: { tentativasFalhas: 0, bloqueadoAte: null },
    });
    await registrarAuditoria(tx, {
      usuarioId: u.id,
      acao: 'definiu nova senha',
      entidade: 'Usuario',
      entidadeId: u.id,
      antes: null,
      depois: { senha: 'alterada' },
      ip,
    });
  });
  return true;
}
