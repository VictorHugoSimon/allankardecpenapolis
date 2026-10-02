import type { Metadata } from 'next';
import { type EventoSite } from './dados';

export function metadataEvento(e: EventoSite | null): Metadata {
  if (!e) return { title: 'Atividade não encontrada' };
  const desc =
    `${e.diaSemana}, ${e.dia} de ${e.mesLongo} · ${e.horario} · ${e.local}. ${e.descricao}`.slice(
      0,
      160,
    );
  return {
    title: e.titulo,
    description: desc,
    alternates: { canonical: e.url },
    openGraph: { type: 'article', title: e.titulo, description: desc, url: e.url },
  };
}
