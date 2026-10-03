'use server';

import { ErroNegocio, preInscricaoMembro } from '@ceak/db';
import { MSG_FALHA } from '@/lib/formulario';
import { exigirSessao, log } from '@/lib/servidor';

export async function preInscrever(
  _: { ok?: boolean; erro?: string },
  form: FormData,
): Promise<{ ok?: boolean; erro?: string }> {
  const s = await exigirSessao();
  try {
    const c = await preInscricaoMembro(s.pessoaId, String(form.get('curso') ?? ''));
    log.info('APLICACAO', `app: pré-inscrição · ${c.nome}`, {
      rota: '/estudos/inscrever',
      status: 201,
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    log.error('APLICACAO', 'app: pré-inscrição falhou', {
      rota: '/estudos/inscrever',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA };
  }
}
