import { instituicao } from '@ceak/core';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? instituicao.urls.site).replace(
  /\/$/,
  '',
);
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? instituicao.urls.app).replace(/\/$/, '');
export const GESTAO_URL = (process.env.NEXT_PUBLIC_GESTAO_URL ?? instituicao.urls.gestao).replace(
  /\/$/,
  '',
);

export const appUrl = (rota = '') => `${APP_URL}${rota}`;
export const urlAbsoluta = (rota: string) => `${SITE_URL}${rota}`;

/** Detalhe de uma atividade: palestras em /palestras, demais em /agenda. */
export function urlEvento(e: { slug: string; tipo: string }) {
  return e.tipo === 'PALESTRA' ? `/palestras/${e.slug}` : `/agenda/${e.slug}`;
}
