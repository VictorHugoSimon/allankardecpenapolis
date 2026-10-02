/**
 * Regras de negócio puras (sem banco), compartilhadas por site, app e gestão.
 */

/** Etiqueta de disponibilidade de produto da loja solidária. */
export function rotuloDisponibilidade(
  saldo: number,
  doado: boolean,
): { texto: string; alerta: boolean } {
  if (saldo <= 0) return { texto: 'Esgotado', alerta: true };
  if (saldo === 1) return { texto: 'Última unidade', alerta: true };
  return { texto: doado ? `${saldo} disponíveis` : `${saldo} em estoque`, alerta: false };
}

export const ORIGEM_PRODUTO_LABEL = {
  DOADO: 'Produto doado',
  FEITO_POR_VOLUNTARIAS: 'Feito por voluntárias',
  LIVRARIA: 'Livraria CEAK',
} as const;

export const ESTADO_PRODUTO_LABEL = {
  NOVO: 'Novo',
  SEMINOVO: 'Seminovo',
  USADO_OTIMO: 'Usado, ótimo estado',
  USADO_BOM: 'Usado, bom estado',
} as const;

/** Nome exibido nas listas internas da assistência ("Carla Nogueira" → "Carla N."). */
export function nomeReservado(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length < 2) return partes[0] ?? '';
  return `${partes[0]} ${partes[partes.length - 1]![0]!.toUpperCase()}.`;
}

/** Percentual inteiro de progresso (0–100), arredondado para baixo. */
export function percentual(valor: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.max(0, Math.min(100, Math.floor((valor / meta) * 100)));
}

/** Itens do carrinho: agrupa por produto e limita a quantidade. */
export function normalizarCarrinho(
  itens: { produtoId: string; quantidade: number }[],
  maxPorItem = 20,
): { produtoId: string; quantidade: number }[] {
  const mapa = new Map<string, number>();
  for (const i of itens) {
    if (!i.produtoId || !Number.isFinite(i.quantidade)) continue;
    mapa.set(i.produtoId, (mapa.get(i.produtoId) ?? 0) + Math.floor(i.quantidade));
  }
  return [...mapa.entries()]
    .map(([produtoId, q]) => ({ produtoId, quantidade: Math.min(maxPorItem, q) }))
    .filter((i) => i.quantidade > 0);
}

/** Serviços do "Preciso de ajuda". */
export const SERVICOS_AJUDA = [
  {
    slug: 'atendimento-fraterno',
    tipo: 'ATENDIMENTO_FRATERNO',
    nome: 'Atendimento fraterno',
    resumo: 'Uma conversa reservada, com escuta e acolhimento.',
    cta: 'Solicitar',
    descricao:
      'Uma conversa reservada com um trabalhador da casa, que escuta sem julgamento e oferece orientação à luz do Evangelho.',
  },
  {
    slug: 'passe',
    tipo: 'PASSE',
    nome: 'Passe',
    resumo: 'Oferecido após as palestras de quarta e no atendimento de terça.',
    cta: 'Saber mais',
    descricao:
      'O passe é uma transmissão de energias por meio da prece e da imposição de mãos, oferecido gratuitamente após as palestras.',
  },
  {
    slug: 'tratamento-espiritual',
    tipo: 'TRATAMENTO_ESPIRITUAL',
    nome: 'Tratamento espiritual',
    resumo: 'Encontros semanais com acompanhamento da equipe.',
    cta: 'Conhecer o tratamento',
    descricao:
      'O tratamento espiritual é um conjunto de encontros semanais que combina atendimento fraterno, passe e prece, com acompanhamento de uma equipe da casa.',
  },
  {
    slug: 'prece',
    tipo: 'PRECE',
    nome: 'Prece',
    resumo: 'Inclua um nome nas preces da reunião semanal.',
    cta: 'Pedir prece',
    descricao:
      'Você pode pedir que o seu nome ou de alguém querido seja incluído nas preces da reunião semanal.',
  },
  {
    slug: 'orientacao',
    tipo: 'ORIENTACAO',
    nome: 'Orientação',
    resumo: 'Tire dúvidas sobre a doutrina e a rotina da casa.',
    cta: 'Conversar',
    descricao:
      'Orientação sobre a Doutrina Espírita, a rotina da casa e como participar das atividades.',
  },
] as const;

export type ServicoAjuda = (typeof SERVICOS_AJUDA)[number];

export function servicoPorSlug(slug: string): ServicoAjuda | undefined {
  return SERVICOS_AJUDA.find((s) => s.slug === slug);
}

export const ORIENTACOES_ATENDIMENTO = [
  'Chegue com 15 minutos de antecedência e procure a recepção.',
  'Use roupas confortáveis. Não é preciso trazer nada.',
  'Evite bebidas alcoólicas no dia do atendimento.',
  'Continue normalmente qualquer tratamento médico ou psicológico em curso.',
] as const;

/** Opções do "Quero ajudar". `financeira` leva à página de doação. */
export const OPCOES_AJUDAR = [
  {
    chave: 'alimentos',
    tipo: 'ALIMENTOS',
    titulo: 'Quero doar alimentos',
    resumo: 'Arroz, feijão, óleo e leite são os mais necessários.',
    detalhe:
      'Entregue na recepção de terça a sábado, das 19h às 21h30. Os alimentos compõem as 126 cestas mensais da assistência social. Itens em falta agora: arroz e óleo.',
    cta: 'Avisar que vou doar',
  },
  {
    chave: 'roupas',
    tipo: 'ROUPAS',
    titulo: 'Quero doar roupas',
    resumo: 'Campanha do Agasalho até 31/10.',
    detalhe:
      'Aceitamos roupas limpas e em bom estado, especialmente casacos, cobertores e meias. Ponto de coleta drive-thru aos sábados, 9h às 12h.',
    cta: 'Avisar que vou doar',
  },
  {
    chave: 'produtos',
    tipo: 'PRODUTOS',
    titulo: 'Quero doar produtos',
    resumo: 'Livros, objetos e utilidades para o bazar.',
    detalhe:
      'Itens doados são revisados pela equipe do bazar e vendidos na loja solidária. Para móveis, combine a retirada pelo WhatsApp.',
    cta: 'Combinar entrega',
  },
  {
    chave: 'financeira',
    tipo: null,
    titulo: 'Quero contribuir financeiramente',
    resumo: 'PIX único ou mensal.',
    detalhe: '',
    cta: '',
  },
  {
    chave: 'voluntario',
    tipo: 'VOLUNTARIO',
    titulo: 'Quero ser voluntário',
    resumo: 'Recepção, assistência, comunicação e mais.',
    detalhe:
      'Hoje temos 68 voluntários em seis áreas. Depois do cadastro, a coordenação entra em contato para uma conversa de acolhimento.',
    cta: 'Fazer cadastro de voluntário',
  },
  {
    chave: 'eventos',
    tipo: 'EVENTOS',
    titulo: 'Quero ajudar em eventos',
    resumo: 'Bazar, festas e campanhas.',
    detalhe:
      'Precisamos de ajuda no Bazar de primavera (17/10): montagem às 7h, atendimento e organização.',
    cta: 'Quero participar',
  },
  {
    chave: 'habilidade',
    tipo: 'HABILIDADE',
    titulo: 'Tenho uma habilidade para oferecer',
    resumo: 'Seu talento pode servir à casa.',
    detalhe: 'Marque o que você sabe fazer. Avisaremos quando surgir uma necessidade compatível.',
    cta: 'Enviar minhas habilidades',
  },
] as const;

export const HABILIDADES = [
  'Elétrica',
  'Informática',
  'Fotografia',
  'Cozinha',
  'Organização',
  'Limpeza',
  'Transporte',
  'Música',
  'Costura',
  'Atendimento',
  'Ensino',
  'Outras',
] as const;

export const DESTINOS_DOACAO = [
  'Onde for mais necessário',
  'Assistência social',
  'Campanha do Agasalho',
  'Manutenção da sede',
] as const;

export const VALORES_DOACAO = [20, 50, 100, 200] as const;
