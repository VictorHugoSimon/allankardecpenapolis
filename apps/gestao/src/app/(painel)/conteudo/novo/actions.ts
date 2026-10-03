'use server';

import { redirect } from 'next/navigation';
import { CANAIS_EDITOR, criarConteudo } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

export async function criar(_: { erro?: string }, form: FormData): Promise<{ erro?: string }> {
  const s = await exigirModulo('conteudo');
  const titulo = String(form.get('titulo') ?? '').trim();
  const fonte = String(form.get('fonte') ?? '').trim() || 'Secretaria';
  const texto = String(form.get('texto') ?? '').trim();
  const canais = CANAIS_EDITOR.filter((c) => form.get(`canal_${c}`) === 'on');
  if (titulo.length < 3) return { erro: 'Informe o título.' };
  if (!canais.length) return { erro: 'Escolha ao menos um canal.' };
  if (texto.length < 10) return { erro: 'Escreva o texto inicial.' };
  const c = await criarConteudo(
    {
      titulo: titulo.slice(0, 200),
      fonte: fonte.slice(0, 80),
      canais,
      texto: texto.slice(0, 20_000),
    },
    await contexto(s),
  );
  redirect(`/conteudo/${c.id}`);
}
