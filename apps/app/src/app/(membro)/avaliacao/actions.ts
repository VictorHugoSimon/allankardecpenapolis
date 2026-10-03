'use server';

import { avaliacaoSchema } from '@ceak/core/validacao';
import { ErroNegocio, registrarAvaliacao } from '@ceak/db';
import { errosDoZod, MSG_FALHA, type EstadoForm } from '@/lib/formulario';
import { exigirSessao, log } from '@/lib/servidor';

export async function avaliar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const s = await exigirSessao();
  const opcional = (k: string) => (form.get(k) ? form.get(k) : undefined);
  const r = avaliacaoSchema.safeParse({
    nps: form.get('nps') ?? undefined,
    conteudo: opcional('conteudo'),
    clareza: opcional('clareza'),
    aplicabilidade: opcional('aplicabilidade'),
    comentario: form.get('comentario') ?? undefined,
    sugestao: form.get('sugestao') ?? undefined,
  });
  if (!r.success) return { erros: errosDoZod(r.error) };
  try {
    await registrarAvaliacao(s.pessoaId, String(form.get('slug') ?? ''), r.data, { log });
    return { ok: true };
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    log.error('APLICACAO', 'avaliacao.falha', {
      rota: '/avaliacao',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA };
  }
}
