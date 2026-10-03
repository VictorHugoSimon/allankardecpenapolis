import { instituicao } from '@ceak/core';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? instituicao.urls.site).replace(/\/$/, '');
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? instituicao.urls.app).replace(/\/$/, '');
export const GESTAO_URL = (process.env.NEXT_PUBLIC_GESTAO_URL ?? instituicao.urls.gestao).replace(/\/$/, '');
export const siteUrl = (rota = '') => `${SITE_URL}${rota}`;
