'use server';

import { formatarHorario, formatarDiaSemanaData } from '@ceak/core/format';
import { servicoPorSlug } from '@ceak/core/regras';
import { solicitacaoAjudaSchema } from '@ceak/core/validacao';
import { ErroNegocio, solicitarAtendimento } from '@ceak/db';
import { errosDoZod, MSG_FALHA, MSG_LIMITE, textos, type EstadoForm } from '@/lib/formulario';
import { adapters, dentroDoLimite, ipDaRequisicao, log } from '@/lib/servidor';

export interface EstadoAtendimento extends EstadoForm {
  confirmado?: { data: string; horario: string };
}

export async function solicitar(_: EstadoAtendimento, form: FormData): Promise<EstadoAtendimento> {
  const servico = servicoPorSlug(String(form.get('servico') ?? ''));
  if (!servico) return { erro: 'Atendimento não encontrado.' };
  const valores = textos(form, ['nome', 'whatsapp', 'relato', 'vagaId']);
  const r = solicitacaoAjudaSchema.safeParse({
    ...valores,
    consentimento: form.get('consentimento') === 'sim',
    site: form.get('site') ?? '',
  });
  if (!r.success) return { erros: errosDoZod(r.error), valores };
  if (!(await dentroDoLimite('assistencia', 4))) return { erro: MSG_LIMITE, valores };
  try {
    const res = await solicitarAtendimento(servico, r.data, {
      whatsapp: adapters().whatsapp,
      log,
      ip: await ipDaRequisicao(),
    });
    return {
      ok: true,
      confirmado: { data: formatarDiaSemanaData(res.inicio), horario: formatarHorario(res.inicio) },
    };
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message, erros: { vagaId: e.message }, valores };
    log.error('APLICACAO', 'assistencia.falha', {
      rota: '/preciso-de-ajuda',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA, valores };
  }
}
