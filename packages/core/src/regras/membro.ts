/** Regras do CEAK App (sem acesso a banco). */

/** Check-in aberto de 2h antes do início até o fim (ou 4h após o início). */
export function checkinAberto(inicio: Date, fim: Date | null, agora = new Date()): boolean {
  const abre = inicio.getTime() - 2 * 3_600_000;
  const fecha = (fim ?? new Date(inicio.getTime() + 4 * 3_600_000)).getTime();
  return agora.getTime() >= abre && agora.getTime() <= fecha;
}

export interface ContagensJornada {
  checkins: number;
  presencasEstudo: number;
  voluntariados: number;
  campanhasApoiadas: number;
}

/** Chaves das conquistas que a pessoa já alcançou (pessoal, sem ranking). */
export function conquistasAlcancadas(c: ContagensJornada): string[] {
  const out: string[] = [];
  if (c.checkins >= 1) out.push('primeira-visita');
  if (c.checkins >= 5) out.push('5-encontros');
  if (c.presencasEstudo >= 1) out.push('primeiro-estudo');
  if (c.voluntariados >= 1) out.push('primeiro-voluntariado');
  if (c.campanhasApoiadas >= 1) out.push('campanha-solidaria');
  return out;
}

/** "8ª visita em outubro registrada na sua jornada". */
export function textoVisitaDoMes(n: number, mesLongo: string): string {
  return `${n}ª visita em ${mesLongo} registrada na sua jornada`;
}

/** Ícone curto das conquistas (letra no círculo, como no protótipo). */
export const ICONE_CONQUISTA: Record<string, string> = {
  'primeira-visita': 'I',
  '5-encontros': 'V',
  'primeiro-estudo': 'E',
  'primeiro-voluntariado': 'Vo',
  'campanha-solidaria': 'C',
};

/** Frequência em % sobre aulas já realizadas. */
export function frequencia(presentes: number, realizadas: number): number {
  return realizadas > 0 ? Math.round((presentes / realizadas) * 100) : 0;
}

export const FREQUENCIA_MINIMA = 75;
