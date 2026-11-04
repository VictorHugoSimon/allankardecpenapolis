'use server';

import { exigirModulo } from '@/lib/auth';
import { prepararPreviaExtrato, type PreviaExtrato } from './parserExtrato';

export interface EstadoPrevia {
  erro?: string;
  previa?: PreviaExtrato;
}

export async function gerarPreviaExtrato(
  _anterior: EstadoPrevia,
  formData: FormData,
): Promise<EstadoPrevia> {
  await exigirModulo('financeiro');
  const arquivo = formData.get('arquivo');
  if (!(arquivo instanceof File) || !arquivo.name.toLowerCase().endsWith('.csv')) {
    return { erro: 'Escolha um arquivo CSV.' };
  }
  if (arquivo.size === 0 || arquivo.size > 250_000) {
    return { erro: 'O arquivo deve ter entre 1 byte e 250 KB.' };
  }
  try {
    const texto = await arquivo.text();
    return { previa: prepararPreviaExtrato(texto) };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'Não foi possível analisar o CSV.' };
  }
}
