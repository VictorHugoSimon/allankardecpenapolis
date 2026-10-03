'use server';

import { tokenCheckinValido } from '@ceak/core/checkin';
import { formatarData, formatarHora } from '@ceak/core/format';
import { ErroNegocio, fazerCheckin } from '@ceak/db';
import { checkinSecret } from '@/lib/env';
import { MSG_FALHA } from '@/lib/formulario';
import { exigirSessao, log } from '@/lib/servidor';

export interface EstadoCheckin {
  erro?: string;
  feito?: {
    titulo: string;
    data: string;
    hora: string;
    visitaDoMes: string;
    conquistas: string[];
    jaRegistrado: boolean;
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function registrarCheckin(_: EstadoCheckin, form: FormData): Promise<EstadoCheckin> {
  const s = await exigirSessao();
  const eventoId = String(form.get('evento') ?? '');
  const origem = form.get('origem') === 'QR' ? 'QR' : 'MANUAL';
  const token = String(form.get('t') ?? '');
  if (!UUID.test(eventoId)) {
    return {
      erro: 'Este QR Code não é do check-in do CEAK. Use o código afixado na entrada do salão.',
    };
  }
  try {
    const r = await fazerCheckin(
      s.pessoaId,
      {
        eventoId,
        origem,
        tokenValido: origem === 'QR' && tokenCheckinValido(eventoId, token, checkinSecret()),
      },
      { log },
    );
    return {
      feito: {
        titulo: r.evento?.titulo ?? '',
        data: formatarData(r.registradoEm),
        hora: formatarHora(r.registradoEm),
        visitaDoMes: r.visitaDoMes,
        conquistas: r.conquistas,
        jaRegistrado: r.jaRegistrado,
      },
    };
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    log.error('APLICACAO', 'checkin.falha', {
      rota: '/checkin',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA };
  }
}
