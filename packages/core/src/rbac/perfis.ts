/** Perfis de acesso. Os valores coincidem com o enum `Perfil` do Prisma. */
export const PERFIS = [
  'ADMINISTRADOR',
  'DIRETORIA',
  'TESOURARIA',
  'SECRETARIA',
  'COORDENADOR',
  'INSTRUTOR',
  'VOLUNTARIO',
  'MEMBRO',
  'VISITANTE',
] as const;

export type Perfil = (typeof PERFIS)[number];

export const PERFIL_LABEL: Record<Perfil, string> = {
  ADMINISTRADOR: 'Administrador',
  DIRETORIA: 'Diretoria',
  TESOURARIA: 'Tesouraria',
  SECRETARIA: 'Secretaria',
  COORDENADOR: 'Coordenador',
  INSTRUTOR: 'Instrutor',
  VOLUNTARIO: 'Voluntário',
  MEMBRO: 'Membro',
  VISITANTE: 'Visitante',
};

export function isPerfil(v: unknown): v is Perfil {
  return typeof v === 'string' && (PERFIS as readonly string[]).includes(v);
}
