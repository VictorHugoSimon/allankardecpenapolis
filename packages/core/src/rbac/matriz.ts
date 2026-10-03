import { MODULOS, MODULO_HREF, type Modulo } from './modulos';
import { type Perfil } from './perfis';

/**
 * Escopo de acesso a um módulo.
 * - `total`: todos os registros do módulo.
 * - `proprios_alunos`: Instrutor em Pessoas vê só os seus alunos.
 * - `escala`: Voluntário em Assistência vê só a escala (sem dados das solicitações).
 */
export type Escopo = 'total' | 'proprios_alunos' | 'escala';

type Matriz = Record<Perfil, Partial<Record<Modulo, Escopo>>>;

const todos = (lista: Modulo[]) =>
  Object.fromEntries(lista.map((m) => [m, 'total' as const])) as Partial<Record<Modulo, Escopo>>;

/** Matriz de perfis × módulos (docs/design/README.md, "Perfis de acesso"). */
export const MATRIZ_ACESSO: Matriz = {
  ADMINISTRADOR: todos(MODULOS),
  DIRETORIA: todos([
    'dashboard',
    'pessoas',
    'agenda',
    'eventos',
    'estudos',
    'conteudo',
    'doacoes',
    'financeiro',
    'loja',
    'voluntariado',
    'assistencia',
    'ia',
    'aprovacoes',
    'bi',
  ]),
  TESOURARIA: todos(['dashboard', 'doacoes', 'financeiro', 'loja', 'estoque', 'aprovacoes', 'bi']),
  SECRETARIA: todos([
    'dashboard',
    'pessoas',
    'agenda',
    'eventos',
    'conteudo',
    'comunicacao',
    'aprovacoes',
  ]),
  COORDENADOR: todos([
    'dashboard',
    'pessoas',
    'agenda',
    'eventos',
    'estudos',
    'voluntariado',
    'assistencia',
  ]),
  INSTRUTOR: { ...todos(['dashboard', 'agenda', 'estudos']), pessoas: 'proprios_alunos' },
  VOLUNTARIO: { ...todos(['dashboard', 'agenda', 'voluntariado']), assistencia: 'escala' },
  MEMBRO: {},
  VISITANTE: {},
};

export function modulosDoPerfil(perfil: Perfil): Modulo[] {
  const m = MATRIZ_ACESSO[perfil];
  return MODULOS.filter((id) => m[id] !== undefined);
}

export function podeAcessar(perfil: Perfil, modulo: Modulo): boolean {
  return MATRIZ_ACESSO[perfil][modulo] !== undefined;
}

export function escopo(perfil: Perfil, modulo: Modulo): Escopo | null {
  return MATRIZ_ACESSO[perfil][modulo] ?? null;
}

/** Perfis com algum acesso ao Gestão. Membro e Visitante usam o App. */
export function temAcessoGestao(perfil: Perfil): boolean {
  return modulosDoPerfil(perfil).length > 0;
}

/** Rotas do Gestão abertas a qualquer perfil com acesso ao Gestão. */
export const ROTAS_GESTAO_LIVRES = ['/ui', '/sem-acesso', '/conta', '/busca'] as const;

/**
 * Descobre o módulo de uma rota do Gestão (ex.: `/pessoas/123` → `pessoas`).
 * Retorna `null` para rotas livres e `undefined` para rotas desconhecidas.
 */
export function moduloDaRota(pathname: string): Modulo | null | undefined {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return 'dashboard';
  if (ROTAS_GESTAO_LIVRES.some((r) => path === r || path.startsWith(`${r}/`))) return null;
  for (const id of MODULOS) {
    const href = MODULO_HREF[id];
    if (href !== '/' && (path === href || path.startsWith(`${href}/`))) return id;
  }
  return undefined;
}

/** Decide se o perfil pode abrir a rota do Gestão. Rotas desconhecidas: só Administrador. */
export function podeAcessarRota(perfil: Perfil, pathname: string): boolean {
  if (!temAcessoGestao(perfil)) return false;
  const mod = moduloDaRota(pathname);
  if (mod === null) return true;
  if (mod === undefined) return perfil === 'ADMINISTRADOR';
  return podeAcessar(perfil, mod);
}

/** Quem cria e edita atividades na agenda (Instrutor e Voluntário só consultam). */
export function podeEditarAgenda(perfil: Perfil): boolean {
  return ['ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA', 'COORDENADOR'].includes(perfil);
}

/** Quem aprova conteúdo: precisa do módulo Conteúdo e da Central de aprovações. */
export function podeAprovarConteudo(perfil: Perfil): boolean {
  return podeAcessar(perfil, 'conteudo') && podeAcessar(perfil, 'aprovacoes');
}
