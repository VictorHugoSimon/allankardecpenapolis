import { partesData } from '@ceak/core/format';

const pad = (n: number) => String(n).padStart(2, '0');

/** Primeiro instante do mês (Penápolis, UTC−3). `delta` desloca meses. */
export function inicioMes(ref: Date, delta = 0): Date {
  const p = partesData(ref);
  const total = p.ano * 12 + p.mes + delta;
  const ano = Math.floor(total / 12);
  const mes = total % 12;
  return new Date(`${ano}-${pad(mes + 1)}-01T00:00:00-03:00`);
}

/** Intervalo [início, fim) do mês de `ref` deslocado por `delta`. */
export function mes(
  ref: Date,
  delta = 0,
): { inicio: Date; fim: Date; rotulo: string; curto: string } {
  const inicio = inicioMes(ref, delta);
  const p = partesData(new Date(inicio.getTime() + 12 * 3_600_000));
  return {
    inicio,
    fim: inicioMes(ref, delta + 1),
    rotulo: p.mesLongo,
    curto: p.mesLongo.slice(0, 3),
  };
}

/** Converte "AAAA-MM" em data de referência (meio do mês), ou `null` se inválido. */
export function referenciaDoMes(v: string | undefined | null): Date | null {
  const m = v?.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  return m ? new Date(`${m[1]}-${m[2]}-15T12:00:00-03:00`) : null;
}
