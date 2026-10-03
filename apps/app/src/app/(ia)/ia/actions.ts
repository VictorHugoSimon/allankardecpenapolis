'use server';

import { perguntaIaSchema } from '@ceak/core/validacao';
import { documentosParaIA } from '@ceak/db';
import { MSG_FALHA } from '@/lib/formulario';
import { adapters, dentroDoLimite, exigirSessao, log } from '@/lib/servidor';

export interface RespostaChat {
  texto: string;
  fonte?: string;
  encaminhar?: boolean;
  erro?: boolean;
}

/**
 * Responde com base nos documentos oficiais (RAG) e sempre cita a fonte.
 * A pergunta não é gravada: o log registra só o evento, sem o conteúdo.
 */
export async function perguntar(pergunta: string): Promise<RespostaChat> {
  await exigirSessao();
  const r = perguntaIaSchema.safeParse({ pergunta });
  if (!r.success) return { texto: r.error.issues[0]!.message, erro: true };
  if (!(await dentroDoLimite('ia', 30)))
    return { texto: 'Muitas perguntas em sequência. Aguarde alguns minutos.', erro: true };
  const t0 = Date.now();
  try {
    const resp = await adapters().ia.responder(r.data.pergunta, await documentosParaIA());
    log.info(
      'IA',
      `ia.resposta · ${adapters().ia.nome}${resp.encaminharAtendimento ? ' · encaminhada' : ''}`,
      {
        rota: '/ia',
        status: 200,
        latenciaMs: Date.now() - t0,
      },
    );
    return {
      texto: resp.texto,
      fonte: resp.fontes.join(' · '),
      encaminhar: resp.encaminharAtendimento,
    };
  } catch (e) {
    log.error('IA', 'ia.falha', { rota: '/ia', status: 500, contexto: { erro: String(e) } });
    return { texto: MSG_FALHA, erro: true };
  }
}
