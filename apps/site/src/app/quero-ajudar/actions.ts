'use server';

import { HABILIDADES } from '@ceak/core/regras';
import { intencaoAjudaSchema } from '@ceak/core/validacao';
import { registrarIntencaoAjuda } from '@ceak/db';
import { errosDoZod, MSG_FALHA, MSG_LIMITE, textos, type EstadoForm } from '@/lib/formulario';
import { adapters, dentroDoLimite, log } from '@/lib/servidor';

export async function registrarAjuda(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const valores = textos(form, ['nome', 'whatsapp', 'tipo']);
  const habilidades = form
    .getAll('habilidades')
    .map(String)
    .filter((h) => (HABILIDADES as readonly string[]).includes(h));
  const r = intencaoAjudaSchema.safeParse({
    ...valores,
    habilidades,
    consentimento: form.get('consentimento') === 'sim',
    site: form.get('site') ?? '',
  });
  if (!r.success) return { erros: errosDoZod(r.error), valores };
  if (!(await dentroDoLimite('quero-ajudar', 5))) return { erro: MSG_LIMITE, valores };
  try {
    await registrarIntencaoAjuda(r.data);
    log.info('APLICACAO', `quero-ajudar · ${r.data.tipo.toLowerCase()}`, {
      rota: '/quero-ajudar',
      status: 201,
    });
    await adapters()
      .whatsapp.enviar(
        r.data.whatsapp,
        'Obrigado por querer ajudar o CEAK! A coordenação entrará em contato pelo WhatsApp.',
      )
      .catch(() => undefined);
    return { ok: true };
  } catch (e) {
    log.error('APLICACAO', 'quero-ajudar.falha', {
      rota: '/quero-ajudar',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA, valores };
  }
}
