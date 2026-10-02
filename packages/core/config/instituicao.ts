/**
 * Dados institucionais do Centro Espírita Allan Kardec — Penápolis/SP.
 *
 * ⚠️  PENDENTE DE PREENCHIMENTO COM DADOS REAIS.
 * Os valores abaixo são os fictícios dos protótipos. Os campos marcados com
 * `PENDENTE` devem ser substituídos antes da publicação: endereço, CNPJ, chave PIX,
 * diretoria, histórico/linha do tempo, programação semanal, logo e fotos.
 */
export const instituicao = {
  nome: 'Centro Espírita Allan Kardec',
  sigla: 'CEAK',
  cidade: 'Penápolis',
  uf: 'SP',
  fundacao: 1962,
  dominio: 'allankardecpenapolis.com.br',
  urls: {
    site: 'https://allankardecpenapolis.com.br',
    app: 'https://app.allankardecpenapolis.com.br',
    gestao: 'https://gestao.allankardecpenapolis.com.br',
  },

  /** PENDENTE: CNPJ real. */
  cnpj: '00.000.000/0001-00',

  /** PENDENTE: endereço completo. */
  endereco: {
    logradouro: 'endereço a confirmar',
    numero: '',
    bairro: '',
    cidade: 'Penápolis',
    uf: 'SP',
    cep: '',
    mapsUrl: 'https://share.google/ELrVUYHEiXnuNoDge',
  },

  contato: {
    /** PENDENTE: telefones reais. */
    telefone: '(18) 3652-0000',
    whatsapp: '(18) 3652-0000',
    email: 'contato@allankardecpenapolis.com.br',
    atendimento: 'Ter. a sáb., 19h às 21h30',
  },

  redes: {
    facebook: 'https://www.facebook.com/CEAKDEPENAPOLIS',
    instagram: 'https://www.instagram.com/ceakpenapolis/',
    google: 'https://share.google/ELrVUYHEiXnuNoDge',
    youtube: '',
  },

  /** PENDENTE: chave PIX real (o BR Code dinâmico é gerado pelo PSP). */
  pix: {
    chave: 'ceak-penapolis@pix.org.br',
    nomeRecebedor: 'Centro Espirita Allan Kardec',
    favorecido: 'Centro Espírita Allan Kardec',
  },

  /** PENDENTE: nomes reais da diretoria. */
  diretoria: [
    { nome: 'Antônio Ferreira', cargo: 'Presidente' },
    { nome: 'Lúcia Moraes', cargo: 'Vice-presidente' },
    { nome: 'Maria Silva', cargo: 'Tesoureira' },
    { nome: 'Paulo Mendes', cargo: 'Secretário' },
    { nome: 'Marta Andrade', cargo: 'Diretora doutrinária' },
  ],

  /** PENDENTE: programação semanal real. */
  programacaoSemanal: [
    { dia: 'Terça', atividade: 'Atendimento fraterno e passe · 19h' },
    { dia: 'Quarta', atividade: 'Palestra pública · 20h' },
    { dia: 'Quinta', atividade: 'Tratamento espiritual · 19h' },
    { dia: 'Sexta', atividade: 'Palestra pública · 20h' },
    { dia: 'Sábado', atividade: 'Estudo do Evangelho · 19h30 · Biblioteca 18h' },
    { dia: 'Domingo', atividade: 'Mocidade e evangelização infantil · 9h30' },
  ],

  /** PENDENTE: histórico e linha do tempo reais. */
  linhaDoTempo: [
    {
      ano: 1962,
      titulo: 'Fundação',
      texto: 'Primeiras reuniões de estudo na casa de um dos fundadores.',
    },
    {
      ano: 1969,
      titulo: 'Reestruturação',
      texto: 'Estatuto, diretoria eleita e início das palestras públicas semanais.',
    },
    {
      ano: 1972,
      titulo: 'Sede própria',
      texto: 'Inauguração do prédio atual, construído com doações e trabalho voluntário.',
    },
    {
      ano: 1988,
      titulo: 'Assistência social',
      texto: 'Começa a distribuição mensal de cestas e o bazar beneficente.',
    },
    {
      ano: 2004,
      titulo: 'Biblioteca',
      texto: 'Acervo organizado com mais de 3 mil títulos para empréstimo.',
    },
    {
      ano: 2020,
      titulo: 'Transmissões ao vivo',
      texto: 'Palestras passam a ser transmitidas pelo YouTube e Facebook.',
    },
    {
      ano: 2026,
      titulo: 'CEAK Digital',
      texto: 'Portal, aplicativo e sistema de gestão integrados.',
    },
  ],

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
