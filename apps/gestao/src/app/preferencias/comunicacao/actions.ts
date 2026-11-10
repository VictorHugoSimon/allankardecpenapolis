'use server';

import { revalidatePath } from 'next/cache';
import { comRls, registrarAuditoria, preferenciasComunicacaoDisponiveis } from '@ceak/db';
import { exigirSessao, contextoRls } from '@/lib/auth';

const canais = ['EMAIL', 'WHATSAPP'] as const;
const VERSAO = 'agradecimento-doacao-v1';

/** A pessoa autenticada só pode alterar as próprias preferências.
 * Cadastro geral não gera opt-in para nenhum canal.
 */
export async function alterarMinhaPreferencia(form: FormData): Promise<void> {
  const sessao = await exigirSessao();
  const canal = String(form.get('canal') ?? '');
  const decisao = String(form.get('decisao') ?? '');
  const confirmacao = String(form.get('confirmacao') ?? '');
  if (
    !canais.some((c) => c === canal) ||
    !['AUTORIZAR', 'REVOGAR'].includes(decisao) ||
    confirmacao !== 'CONFIRMO'
  ) {
    throw new Error('Canal, decisão ou confirmação inválidos.');
  }
  if (!(await preferenciasComunicacaoDisponiveis())) {
    throw new Error('Preferências indisponíveis até a migração do banco.');
  }
  const autorizar = decisao === 'AUTORIZAR';
  const agora = new Date();
  await comRls(contextoRls(sessao), async (tx) => {
    const pessoa = await tx.pessoa.findUnique({
      where: { id: sessao.pessoaId },
      select: { id: true, consentimentoEm: true, exclusaoSolicitadaEm: true, anonimizadaEm: true },
    });
    if (
      !pessoa ||
      (autorizar &&
        (!pessoa.consentimentoEm || pessoa.exclusaoSolicitadaEm || pessoa.anonimizadaEm))
    ) {
      throw new Error('Cadastro indisponível para autorizar esta comunicação.');
    }
    const chave = {
      pessoaId_canal_finalidade: {
        pessoaId: pessoa.id,
        canal,
        finalidade: 'AGRADECIMENTO_DOACAO',
      },
    };
    const anterior = await tx.preferenciaComunicacao.findUnique({
      where: chave,
      select: { id: true, autorizado: true, atualizadoEm: true },
    });
    if (anterior?.autorizado === autorizar) return;
    const registro = await tx.preferenciaComunicacao.upsert({
      where: chave,
      create: {
        pessoaId: pessoa.id,
        canal,
        finalidade: 'AGRADECIMENTO_DOACAO',
        autorizado: autorizar,
        versao: VERSAO,
        origem: 'AUTODECLARACAO_GESTAO',
        consentidoEm: autorizar ? agora : null,
        revogadoEm: autorizar ? null : agora,
      },
      update: {
        autorizado: autorizar,
        versao: VERSAO,
        origem: 'AUTODECLARACAO_GESTAO',
        consentidoEm: autorizar ? agora : null,
        revogadoEm: autorizar ? null : agora,
      },
      select: { id: true },
    });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: autorizar
        ? 'comunicacao.consentimento.autorizado'
        : 'comunicacao.consentimento.revogado',
      entidade: 'PreferenciaComunicacao',
      entidadeId: registro.id,
      ip: null,
      antes: { canal, autorizado: anterior?.autorizado ?? false },
      depois: { canal, autorizado: autorizar, versao: VERSAO, origem: 'AUTODECLARACAO_GESTAO' },
    });
  });
  revalidatePath('/preferencias/comunicacao');
}
