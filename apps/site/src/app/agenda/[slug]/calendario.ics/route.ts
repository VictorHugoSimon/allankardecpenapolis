import { instituicao } from '@ceak/core';
import { eventoPorSlug } from '@/lib/dados';
import { urlAbsoluta } from '@/lib/urls';

const ics = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
const esc = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/[,;]/g, (c) => `\\${c}`)
    .replace(/\n/g, '\\n');

/** Arquivo iCalendar para "Adicionar ao calendário". */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const e = await eventoPorSlug((await params).slug);
  if (!e) return new Response('Atividade não encontrada', { status: 404 });
  const fim = e.fim ?? new Date(e.inicio.getTime() + 90 * 60_000);
  const corpo = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CEAK Digital//Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${e.id}@${instituicao.dominio}`,
    `DTSTAMP:${ics(new Date())}`,
    `DTSTART:${ics(e.inicio)}`,
    `DTEND:${ics(fim)}`,
    `SUMMARY:${esc(e.titulo)}`,
    `DESCRIPTION:${esc(`${e.descricao}\n${urlAbsoluta(e.url)}`)}`,
    `LOCATION:${esc(`${instituicao.nome} — ${e.local}, ${instituicao.cidade} – ${instituicao.uf}`)}`,
    `URL:${urlAbsoluta(e.url)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
  return new Response(corpo, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${e.slug}.ics"`,
    },
  });
}
