/**
 * Converte data civil e horário do formulário para o fuso fixo de Penápolis (UTC−3).
 * A data é validada por componentes para rejeitar, por exemplo, 31/02 ou 25:90.
 */
export function prepararHorarioAtividade(data: string, hora: string, duracao: number) {
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  const horario = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!dia || !horario || !Number.isInteger(duracao) || duracao < 15 || duracao > 720)
    throw new Error('Informe data, horário e duração válidos.');
  const [, ano, mes, diaMes] = dia;
  const h = Number(horario[1]);
  const min = Number(horario[2]);
  if (h > 23 || min > 59) throw new Error('Horário inválido.');
  const inicio = new Date(`${data}T${hora}:00-03:00`);
  const conferido = new Date(inicio.getTime() - 3 * 60 * 60 * 1000);
  if (
    !Number.isFinite(inicio.getTime()) ||
    conferido.getUTCFullYear() !== Number(ano) ||
    conferido.getUTCMonth() + 1 !== Number(mes) ||
    conferido.getUTCDate() !== Number(diaMes) ||
    conferido.getUTCHours() !== h ||
    conferido.getUTCMinutes() !== min
  ) throw new Error('Data ou horário inexistente.');
  return { inicio, fim: new Date(inicio.getTime() + duracao * 60_000) };
}
