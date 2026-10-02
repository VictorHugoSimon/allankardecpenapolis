'use server';

import { contatoSchema } from '@ceak/core/validacao';
import { registrarMensagemContato } from '@ceak/db';
import { errosDoZod, MSG_FALHA, MSG_LIMITE, textos, type EstadoForm } from '@/lib/formulario';
import { dentroDoLimite, log } from '@/lib/servidor';

export async function enviarContato(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const valores = textos(form, ['nome', 'email', 'assunto', 'mensagem']);
  const r = contatoSchema.safeParse({
    ...valores,
    consentimento: form.get('consentimento') === 'sim',
    site: form.get('site') ?? '',
  });
  if (!r.success) return { erros: errosDoZod(r.error), valores };
  if (!(await dentroDoLimite('contato', 5))) return { erro: MSG_LIMITE, valores };
  try {
    await registrarMensagemContato(r.data);
    log.info('APLICACAO', `contato.recebido · ${r.data.assunto}`, {
      rota: '/contato',
      status: 201,
    });
    return { ok: true };
  } catch (e) {
    log.error('APLICACAO', 'contato.falha', {
      rota: '/contato',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA, valores };
  }
}
