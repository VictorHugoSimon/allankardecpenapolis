import { type Logger } from '@ceak/core/logger';
import { PERFIL_LABEL, type Perfil } from '@ceak/core/rbac';
import { registrarAuditoria } from '../../auditoria';
import { prisma } from '../../client';
import { comRls, type ContextoRls } from '../../rls';
import { ErroNegocio } from '../inscricoes';
import { enviarConvite } from '../senha';
import { quandoCurto } from './pessoas';

/** Usuários do Gestão (somente Administrador, pela RLS). */
export async function listarUsuarios(ctx: ContextoRls, agora = new Date()) {
  return comRls(ctx, async (tx) => {
    const us = await tx.usuario.findMany({
      where: { perfil: { notIn: ['MEMBRO', 'VISITANTE'] } },
      orderBy: [{ ativo: 'desc' }, { pessoa: { nome: 'asc' } }],
      select: {
        id: true,
        email: true,
        perfil: true,
        perfisExtras: true,
        ativo: true,
        coordAssistencia: true,
        doisFatores: true,
        ultimoAcessoEm: true,
        pessoa: { select: { nome: true } },
      },
    });
    return us.map((u) => {
      const [local] = u.email.split('@');
      const ultimo = u.ultimoAcessoEm;
      return {
        id: u.id,
        nome: u.pessoa.nome,
        email: u.email,
        emailCurto: `${local}@…`,
        perfil: u.perfil,
        perfisExtras: u.perfisExtras,
        perfis: [u.perfil, ...u.perfisExtras].map((p) => PERFIL_LABEL[p as Perfil]).join(' · '),
        coordAssistencia: u.coordAssistencia,
        ultimoAcesso: ultimo
          ? `${quandoCurto(ultimo, agora)}${quandoCurto(ultimo, agora) === 'hoje' ? ` ${ultimo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}` : ''}`
          : 'nunca',
        ativo: u.ativo,
      };
    });
  });
}

export interface DadosUsuario {
  perfil: Perfil;
  perfisExtras: Perfil[];
  ativo: boolean;
  coordAssistencia: boolean;
}

/** Altera perfis e situação de um usuário (com auditoria). Protege o último Administrador ativo. */
export async function atualizarUsuario(
  ctx: ContextoRls & { usuarioId: string },
  id: string,
  dados: DadosUsuario,
  autor: { ip: string | null },
  deps: { log: Logger },
) {
  await comRls(ctx, async (tx) => {
    const u = await tx.usuario.findUnique({
      where: { id },
      select: { perfil: true, perfisExtras: true, ativo: true, coordAssistencia: true },
    });
    if (!u) throw new ErroNegocio('Usuário não encontrado.', 'nao_encontrado');
    const deixaDeSerAdmin =
      u.perfil === 'ADMINISTRADOR' && (dados.perfil !== 'ADMINISTRADOR' || !dados.ativo);
    if (deixaDeSerAdmin) {
      const admins = await tx.usuario.count({ where: { perfil: 'ADMINISTRADOR', ativo: true } });
      if (admins <= 1)
        throw new ErroNegocio('É preciso manter ao menos um Administrador ativo.', 'ultimo_admin');
    }
    if (id === ctx.usuarioId && !dados.ativo) {
      throw new ErroNegocio('Você não pode desativar o próprio acesso.', 'proprio');
    }
    const extras = [
      ...new Set(
        dados.perfisExtras.filter((p) => p !== dados.perfil && p !== 'MEMBRO' && p !== 'VISITANTE'),
      ),
    ];
    await tx.usuario.update({
      where: { id },
      data: {
        perfil: dados.perfil,
        perfisExtras: extras,
        ativo: dados.ativo,
        coordAssistencia: dados.coordAssistencia,
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: 'alterou perfil de acesso',
      entidade: 'Usuario',
      entidadeId: id,
      antes: {
        perfil: u.perfil,
        perfisExtras: u.perfisExtras,
        ativo: u.ativo,
        coordAssistencia: u.coordAssistencia,
      },
      depois: {
        perfil: dados.perfil,
        perfisExtras: extras,
        ativo: dados.ativo,
        coordAssistencia: dados.coordAssistencia,
      },
      ip: autor.ip,
    });
  });
  deps.log.info('SEGURANCA', `usuario.perfil.alterado · ${dados.perfil}`, {
    rota: '/config',
    status: 200,
  });
}

/**
 * Convida alguém para o Gestão: reaproveita a pessoa pelo e-mail (ou cria),
 * cria o usuário sem senha e envia o link para definir a senha.
 */
export async function convidarUsuario(
  ctx: ContextoRls & { usuarioId: string },
  dados: { nome: string; email: string; perfil: Perfil },
  deps: {
    enviarEmail: (para: string, assunto: string, texto: string) => Promise<unknown>;
    urlBase: string;
    log: Logger;
    ip: string | null;
  },
) {
  const email = dados.email.toLowerCase();
  const ja = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
  if (ja) throw new ErroNegocio('Já existe um usuário com este e-mail.', 'email_em_uso');
  const novo = await comRls(ctx, async (tx) => {
    const pessoa =
      (await tx.pessoa.findFirst({ where: { email, usuario: null }, select: { id: true } })) ??
      (await tx.pessoa.create({
        data: { nome: dados.nome, email, perfil: dados.perfil, status: 'ATIVO' },
        select: { id: true },
      }));
    const u = await tx.usuario.create({
      data: {
        pessoaId: pessoa.id,
        email,
        perfil: dados.perfil,
        doisFatores: ['ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'].includes(dados.perfil),
      },
      select: { id: true },
    });
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: 'convidou usuário',
      entidade: 'Usuario',
      entidadeId: u.id,
      antes: null,
      depois: { email, perfil: dados.perfil },
      ip: deps.ip,
    });
    return u;
  });
  await enviarConvite(email, dados.nome, deps);
  deps.log.info('SEGURANCA', `usuario.convidado · ${dados.perfil}`, {
    rota: '/config',
    status: 201,
  });
  return novo;
}

/** Itens de Segurança e LGPD (Configuração). */
export const CHAVES_SEGURANCA = [
  {
    chave: 'seguranca.doisFatoresObrigatorio',
    titulo: 'Autenticação em dois fatores',
    descricao: 'Obrigatória para Administrador, Diretoria e Tesouraria',
  },
  {
    chave: 'seguranca.sessaoInatividadeMin',
    titulo: 'Sessão expira por inatividade',
    descricao: '30 minutos',
  },
  {
    chave: 'lgpd.termoVersao',
    titulo: 'Consentimento LGPD no cadastro',
    descricao: 'Termo versão',
  },
  {
    chave: 'assistencia.acessoRestrito',
    titulo: 'Dados de assistência com acesso restrito',
    descricao: 'Somente coordenação de assistência e diretoria',
  },
  { chave: 'seguranca.retencaoLogsMeses', titulo: 'Retenção de logs', descricao: 'meses' },
  {
    chave: 'membros.loginGoogle',
    titulo: 'Login com Google',
    descricao: 'Para membros no CEAK App',
  },
] as const;

export async function configuracoes() {
  const cs = await prisma.configuracao.findMany();
  return Object.fromEntries(cs.map((c) => [c.chave, c.valor])) as Record<string, unknown>;
}

/** Retenção de logs (meses) — único ajuste editável nesta fase; os demais são regras fixas do sistema. */
export async function salvarRetencaoLogs(
  ctx: ContextoRls & { usuarioId: string },
  meses: number,
  autor: { ip: string | null },
) {
  if (!Number.isInteger(meses) || meses < 6 || meses > 120) {
    throw new ErroNegocio('Informe entre 6 e 120 meses.', 'valor');
  }
  await prisma.$transaction(async (tx) => {
    const antes = await tx.configuracao.findUnique({
      where: { chave: 'seguranca.retencaoLogsMeses' },
    });
    await tx.configuracao.upsert({
      where: { chave: 'seguranca.retencaoLogsMeses' },
      create: { chave: 'seguranca.retencaoLogsMeses', valor: meses },
      update: { valor: meses },
    });
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: 'alterou retenção de logs',
      entidade: 'Configuracao',
      entidadeId: 'seguranca.retencaoLogsMeses',
      antes: { valor: antes?.valor ?? null },
      depois: { valor: meses },
      ip: autor.ip,
    });
  });
}
