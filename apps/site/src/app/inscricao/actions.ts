'use server';

import { inscricaoSchema } from '@ceak/core/validacao';
import { ErroNegocio, inscreverEmEvento, preInscreverEmCurso } from '@ceak/db';
import { errosDoZod, MSG_FALHA, MSG_LIMITE, textos, type EstadoForm } from '@/lib/formulario';
import { adapters, dentroDoLimite, log } from '@/lib/servidor';

export async function inscrever(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const valores = textos(form, ['nome', 'whatsapp', 'email']);
  const r = inscricaoSchema.safeParse({
    ...valores,
    primeiraVez: form.get('primeiraVez') === 'sim',
    consentimento: form.get('consentimento') === 'sim',
    site: form.get('site') ?? '',
  });
  if (!r.success) return { erros: errosDoZod(r.error), valores };
  if (!(await dentroDoLimite('inscricao'))) return { erro: MSG_LIMITE, valores };
  const evento = String(form.get('evento') ?? '');
  const curso = String(form.get('curso') ?? '');
  try {
    const deps = { whatsapp: adapters().whatsapp };
    if (evento) await inscreverEmEvento(evento, r.data, deps);
    else if (curso) await preInscreverEmCurso(curso, r.data, deps);
    else return { erro: 'Escolha uma atividade para se inscrever.', valores };
    log.info('APLICACAO', `inscricao.criada · ${evento || curso}`, {
      rota: '/inscricao',
      status: 201,
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message, valores };
    log.error('APLICACAO', 'inscricao.falha', {
      rota: '/inscricao',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA, valores };
  }
}
