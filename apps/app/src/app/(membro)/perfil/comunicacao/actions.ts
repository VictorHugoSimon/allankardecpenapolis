'use server';

import { revalidatePath } from 'next/cache';
import { comRls, registrarAuditoria, preferenciasComunicacaoDisponiveis } from '@ceak/db';
import { exigirSessao } from '@/lib/servidor';

const VERSAO = 'agradecimento-doacao-v1';
const CANAIS = ['EMAIL', 'WHATSAPP'] as const;

/** Apenas o próprio titular modifica seu opt-in; nunca envia mensagens. */
export async function salvarPreferenciaComunicacao(form: FormData): Promise<void> {
  const sessao = await exigirSessao();
  const canal = String(form.get('canal') ?? '');
  const decisao = String(form.get('decisao') ?? '');
  if (
    !CANAIS.some((c) => c === canal) ||
    !['AUTORIZAR', 'REVOGAR'].includes(decisao) ||
    form.get('confirmacao') !== 'CONFIRMO'
  ) {
    throw new Error('Escolha inválida. Confirme a sua decisão.');
  }
  if (!(await preferenciasComunicacaoDisponiveis())) {
    throw new Error('Preferências indisponíveis até a migração do banco.');
  }
  const autorizar = decisao === 'AUTORIZAR';
  const agora = new Date();
  await comRls(
    {
      usuarioId: sessao.usuarioId,
      pessoaId: sessao.pessoaId,
      perfil: sessao.perfil,
      coordAssistencia: sessao.coordAssistencia,
    },
    async (tx) => {
      const pessoa = await tx.pessoa.findUnique({
        where: { id: sessao.pessoaId },
        select: {
          id: true,
          consentimentoEm: true,
          exclusaoSolicitadaEm: true,
          anonimizadaEm: true,
        },
      });
      if (
        !pessoa ||
        (autorizar &&
          (!pessoa.consentimentoEm || pessoa.exclusaoSolicitadaEm || pessoa.anonimizadaEm))
      ) {
        throw new Error('Cadastro indisponível para esta autorização.');
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
        select: { id: true, autorizado: true },
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
          origem: 'AUTODECLARACAO_APP',
          consentidoEm: autorizar ? agora : null,
          revogadoEm: autorizar ? null : agora,
        },
        update: {
          autorizado: autorizar,
          versao: VERSAO,
          origem: 'AUTODECLARACAO_APP',
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
        antes: { canal, autorizado: anterior?.autorizado ?? false },
        depois: { canal, autorizado: autorizar, versao: VERSAO, origem: 'AUTODECLARACAO_APP' },
        ip: null,
      });
    },
  );
  revalidatePath('/perfil/comunicacao');
}
