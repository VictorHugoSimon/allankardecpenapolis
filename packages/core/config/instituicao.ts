/**
 * Dados institucionais do Centro Espírita Allan Kardec — Penápolis/SP.
 *
 * ⚠️  PENDENTE DE PREENCHIMENTO COM DADOS REAIS.
 * Campos institucionais não confirmados ficam vazios. Não inserir dados de
 * demonstração em produção. Informações oficiais podem ser preenchidas depois
 * pela Gestão, conforme os módulos forem disponibilizados.
 */
export const instituicao = {
  nome: 'Centro Espírita Allan Kardec',
  sigla: 'CEAK',
  cidade: 'Penápolis',
  uf: 'SP',
  fundacao: null as number | null,
  dominio: 'allankardecpenapolis.com.br',
  urls: {
    site: 'https://allankardecpenapolis.com.br',
    app: 'https://app.allankardecpenapolis.com.br',
    gestao: 'https://gestao.allankardecpenapolis.com.br',
  },

  /** PENDENTE: CNPJ real. */
  cnpj: '',

  /** PENDENTE: endereço completo. */
  endereco: {
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: 'Penápolis',
    uf: 'SP',
    cep: '',
    mapsUrl: 'https://share.google/ELrVUYHEiXnuNoDge',
  },

  contato: {
    /** PENDENTE: telefones reais. */
    telefone: '',
    whatsapp: '',
    email: '',
    atendimento: '',
  },

  redes: {
    facebook: 'https://www.facebook.com/CEAKDEPENAPOLIS',
    instagram: 'https://www.instagram.com/ceakpenapolis/',
    google: 'https://share.google/ELrVUYHEiXnuNoDge',
    youtube: '',
  },

  /** PENDENTE: chave PIX real (o BR Code dinâmico é gerado pelo PSP). */
  pix: {
    chave: '',
    nomeRecebedor: 'Centro Espirita Allan Kardec',
    favorecido: 'Centro Espírita Allan Kardec',
  },

  /** PENDENTE: nomes reais da diretoria. */
  diretoria: [] as { nome: string; cargo: string }[],

  /** PENDENTE: programação semanal real. */
  programacaoSemanal: [] as { dia: string; atividade: string }[],

  /** PENDENTE: histórico e linha do tempo reais. */
  linhaDoTempo: [] as { ano: number; titulo: string; texto: string }[],

  /** PENDENTE: caminhos do logo oficial e das fotos (em `public/` de cada app). */
  assets: {
    logo: null as string | null,
    fotos: {} as Record<string, string>,
  },

  /** Aviso obrigatório em toda tela de assistência espiritual. */
  avisoAssistencia:
    'O atendimento espiritual não substitui acompanhamento médico ou psicológico quando necessário.',

  principio:
    'Aproximar, acolher, informar, ensinar, envolver, permitir ajudar e facilitar ser ajudado.',
} as const;

export type Instituicao = typeof instituicao;
