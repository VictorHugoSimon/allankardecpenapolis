/** Tokens em JS, para gráficos e estilos calculados. Espelham `styles/theme.css`. */
export const colors = {
  bg: '#F7F4EE',
  surface: '#FFFFFF',
  beige: '#EFE8DA',
  beige2: '#F2ECE0',
  ink: '#1F2A24',
  ink2: '#3F4A42',
  muted: '#5E675F',
  muted2: '#606861',
  line: '#E6E0D3',
  line2: '#D8D0BF',
  line3: '#CFC7B6',
  green: '#2F5D46',
  greenDark: '#1E3D2F',
  greenSoft: '#E4EDE6',
  greenOnDark: '#C9D6CD',
  greenOnDark2: '#A9C2B1',
  greenChart: '#9DB8A6',
  ochre: '#B5833A',
  danger: '#A4473A',
  okStrong: '#2F7A52',
} as const;

export type PillTone = 'ok' | 'warn' | 'err' | 'neutral' | 'info';

export const pillColors: Record<PillTone, { bg: string; fg: string }> = {
  ok: { bg: '#E4EDE6', fg: '#1E3D2F' },
  warn: { bg: '#F4EAD5', fg: '#7A5A1E' },
  err: { bg: '#F3DDD5', fg: '#8A3426' },
  neutral: { bg: '#EEEAE1', fg: '#4F5A52' },
  info: { bg: '#E1E8EF', fg: '#2F4B63' },
};

const oklch = (h: number) => `oklch(0.48 0.08 ${h})`;

/** Categorias de agenda: mesma luminosidade e croma, variando o matiz. */
export const categoryColors = {
  Palestras: oklch(155),
  Estudos: oklch(235),
  Cursos: oklch(295),
  Eventos: oklch(60),
  Assistência: oklch(20),
  Campanhas: oklch(195),
} as const;

/** Canais de publicação. */
export const channelColors = {
  Blog: oklch(155),
  Facebook: oklch(250),
  Instagram: oklch(330),
  Google: oklch(60),
  Eventos: oklch(195),
  Campanhas: oklch(20),
} as const;

/**
 * Tom de pill para os rótulos de status usados nos protótipos.
 * Status desconhecido cai em `neutral`.
 */
const statusTone: Record<string, PillTone> = {
  Capturado: 'neutral',
  Processando: 'info',
  'Rascunho IA': 'info',
  Revisão: 'warn',
  Aprovado: 'ok',
  Agendado: 'ok',
  Publicado: 'ok',
  Erro: 'err',
  Rejeitado: 'err',
  Pendente: 'warn',
  Pago: 'ok',
  Vencido: 'err',
  Cancelado: 'neutral',
  Confirmada: 'ok',
  Rascunho: 'neutral',
  'Aguardando aprovação': 'warn',
  Ativo: 'ok',
  Ativa: 'ok',
  Inativo: 'neutral',
  Pausada: 'neutral',
  Encerrada: 'neutral',
  'Em andamento': 'info',
  'Em risco': 'warn',
  Aberta: 'ok',
  Enviado: 'ok',
  Recebido: 'ok',
  'A receber': 'info',
  Atrasado: 'err',
  Conciliado: 'ok',
  Divergente: 'err',
  Sugerido: 'info',
  Emitido: 'ok',
  Novo: 'info',
  Agendada: 'info',
  Concluída: 'ok',
  Crítico: 'err',
  Baixo: 'warn',
  Normal: 'ok',
  Conectado: 'ok',
  Atenção: 'warn',
  Online: 'ok',
  'Aguardando PIX': 'warn',
  'Aguardando retirada': 'info',
  Retirado: 'ok',
};

export function toneForStatus(status: string): PillTone {
  return statusTone[status] ?? 'neutral';
}
