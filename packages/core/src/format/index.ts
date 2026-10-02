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

const DIAS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** Partes da data no fuso de Penápolis. */
export function partesData(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  const semana = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday!);
  const mes = Number(p.month) - 1;
  const diaSemana = DIAS[semana]!;
  return {
    ano: Number(p.year),
    mes,
    dia: Number(p.day),
    hora: Number(p.hour),
    minuto: Number(p.minute),
    /** "Sexta-feira" */
    diaSemana,
    /** "Sex" */
    diaSemanaCurto: diaSemana.slice(0, 3),
    /** "outubro" */
    mesLongo: MESES[mes]!,
    /** "OUT" */
    mesCurto: MESES[mes]!.slice(0, 3).toUpperCase(),
    /** "2026-10-02" (chave de dia) */
    chaveDia: `${p.year}-${p.month}-${p.day}`,
  };
}

/** "20h00", "19h30" ou, com término, "8h às 12h". */
export function formatarHorario(inicio: Date, fim?: Date | null): string {
  const a = partesData(inicio);
  if (fim) {
    const b = partesData(fim);
    const h = (x: typeof a) =>
      x.minuto ? `${x.hora}h${String(x.minuto).padStart(2, '0')}` : `${x.hora}h`;
    return `${h(a)} às ${h(b)}`;
  }
  return `${a.hora}h${String(a.minuto).padStart(2, '0')}`;
}

/** "20h" ou "19h30" (forma curta usada em textos corridos). */
export function formatarHoraCurta(d: Date): string {
  const a = partesData(d);
  return a.minuto ? `${a.hora}h${String(a.minuto).padStart(2, '0')}` : `${a.hora}h`;
}

/** "29 set 2026" */
export function formatarDataCurta(d: Date): string {
  const a = partesData(d);
  return `${String(a.dia).padStart(2, '0')} ${a.mesLongo.slice(0, 3)} ${a.ano}`;
}

/** "Seg, 05/10" */
export function formatarDiaSemanaData(d: Date): string {
  const a = partesData(d);
  return `${a.diaSemanaCurto}, ${String(a.dia).padStart(2, '0')}/${String(a.mes + 1).padStart(2, '0')}`;
}

/** "Setembro de 2026" */
export function formatarMesAno(d: Date): string {
  const a = partesData(d);
  return `${a.mesLongo.charAt(0).toUpperCase()}${a.mesLongo.slice(1)} de ${a.ano}`;
}

/** Mesmo dia civil em Penápolis. */
export function mesmoDia(a: Date, b: Date): boolean {
  return partesData(a).chaveDia === partesData(b).chaveDia;
}

/** Início do dia (00:00 em Penápolis, UTC−3) que contém `d`. */
export function inicioDoDia(d: Date): Date {
  return new Date(`${partesData(d).chaveDia}T00:00:00-03:00`);
}
