/**
 * Sessão do CEAK App: cookie próprio (não se mistura com o do Gestão) e validade
 * mais longa, adequada a um app instalado no celular. Configurável por APP_SESSAO_DIAS.
 */
export const COOKIE_APP = 'ceak_app_sessao';
export const APP_SESSAO_S = Math.max(1, Number(process.env.APP_SESSAO_DIAS ?? 30)) * 86_400;
