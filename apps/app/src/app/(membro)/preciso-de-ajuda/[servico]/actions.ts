'use server';

import { formatarDiaSemanaData, formatarHorario } from '@ceak/core/format';
import { servicoPorSlug } from '@ceak/core/regras';
import { solicitacaoAjudaSchema } from '@ceak/core/validacao';
import { ErroNegocio, perfilMembro, solicitarAtendimento } from '@ceak/db';
import { errosDoZod, MSG_FALHA, MSG_LIMITE, textos, type EstadoForm } from '@/lib/formulario';
import { adapters, dentroDoLimite, exigirSessao, ipDaRequisicao, log } from '@/lib/servidor';

export interface EstadoAtendimento extends EstadoForm {
  confirmado?: { data: string; horario: string };
}

/**
 * Solicitação pelo App: nome e WhatsApp vêm da conta. O relato é opcional e,
 * por ser dado sensível, exige o consentimento específico quando preenchido.
 */
export async function solicitar(_: EstadoAtendimento, form: FormData): Promise<EstadoAtendimento> {
  const s = await exigirSessao();
  const servico = servicoPorSlug(String(form.get('servico') ?? ''));
  if (!servico) return { erro: 'Atendimento não encontrado.' };
  const valores = textos(form, ['whatsapp', 'relato', 'vagaId']);
  const perfil = await perfilMembro(s.pessoaId);
  const relato = valores.relato?.trim();
  const r = solicitacaoAjudaSchema.safeParse({
    nome: perfil?.nome ?? s.nome,
    whatsapp: perfil?.whatsapp ?? valores.whatsapp,
    relato,
    vagaId: valores.vagaId,
    consentimento: relato ? form.get('consentimento') === 'sim' : true,
  });
  if (!r.success) return { erros: errosDoZod(r.error), valores };
  if (!(await dentroDoLimite('app-assistencia', 4))) return { erro: MSG_LIMITE, valores };
  try {
    const res = await solicitarAtendimento(
      servico,
      r.data,
      {
        whatsapp: adapters().whatsapp,
        log,
        ip: await ipDaRequisicao(),
      },
      { pessoaId: s.pessoaId },
    );
    return {
      ok: true,
      confirmado: { data: formatarDiaSemanaData(res.inicio), horario: formatarHorario(res.inicio) },
    };
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message, erros: { vagaId: e.message }, valores };
    log.error('APLICACAO', 'app: assistência falhou', {
      rota: '/preciso-de-ajuda',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA, valores };
  }
}
