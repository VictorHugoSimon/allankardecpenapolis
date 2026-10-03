/** Rótulos e tons de status do CEAK Gestão (protótipo `CEAK Gestao.dc.html`). */
export type Tom = 'ok' | 'warn' | 'err' | 'neutral' | 'info';

export const TIPO_EVENTO_LABEL = {
  PALESTRA: 'Palestra',
  ESTUDO: 'Estudo',
  CURSO: 'Curso',
  EVENTO: 'Evento',
  ASSISTENCIA: 'Assistência',
  CAMPANHA: 'Campanha',
} as const;

export const STATUS_EVENTO: Record<string, [string, Tom]> = {
  RASCUNHO: ['Rascunho', 'neutral'],
  AGUARDANDO_APROVACAO: ['Aguardando aprovação', 'warn'],
  CONFIRMADO: ['Confirmada', 'ok'],
  EM_ANDAMENTO: ['Em andamento', 'info'],
  ENCERRADO: ['Encerrada', 'neutral'],
  CANCELADO: ['Cancelada', 'err'],
};

export const ETAPA_FLUXO_LABEL: Record<string, string> = {
  CRIADA: 'Palestra criada',
  DESCRICAO_IA: 'IA gerou descrição · aguardando aprovação',
  CONTEUDO_SOCIAL: 'Conteúdo social gerado',
  APROVACAO_DIVULGACAO: 'Divulgação aguardando aprovação humana',
  POSTS_AGENDADOS: 'Divulgação agendada',
  PUSH_ENVIADO: 'Push enviado',
  CHECKIN_ABERTO: 'Check-in aberto',
  REALIZADA: 'Palestra realizada',
  GRAVACAO_DISPONIVEL: 'Gravação publicada',
  NPS_ENVIADO: 'Pesquisa NPS enviada',
  RESUMO_IA: 'Resumo IA em revisão',
  ARTIGO_E_POST: 'Artigo e post gerados',
  APROVACAO_PUBLICACAO: 'Publicação aguardando aprovação',
  PUBLICADA: 'Conteúdo publicado',
};

export const STATUS_CONTEUDO: Record<string, [string, Tom]> = {
  CAPTURADO: ['Capturado', 'neutral'],
  PROCESSANDO: ['Processando', 'info'],
  RASCUNHO_IA: ['Rascunho IA', 'info'],
  REVISAO: ['Revisão', 'warn'],
  APROVADO: ['Aprovado', 'ok'],
  AGENDADO: ['Agendado', 'ok'],
  PUBLICADO: ['Publicado', 'ok'],
  ERRO: ['Erro', 'err'],
  REJEITADO: ['Rejeitado', 'err'],
};

/** Etapas do fluxo de publicação mostradas no Conteúdo e no Editor. */
export const ETAPAS_PUBLICACAO = [
  'IA / Robô',
  'Rascunho',
  'Revisão humana',
  'Aprovação',
  'Publicação',
] as const;

/** Índice da etapa atual de um conteúdo no fluxo de publicação. */
export function etapaPublicacao(status: string): number {
  return (
    {
      CAPTURADO: 0,
      PROCESSANDO: 0,
      RASCUNHO_IA: 1,
      REVISAO: 2,
      REJEITADO: 2,
      APROVADO: 3,
      AGENDADO: 3,
      PUBLICADO: 4,
      ERRO: 4,
    }[status] ?? 0
  );
}

export const CANAL_LABEL = {
  BLOG: 'Blog',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  GOOGLE_BUSINESS: 'Google Business',
  PUSH: 'Push',
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
} as const;

export const STATUS_LANCAMENTO: Record<string, [string, Tom]> = {
  PENDENTE: ['Pendente', 'warn'],
  APROVADO: ['Aprovado', 'ok'],
  PAGO: ['Pago', 'ok'],
  VENCIDO: ['Vencido', 'err'],
  CANCELADO: ['Cancelado', 'neutral'],
};

/** Contas a receber usam os rótulos do protótipo (A receber, Recebido, Atrasado). */
export const STATUS_RECEBER: Record<string, [string, Tom]> = {
  PENDENTE: ['A receber', 'warn'],
  APROVADO: ['A receber', 'warn'],
  PAGO: ['Recebido', 'ok'],
  VENCIDO: ['Atrasado', 'err'],
  CANCELADO: ['Cancelado', 'neutral'],
};

/**
 * Transições permitidas de uma conta. Vencido é derivado da data, mas pode
 * ser aprovado e pago normalmente.
 */
export const TRANSICOES_LANCAMENTO: Record<string, string[]> = {
  PENDENTE: ['APROVADO', 'CANCELADO'],
  VENCIDO: ['APROVADO', 'PAGO', 'CANCELADO'],
  APROVADO: ['PAGO', 'CANCELADO'],
  PAGO: [],
  CANCELADO: [],
};

export const TIPO_APROVACAO_LABEL = {
  CONTEUDO: 'Conteúdo',
  FINANCEIRO: 'Financeiro',
  CAMPANHA: 'Campanhas',
  COMUNICACAO: 'Comunicações',
  PRODUTO: 'Produtos',
  IA: 'IA',
  EVENTO: 'Eventos',
} as const;
