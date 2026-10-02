/** Módulos do CEAK Gestão, na ordem e nos grupos da sidebar. */
export const MENU = [
  { grupo: '', itens: [{ id: 'dashboard', label: 'Visão Geral', href: '/' }] },
  {
    grupo: 'PESSOAS E ATIVIDADES',
    itens: [
      { id: 'pessoas', label: 'Pessoas', href: '/pessoas' },
      { id: 'agenda', label: 'Agenda', href: '/agenda' },
      { id: 'eventos', label: 'Eventos', href: '/eventos' },
      { id: 'estudos', label: 'Estudos', href: '/estudos' },
    ],
  },
  {
    grupo: 'COMUNICAÇÃO',
    itens: [
      { id: 'conteudo', label: 'Conteúdo', href: '/conteudo' },
      { id: 'comunicacao', label: 'Comunicação', href: '/comunicacao' },
    ],
  },
  {
    grupo: 'SOLIDÁRIO E FINANÇAS',
    itens: [
      { id: 'doacoes', label: 'Doações', href: '/doacoes' },
      { id: 'financeiro', label: 'Financeiro', href: '/financeiro' },
      { id: 'loja', label: 'Loja', href: '/loja' },
      { id: 'estoque', label: 'Estoque', href: '/estoque' },
    ],
  },
  {
    grupo: 'SERVIÇO',
    itens: [
      { id: 'voluntariado', label: 'Voluntariado', href: '/voluntariado' },
      { id: 'assistencia', label: 'Assistência', href: '/assistencia' },
    ],
  },
  {
    grupo: 'INTELIGÊNCIA',
    itens: [
      { id: 'ia', label: 'CEAK IA', href: '/ia' },
      { id: 'automacoes', label: 'Automações', href: '/automacoes' },
      { id: 'aprovacoes', label: 'Aprovações', href: '/aprovacoes' },
      { id: 'bi', label: 'BI', href: '/bi' },
    ],
  },
  {
    grupo: 'SISTEMA',
    itens: [
      { id: 'logs', label: 'Logs', href: '/logs' },
      { id: 'integracoes', label: 'Integrações', href: '/integracoes' },
      { id: 'sistema', label: 'Sistema', href: '/sistema' },
      { id: 'config', label: 'Configurações', href: '/config' },
    ],
  },
] as const;

export type Modulo = (typeof MENU)[number]['itens'][number]['id'];

export const MODULOS: Modulo[] = MENU.flatMap((g) => g.itens.map((i) => i.id));

export const MODULO_LABEL = Object.fromEntries(
  MENU.flatMap((g) => g.itens.map((i) => [i.id, i.label])),
) as Record<Modulo, string>;

export const MODULO_HREF = Object.fromEntries(
  MENU.flatMap((g) => g.itens.map((i) => [i.id, i.href])),
) as Record<Modulo, string>;
