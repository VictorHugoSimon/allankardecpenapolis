import {
  cifrarSegredo,
  decifrarSegredo,
  gerarCodigosRecuperacao,
  gerarSegredoTotp,
  hashCodigoRecuperacao,
  uriTotp,
  verificarTotp,
} from '@ceak/core/auth';
import { type Perfil } from '@ceak/core/rbac';
import { registrarAuditoria } from '../auditoria';
import { prisma } from '../client';
import { ErroNegocio } from './inscricoes';

/** Perfis que precisam do autenticador (Configurações › Segurança e LGPD). */
export const PERFIS_2FA_PADRAO: Perfil[] = ['ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'];
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60_000;

async function perfisObrigatorios(): Promise<Perfil[]> {
  const c = await prisma.configuracao.findUnique({
    where: { chave: 'seguranca.doisFatoresObrigatorio' },
  });
  return Array.isArray(c?.valor) ? (c.valor as Perfil[]) : PERFIS_2FA_PADRAO;
}

export type Etapa2fa = 'nenhuma' | 'verificar' | 'configurar';

/**
 * O que falta depois da senha: quem já ativou o autenticador sempre confirma
 * o código; quem tem uma função que exige e ainda não ativou precisa configurar.
 */
export async function etapaDoisFatores(
  usuarioId: string,
): Promise<{ etapa: Etapa2fa; ativadoEm: Date | null }> {
  const u = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      perfil: true,
      perfisExtras: true,
      credencial: { select: { totpSegredo: true, totpAtivadoEm: true } },
    },
  });
  if (!u) return { etapa: 'nenhuma', ativadoEm: null };
  if (u.credencial?.totpSegredo)
    return { etapa: 'verificar', ativadoEm: u.credencial.totpAtivadoEm };
  const exigidos = await perfisObrigatorios();
  const exige = [u.perfil, ...u.perfisExtras].some((p) => exigidos.includes(p));
  return { etapa: exige ? 'configurar' : 'nenhuma', ativadoEm: null };
}

/** Data de ativação atual (usada para validar o "lembrar este navegador"). */
export async function totpAtivadoEm(usuarioId: string): Promise<Date | null> {
  const c = await prisma.credencial.findUnique({
    where: { usuarioId },
    select: { totpAtivadoEm: true, totpSegredo: true },
  });
  return c?.totpSegredo ? c.totpAtivadoEm : null;
}

/** Gera (ou reaproveita) o segredo pendente e devolve os dados para o QR Code. */
export async function iniciarConfiguracao2fa(usuarioId: string, chave: string) {
  const u = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuarioId },
    select: { email: true, credencial: { select: { totpPendente: true, totpSegredo: true } } },
  });
  if (u.credencial?.totpSegredo) throw new ErroNegocio('O autenticador já está ativo.', 'ja_ativo');
  let segredo = u.credencial?.totpPendente
    ? decifrarSegredo(u.credencial.totpPendente, chave)
    : null;
  if (!segredo) {
    segredo = gerarSegredoTotp();
    await prisma.credencial.update({
      where: { usuarioId },
      data: { totpPendente: cifrarSegredo(segredo, chave) },
    });
  }
  return { segredo, uri: uriTotp(segredo, u.email), conta: u.email };
}

async function registrarFalha(usuarioId: string) {
  const u = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { tentativasFalhas: { increment: 1 } },
    select: { tentativasFalhas: true },
  });
  if (u.tentativasFalhas >= MAX_TENTATIVAS) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { bloqueadoAte: new Date(Date.now() + BLOQUEIO_MS) },
    });
  }
}

async function bloqueado(usuarioId: string) {
  const u = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { bloqueadoAte: true, ativo: true },
  });
  return !u?.ativo || (!!u.bloqueadoAte && u.bloqueadoAte > new Date());
}

/** Confirma o primeiro código, ativa o autenticador e devolve os códigos de recuperação (mostrados uma vez). */
export async function confirmarConfiguracao2fa(
  usuarioId: string,
  codigo: string,
  chave: string,
  ip: string | null,
) {
  if (await bloqueado(usuarioId))
    throw new ErroNegocio('Muitas tentativas. Tente novamente em 15 minutos.', 'bloqueado');
  const c = await prisma.credencial.findUniqueOrThrow({
    where: { usuarioId },
    select: { totpPendente: true },
  });
  if (!c.totpPendente)
    throw new ErroNegocio('Configuração expirada. Recomece pelo login.', 'sem_pendente');
  const segredo = decifrarSegredo(c.totpPendente, chave);
  const passo = verificarTotp(segredo, codigo);
  if (passo === null) {
    await registrarFalha(usuarioId);
    throw new ErroNegocio(
      'Código incorreto. Confira o horário do celular e tente o código atual.',
      'codigo',
    );
  }
  const codigos = gerarCodigosRecuperacao();
  await prisma.$transaction(async (tx) => {
    await tx.credencial.update({
      where: { usuarioId },
      data: {
        totpSegredo: c.totpPendente,
        totpPendente: null,
        totpAtivadoEm: new Date(),
        totpUltimoPasso: passo,
        codigosRecuperacao: codigos.map(hashCodigoRecuperacao),
      },
    });
    await tx.usuario.update({
      where: { id: usuarioId },
      data: { doisFatores: true, tentativasFalhas: 0, bloqueadoAte: null },
    });
    await registrarAuditoria(tx, {
      usuarioId,
      acao: 'ativou o autenticador (2FA)',
      entidade: 'Usuario',
      entidadeId: usuarioId,
      antes: { doisFatores: false },
      depois: { doisFatores: true },
      ip,
    });
  });
  return codigos;
}

/**
 * Segundo fator no login: código do autenticador ou um código de recuperação
 * (que deixa de valer depois de usado). 5 erros bloqueiam por 15 minutos.
 */
export async function verificarSegundoFator(
  usuarioId: string,
  codigo: string,
  chave: string,
  ip: string | null,
): Promise<
  | { ok: true; recuperacao: boolean; restantes: number }
  | { ok: false; motivo: 'bloqueado' | 'invalido' }
> {
  if (await bloqueado(usuarioId)) return { ok: false, motivo: 'bloqueado' };
  const c = await prisma.credencial.findUnique({
    where: { usuarioId },
    select: { totpSegredo: true, totpUltimoPasso: true, codigosRecuperacao: true },
  });
  if (!c?.totpSegredo) return { ok: false, motivo: 'invalido' };
  const limpo = codigo.trim();
  if (/^\d{6}$/.test(limpo.replace(/\s/g, ''))) {
    const passo = verificarTotp(decifrarSegredo(c.totpSegredo, chave), limpo, {
      ultimoPasso: c.totpUltimoPasso,
    });
    if (passo !== null) {
      // Atualização condicional: duas requisições com o mesmo código não passam juntas.
      const n = await prisma.credencial.updateMany({
        where: { usuarioId, OR: [{ totpUltimoPasso: null }, { totpUltimoPasso: { lt: passo } }] },
        data: { totpUltimoPasso: passo },
      });
      if (n.count === 1) {
        await prisma.usuario.update({ where: { id: usuarioId }, data: { tentativasFalhas: 0 } });
        return { ok: true, recuperacao: false, restantes: c.codigosRecuperacao.length };
      }
    }
  } else {
    const h = hashCodigoRecuperacao(limpo);
    if (c.codigosRecuperacao.includes(h)) {
      const restantes = c.codigosRecuperacao.filter((x) => x !== h);
      await prisma.$transaction(async (tx) => {
        await tx.credencial.update({
          where: { usuarioId },
          data: { codigosRecuperacao: restantes },
        });
        await tx.usuario.update({ where: { id: usuarioId }, data: { tentativasFalhas: 0 } });
        await registrarAuditoria(tx, {
          usuarioId,
          acao: 'entrou com código de recuperação (2FA)',
          entidade: 'Usuario',
          entidadeId: usuarioId,
          antes: { codigosRestantes: c.codigosRecuperacao.length },
          depois: { codigosRestantes: restantes.length },
          ip,
        });
      });
      return { ok: true, recuperacao: true, restantes: restantes.length };
    }
  }
  await registrarFalha(usuarioId);
  return { ok: false, motivo: 'invalido' };
}

/** Administrador redefine o autenticador (celular perdido): no próximo login a pessoa configura de novo. */
export async function redefinir2fa(autorId: string, usuarioId: string, ip: string | null) {
  await prisma.$transaction(async (tx) => {
    await tx.credencial.updateMany({
      where: { usuarioId },
      data: {
        totpSegredo: null,
        totpPendente: null,
        totpAtivadoEm: null,
        totpUltimoPasso: null,
        codigosRecuperacao: [],
      },
    });
    await tx.usuario.update({ where: { id: usuarioId }, data: { doisFatores: false } });
    await registrarAuditoria(tx, {
      usuarioId: autorId,
      acao: 'redefiniu o autenticador (2FA)',
      entidade: 'Usuario',
      entidadeId: usuarioId,
      antes: { doisFatores: true },
      depois: { doisFatores: false },
      ip,
    });
  });
}

/** Situação do autenticador por usuário (lista de Configurações › Usuários). */
export async function situacao2fa(usuarioIds: string[]) {
  const [cs, exigidos, us] = await Promise.all([
    prisma.credencial.findMany({
      where: { usuarioId: { in: usuarioIds } },
      select: { usuarioId: true, totpSegredo: true, codigosRecuperacao: true },
    }),
    perfisObrigatorios(),
    prisma.usuario.findMany({
      where: { id: { in: usuarioIds } },
      select: { id: true, perfil: true, perfisExtras: true },
    }),
  ]);
  return Object.fromEntries(
    us.map((u) => {
      const c = cs.find((x) => x.usuarioId === u.id);
      const exige = [u.perfil, ...u.perfisExtras].some((p) => exigidos.includes(p));
      return [
        u.id,
        { ativo: !!c?.totpSegredo, exige, codigosRestantes: c?.codigosRecuperacao.length ?? 0 },
      ];
    }),
  ) as Record<string, { ativo: boolean; exige: boolean; codigosRestantes: number }>;
}
