const TZ = 'America/Sao_Paulo';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 286200 → "R$ 2.862,00" (o Intl usa espaço não separável; normalizamos para espaço comum). */
export function formatarCentavos(centavos: number): string {
  return brl.format(centavos / 100).replace(/\u00a0/g, ' ');
}

export function formatarNumero(n: number, casas = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(n);
}

/** "02/10/2026" */
export function formatarData(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/** "19:54" */
export function formatarHora(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** "Sexta-feira, 02 de outubro de 2026" */
export function formatarDataExtenso(d: Date): string {
  const s = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Iniciais para avatar ("Antônio Ferreira" → "AF"). */
export function iniciais(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((p) => !/^(da|de|do|das|dos|e)$/i.test(p));
  const a = partes[0]?.[0] ?? '';
  const b = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (a + b).toUpperCase();
}
