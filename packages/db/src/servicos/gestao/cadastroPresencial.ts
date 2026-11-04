import { TERMO_LGPD_VERSAO } from '@ceak/core/validacao';
import { registrarAuditoria } from '../../auditoria';
import { comRls, type ContextoRls } from '../../rls';
import { ErroNegocio } from '../inscricoes';

/**
 * Cadastro presencial para primeiro uso. Não cria conta de login,
 * não atribui perfil administrativo e não declara consentimento sem confirmação.
 */
export interface NovoCadastroPresencial {
  nome: string;
  email?: string;
  whatsapp?: string;
  cidade?: string;
  consentimento: boolean;
}

export function validarCadastroPresencial(d: NovoCadastroPresencial) {
  const nome = d.nome.trim().replace(/\s+/g, ' ');
  const email = d.email?.trim().toLowerCase() || undefined;
  const whatsapp = d.whatsapp?.replace(/[^\d+]/g, '') || undefined;
  const cidade = d.cidade?.trim().replace(/\s+/g, ' ') || undefined;
  if (nome.length < 2 || nome.length > 120) {
    throw new ErroNegocio('Informe um nome entre 2 e 120 caracteres.', 'nome');
  }
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new ErroNegocio('E-mail inválido.', 'email');
  }
  if (whatsapp && !/^\+55\d{10,11}$/.test(whatsapp)) {
    throw new ErroNegocio('WhatsApp deve conter DDD e telefone brasileiro (+55).', 'whatsapp');
  }
  if (cidade && cidade.length > 100) {
    throw new ErroNegocio('Cidade muito longa.', 'cidade');
  }
  if (!email && !whatsapp) {
    throw new ErroNegocio(
      'Informe pelo menos um contato para evitar cadastros sem identificação.',
      'contato',
    );
  }
  return { nome, email, whatsapp, cidade, consentimento: d.consentimento === true };
}

export async function cadastrarVisitantePresencial(
  ctx: ContextoRls & { usuarioId: string },
  dados: NovoCadastroPresencial,
  ip: string | null,
) {
  // Restrito à secretaria e administração. Nenhum perfil privilegiado é criado.
  if (!['ADMINISTRADOR', 'SECRETARIA'].includes(ctx.perfil)) {
    throw new ErroNegocio('Seu perfil não pode cadastrar pessoas.', 'sem_permissao');
  }
  const d = validarCadastroPresencial(dados);
  return comRls(ctx, async (tx) => {
    const duplicado = await tx.pessoa.findFirst({
      where: {
        OR: [
          ...(d.email ? [{ email: d.email }] : []),
          ...(d.whatsapp ? [{ whatsapp: d.whatsapp }] : []),
        ],
      },
      select: { id: true },
    });
    if (duplicado) {
      throw new ErroNegocio(
        'Já existe um cadastro com este e-mail ou WhatsApp. Consulte a lista de pessoas.',
        'duplicado',
      );
    }
    const pessoa = await tx.pessoa.create({
      data: {
        nome: d.nome,
        email: d.email,
        whatsapp: d.whatsapp,
        cidade: d.cidade,
        perfil: 'VISITANTE',
        status: 'NOVO',
        ...(d.consentimento
          ? {
              consentimentoEm: new Date(),
              consentimentoVersao: TERMO_LGPD_VERSAO,
            }
          : {}),
      },
      select: { id: true },
    });
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: 'cadastrou visitante presencialmente',
      entidade: 'Pessoa',
      entidadeId: pessoa.id,
      antes: null,
      // Evita gravar nome, telefone e e-mail em texto no histórico de auditoria.
      depois: { perfil: 'VISITANTE', status: 'NOVO', consentimento: d.consentimento },
      ip,
    });
    return pessoa;
  });
}
