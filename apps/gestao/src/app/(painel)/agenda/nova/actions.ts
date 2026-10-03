'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { podeEditarAgenda } from '@ceak/core/rbac';
import { criarAtividade } from '@ceak/db';
import { exigirModulo, ipDaRequisicao } from '@/lib/auth';
import { log } from '@/lib/log';

export interface EstadoAtividade {
  erro?: string;
  erros?: Record<string, string>;
}

const esquema = z.object({
  titulo: z.string().trim().min(3, 'Informe o título.').max(140),
  tipo: z.enum(['PALESTRA', 'ESTUDO', 'CURSO', 'EVENTO', 'ASSISTENCIA', 'CAMPANHA'], {
    error: 'Escolha o tipo.',
  }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data.'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Informe o horário.'),
  duracao: z.coerce.number().int().min(15).max(720),
  local: z.string().trim().max(80).optional(),
  responsavel: z.string().trim().max(80).optional(),
  descricao: z.string().trim().max(2000).optional(),
  status: z.enum(['RASCUNHO', 'CONFIRMADO']),
});

export async function salvarAtividade(
  _: EstadoAtividade,
  form: FormData,
): Promise<EstadoAtividade> {
  const s = await exigirModulo('agenda');
  if (!podeEditarAgenda(s.perfil)) return { erro: 'Seu perfil não pode criar atividades.' };
  const r = esquema.safeParse(Object.fromEntries(form));
  if (!r.success) {
    const erros: Record<string, string> = {};
    for (const i of r.error.issues) erros[String(i.path[0])] ??= i.message;
    return { erros };
  }
  const d = r.data;
  const inicio = new Date(`${d.data}T${d.hora}:00-03:00`);
  await criarAtividade(
    {
      titulo: d.titulo,
      tipo: d.tipo,
      inicio,
      fim: new Date(inicio.getTime() + d.duracao * 60_000),
      local: d.local || undefined,
      responsavel: d.responsavel || undefined,
      descricao: d.descricao || undefined,
      status: d.status,
      publico: d.tipo !== 'ASSISTENCIA',
    },
    { usuarioId: s.usuarioId, ip: await ipDaRequisicao() },
    { log },
  );
  redirect(`/agenda?mes=${d.data.slice(0, 7)}&criada=1`);
}
