import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { hashSenha } from '@ceak/core/auth';
import { TERMO_LGPD_VERSAO } from '@ceak/core/validacao';
import { registrarAuditoria } from '../auditoria';
import { prisma } from '../client';
import { ErroNegocio } from './inscricoes';

const TTL_MS = 20 * 60_000;
const destino = (pessoaId: string) => `vincular-app:${pessoaId}`;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Administrador emite convite somente após verificação presencial.
 * O token de 256 bits nunca é salvo em texto claro e nunca entra na auditoria.
 */
export async function emitirConviteVinculacao(
  pessoaId: string,
  administradorId: string,
  ip: string | null,
  baseApp: string,
) {
  const admin = await prisma.usuario.findUnique({
    where: { id: administradorId },
    select: { ativo: true, perfil: true },
  });
  if (!admin?.ativo || admin.perfil !== 'ADMINISTRADOR') {
    throw new ErroNegocio('Somente administradores podem liberar vínculos.', 'sem_permissao');
  }
  const token = randomBytes(32).toString('base64url');
  await prisma.$transaction(async (tx) => {
    const pessoa = await tx.pessoa.findUnique({
      where: { id: pessoaId },
      select: { email: true, usuario: { select: { id: true } }, anonimizadaEm: true },
    });
    if (!pessoa || pessoa.anonimizadaEm || !pessoa.email || pessoa.usuario) {
      throw new ErroNegocio(
        'Cadastro indisponível para vinculação. Verifique se possui e-mail e se ainda não tem conta.',
        'cadastro_indisponivel',
      );
    }
    // Convites antigos perdem a validade ao gerar um novo.
    await tx.codigoAcesso.updateMany({
      where: { destino: destino(pessoaId), canal: 'EMAIL', usadoEm: null },
      data: { usadoEm: new Date() },
    });
    await tx.codigoAcesso.create({
      data: {
        destino: destino(pessoaId),
        canal: 'EMAIL',
        codigoHash: digest(token),
        expiraEm: new Date(Date.now() + TTL_MS),
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: administradorId,
      acao: 'emitiu convite de vínculo após conferência presencial',
      entidade: 'Pessoa',
      entidadeId: pessoaId,
      antes: null,
      depois: { tipo: 'vinculacao_app', validadeMinutos: 20 },
      ip,
    });
  });
  const url = new URL('/ativar-conta', baseApp);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('URL do App inválida');
  url.searchParams.set('p', pessoaId);
  url.searchParams.set('t', token);
  return { url: url.toString(), validadeMinutos: 20 };
}

/**
 * O titular apresenta convite de uso único e escolhe a própria senha.
 * A conta é criada como VISITANTE: perfis administrativos não são promovidos
 * automaticamente pelo processo de vinculação de histórico.
 */
export async function ativarContaVinculada(
  pessoaId: string,
  token: string,
  senha: string,
  ip: string | null,
) {
  if (!/^[0-9a-f-]{36}$/i.test(pessoaId) || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new ErroNegocio('Convite inválido ou expirado.', 'convite_invalido');
  }
  const senhaHash = await hashSenha(senha);
  const usuario = await prisma.$transaction(async (tx) => {
    const convite = await tx.codigoAcesso.findFirst({
      where: {
        destino: destino(pessoaId),
        canal: 'EMAIL',
        usadoEm: null,
        expiraEm: { gt: new Date() },
      },
      orderBy: { criadoEm: 'desc' },
      select: { id: true, codigoHash: true },
    });
    if (!convite || !timingSafeEqual(Buffer.from(convite.codigoHash), Buffer.from(digest(token)))) {
      throw new ErroNegocio('Convite inválido ou expirado.', 'convite_invalido');
    }
    const pessoa = await tx.pessoa.findUnique({
      where: { id: pessoaId },
      select: { email: true, usuario: { select: { id: true } }, anonimizadaEm: true },
    });
    if (!pessoa?.email || pessoa.anonimizadaEm || pessoa.usuario) {
      throw new ErroNegocio('Este cadastro já possui conta ou não pode ser ativado.', 'conta_indisponivel');
    }
    // Consumo atômico: só uma requisição concorrente pode usar este convite.
    const consumo = await tx.codigoAcesso.updateMany({
      where: { id: convite.id, usadoEm: null, expiraEm: { gt: new Date() } },
      data: { usadoEm: new Date() },
    });
    if (consumo.count !== 1) throw new ErroNegocio('Convite já utilizado.', 'convite_utilizado');
    const nova = await tx.usuario.create({
      data: {
        pessoaId,
        email: pessoa.email,
        perfil: 'VISITANTE',
        credencial: { create: { senhaHash } },
      },
      select: { id: true, email: true },
    });
    await tx.pessoa.update({
      where: { id: pessoaId },
      data: { consentimentoEm: new Date(), consentimentoVersao: TERMO_LGPD_VERSAO },
    });
    await registrarAuditoria(tx, {
      usuarioId: nova.id,
      acao: 'ativou conta do App por convite de uso único',
      entidade: 'Pessoa',
      entidadeId: pessoaId,
      antes: null,
      depois: { contaAtivada: true, perfil: 'VISITANTE' },
      ip,
    });
    return nova;
  });
  return usuario;
}
