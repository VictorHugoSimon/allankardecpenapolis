'use server';

import { revalidatePath } from 'next/cache';
import { aprovacoesAgradecimentoDisponiveis, comRls, registrarAuditoria } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { temConsentimentoCanal } from '@/lib/consentimentoPorCanal';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CANAIS = ['EMAIL', 'WHATSAPP'] as const;
type Canal = (typeof CANAIS)[number];

function parametros(form: FormData): { doacaoId: string; canal: Canal } {
  const doacaoId = String(form.get('doacaoId') ?? '');
  const canal = String(form.get('canal') ?? '');
  if (!uuid.test(doacaoId) || !CANAIS.some((c) => c === canal)) {
    throw new Error('Doação ou canal inválido.');
  }
  return { doacaoId, canal: canal as Canal };
}
async function sessaoAdministrador() {
  const sessao = await exigirModulo('doacoes');
  if (sessao.perfil !== 'ADMINISTRADOR') throw new Error('Ação reservada ao administrador.');
  return sessao;
}

/** Prepara somente a solicitação interna; nenhum envio é criado ou executado. */
export async function prepararAgradecimento(form: FormData): Promise<void> {
  const sessao = await sessaoAdministrador();
  if (!(await aprovacoesAgradecimentoDisponiveis())) {
    throw new Error('Aprovações indisponíveis até a migração do banco.');
  }
  const { doacaoId, canal } = parametros(form);
  if (form.get('confirmacao') !== 'PREPARAR') throw new Error('Confirmação obrigatória.');
  await comRls(contextoRls(sessao), async (tx) => {
    const d = await tx.doacao.findFirst({
      where: {
        id: doacaoId,
        statusPagamento: 'PAGO',
        pagoEm: { not: null },
        reciboEmitidoEm: { not: null },
        pessoaId: { not: null },
      },
      select: { id: true, pessoaId: true },
    });
    if (!d?.pessoaId) throw new Error('Doação sem recibo ou identificação válida.');
    const existente = await tx.aprovacaoAgradecimento.findUnique({
      where: { doacaoId_canal: { doacaoId, canal } },
      select: { id: true },
    });
    if (existente) return;
    const registro = await tx.aprovacaoAgradecimento.create({
      data: { doacaoId, pessoaId: d.pessoaId, canal, criadoPorId: sessao.usuarioId },
      select: { id: true },
    });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'agradecimento.rascunho.criado',
      entidade: 'AprovacaoAgradecimento',
      entidadeId: registro.id,
      ip: null,
      antes: null,
      depois: { doacaoId, canal, status: 'RASCUNHO', envioHabilitado: false },
    });
  });
  revalidatePath(`/doacoes/recibos/${doacaoId}`);
}

/** Aprovação interna não substitui opt-in e NÃO constitui autorização de envio. */
export async function analisarAgradecimento(form: FormData): Promise<void> {
  const sessao = await sessaoAdministrador();
  const { doacaoId, canal } = parametros(form);
  if (form.get('confirmacao') !== 'ANALISAR') throw new Error('Confirmação obrigatória.');
  await comRls(contextoRls(sessao), async (tx) => {
    const aprovacao = await tx.aprovacaoAgradecimento.findUnique({
      where: { doacaoId_canal: { doacaoId, canal } },
      select: { id: true, status: true, pessoaId: true },
    });
    if (!aprovacao || aprovacao.status !== 'RASCUNHO') {
      throw new Error('Somente rascunhos podem ser analisados.');
    }
    const d = await tx.doacao.findFirst({
      where: {
        id: doacaoId,
        pessoaId: aprovacao.pessoaId,
        statusPagamento: 'PAGO',
        pagoEm: { not: null },
        reciboEmitidoEm: { not: null },
      },
      select: {
        id: true,
        pessoa: {
          select: {
            consentimentoEm: true,
            exclusaoSolicitadaEm: true,
            anonimizadaEm: true,
            usuario: { select: { ativo: true } },
          },
        },
      },
    });
    const p = await tx.preferenciaComunicacao.findUnique({
      where: {
        pessoaId_canal_finalidade: {
          pessoaId: aprovacao.pessoaId,
          canal,
          finalidade: 'AGRADECIMENTO_DOACAO',
        },
      },
      select: {
        canal: true,
        finalidade: true,
        autorizado: true,
        consentidoEm: true,
        revogadoEm: true,
        versao: true,
      },
    });
    const valido =
      !!d?.pessoa?.consentimentoEm &&
      !d.pessoa.exclusaoSolicitadaEm &&
      !d.pessoa.anonimizadaEm &&
      d.pessoa.usuario?.ativo === true &&
      temConsentimentoCanal(p, canal);
    if (!valido) {
      await tx.tentativaAgradecimento.create({
        data: {
          aprovacaoId: aprovacao.id,
          usuarioId: sessao.usuarioId,
          resultado: 'ANALISE_BLOQUEADA',
          motivo: 'Sem consentimento específico válido ou cadastro elegível',
        },
      });
      await registrarAuditoria(tx, {
        usuarioId: sessao.usuarioId,
        acao: 'agradecimento.analise.bloqueada',
        entidade: 'AprovacaoAgradecimento',
        entidadeId: aprovacao.id,
        ip: null,
        antes: { status: 'RASCUNHO' },
        depois: { status: 'RASCUNHO', canal, bloqueado: true },
      });
      return;
    }
    const atualizado = await tx.aprovacaoAgradecimento.updateMany({
      where: { id: aprovacao.id, status: 'RASCUNHO' },
      data: { status: 'APROVADO', aprovadoPorId: sessao.usuarioId, aprovadoEm: new Date() },
    });
    if (atualizado.count !== 1) throw new Error('Registro alterado em outra sessão.');
    await tx.tentativaAgradecimento.create({
      data: {
        aprovacaoId: aprovacao.id,
        usuarioId: sessao.usuarioId,
        resultado: 'APROVACAO_INTERNA',
        motivo: 'Aprovado internamente; entrega externa não habilitada',
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'agradecimento.aprovado.internamente',
      entidade: 'AprovacaoAgradecimento',
      entidadeId: aprovacao.id,
      ip: null,
      antes: { status: 'RASCUNHO' },
      depois: { status: 'APROVADO', canal, envioHabilitado: false },
    });
  });
  revalidatePath(`/doacoes/recibos/${doacaoId}`);
}

/** Cancela uma solicitação ou aprovação interna sem apagar o histórico.
 * Nenhuma autorização de canal é alterada e nenhuma mensagem é enviada.
 */
export async function cancelarAgradecimento(form: FormData): Promise<void> {
  const sessao = await sessaoAdministrador();
  if (!(await aprovacoesAgradecimentoDisponiveis())) {
    throw new Error('Aprovações indisponíveis até a migração do banco.');
  }
  const { doacaoId, canal } = parametros(form);
  if (form.get('confirmacao') !== 'CANCELAR') {
    throw new Error('Confirme o cancelamento da aprovação interna.');
  }
  const motivo = String(form.get('motivo') ?? '').trim();
  if (motivo.length < 10 || motivo.length > 300) {
    throw new Error('Informe um motivo de 10 a 300 caracteres.');
  }

  await comRls(contextoRls(sessao), async (tx) => {
    const registro = await tx.aprovacaoAgradecimento.findUnique({
      where: { doacaoId_canal: { doacaoId, canal } },
      select: { id: true, status: true },
    });
    if (!registro || !['RASCUNHO', 'APROVADO'].includes(registro.status)) {
      throw new Error('Somente solicitações abertas ou aprovadas podem ser canceladas.');
    }
    const alterado = await tx.aprovacaoAgradecimento.updateMany({
      where: { id: registro.id, status: registro.status },
      data: { status: 'CANCELADO', aprovadoPorId: null, aprovadoEm: null },
    });
    if (alterado.count !== 1) {
      throw new Error('A aprovação foi alterada por outra sessão. Atualize a página.');
    }
    await tx.tentativaAgradecimento.create({
      data: {
        aprovacaoId: registro.id,
        usuarioId: sessao.usuarioId,
        resultado: 'CANCELAMENTO_INTERNO',
        motivo,
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'agradecimento.aprovacao.cancelada',
      entidade: 'AprovacaoAgradecimento',
      entidadeId: registro.id,
      ip: null,
      antes: { status: registro.status },
      depois: { status: 'CANCELADO', canal, motivo, envioHabilitado: false },
    });
  });
  revalidatePath(`/doacoes/recibos/${doacaoId}`);
}
