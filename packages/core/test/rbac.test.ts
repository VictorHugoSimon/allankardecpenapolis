import { describe, expect, it } from 'vitest';
import {
  escopo,
  MODULOS,
  moduloDaRota,
  modulosDoPerfil,
  podeAcessar,
  podeAcessarRota,
  PERFIS,
  temAcessoGestao,
  type Modulo,
  type Perfil,
} from '../src/rbac';

// Matriz literal do README (docs/design/README.md › Perfis de acesso).
const ESPERADO: Record<Perfil, Modulo[] | 'todos'> = {
  ADMINISTRADOR: 'todos',
  DIRETORIA: [
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
  ],
  TESOURARIA: ['dashboard', 'doacoes', 'financeiro', 'loja', 'estoque', 'aprovacoes', 'bi'],
  SECRETARIA: [
    'dashboard',
    'pessoas',
    'agenda',
    'eventos',
    'conteudo',
    'comunicacao',
    'aprovacoes',
  ],
  COORDENADOR: [
    'dashboard',
    'pessoas',
    'agenda',
    'eventos',
    'estudos',
    'voluntariado',
    'assistencia',
  ],
  INSTRUTOR: ['dashboard', 'agenda', 'estudos', 'pessoas'],
  VOLUNTARIO: ['dashboard', 'agenda', 'voluntariado', 'assistencia'],
  MEMBRO: [],
  VISITANTE: [],
};

describe('matriz de perfis × módulos', () => {
  it.each(PERFIS)('%s acessa exatamente os módulos do README', (perfil) => {
    const esperado = ESPERADO[perfil];
    const lista = esperado === 'todos' ? MODULOS : esperado;
    expect(new Set(modulosDoPerfil(perfil))).toEqual(new Set(lista));
    for (const m of MODULOS) expect(podeAcessar(perfil, m)).toBe(lista.includes(m));
  });

  it('Membro e Visitante não têm acesso ao Gestão', () => {
    expect(temAcessoGestao('MEMBRO')).toBe(false);
    expect(temAcessoGestao('VISITANTE')).toBe(false);
    expect(temAcessoGestao('VOLUNTARIO')).toBe(true);
  });

  it('aplica escopos restritos', () => {
    expect(escopo('INSTRUTOR', 'pessoas')).toBe('proprios_alunos');
    expect(escopo('VOLUNTARIO', 'assistencia')).toBe('escala');
    expect(escopo('COORDENADOR', 'assistencia')).toBe('total');
    expect(escopo('TESOURARIA', 'pessoas')).toBeNull();
  });
});

describe('rotas do Gestão', () => {
  it('mapeia rotas para módulos', () => {
    expect(moduloDaRota('/')).toBe('dashboard');
    expect(moduloDaRota('/financeiro')).toBe('financeiro');
    expect(moduloDaRota('/pessoas/123')).toBe('pessoas');
    expect(moduloDaRota('/conteudo/editor/9/')).toBe('conteudo');
    expect(moduloDaRota('/ui')).toBeNull();
    expect(moduloDaRota('/desconhecida')).toBeUndefined();
  });

  it('nega rotas fora do perfil', () => {
    expect(podeAcessarRota('TESOURARIA', '/financeiro')).toBe(true);
    expect(podeAcessarRota('SECRETARIA', '/financeiro')).toBe(false);
    expect(podeAcessarRota('INSTRUTOR', '/config')).toBe(false);
    expect(podeAcessarRota('MEMBRO', '/')).toBe(false);
    expect(podeAcessarRota('MEMBRO', '/ui')).toBe(false);
    expect(podeAcessarRota('VOLUNTARIO', '/ui')).toBe(true);
  });

  it('rota desconhecida só para Administrador (404 do Next)', () => {
    expect(podeAcessarRota('DIRETORIA', '/xyz')).toBe(false);
    expect(podeAcessarRota('ADMINISTRADOR', '/xyz')).toBe(true);
  });

  it('não confunde prefixos parecidos', () => {
    expect(moduloDaRota('/loja-x')).toBeUndefined();
    expect(podeAcessarRota('TESOURARIA', '/estoque')).toBe(true);
    expect(podeAcessarRota('DIRETORIA', '/estoque')).toBe(false);
  });
});
