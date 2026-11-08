#!/usr/bin/env node
/**
 * CEAK Digital: smoke test HTTP externo sem login, cookies ou segredos.
 * Uso: node scripts/verificar-urls-publicas.mjs
 * URLs alternativas: CEAK_SITE_URL, CEAK_APP_URL, CEAK_GESTAO_URL.
 * Isto nao comprova autenticacao, integracoes ou instalacao do PWA.
 */
const destinos = [
  ['Site institucional', process.env.CEAK_SITE_URL || 'https://ceak-site-git-preview.vercel.app/'],
  ['CEAK App (PWA)', process.env.CEAK_APP_URL || 'https://ceak-app-git-preview.vercel.app/'],
  ['CEAK Gestão (login)', process.env.CEAK_GESTAO_URL || 'https://ceak-gestao-git-preview.vercel.app/login'],
];

async function verificar(nome, endereco) {
  let url;
  try {
    url = new URL(endereco);
    if (url.protocol !== 'https:') throw new Error('HTTPS obrigatório');
  } catch {
    console.error(`FALHA: ${nome}: URL HTTPS inválida`);
    return false;
  }

  try {
    const resposta = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': 'CEAK-Digital-Smoke-Check/1.0' },
    });
    const tipo = resposta.headers.get('content-type') || '';
    const destino = new URL(resposta.url);
    const ok = resposta.ok && tipo.includes('text/html') &&
      destino.protocol === 'https:' && !destino.hostname.endsWith('vercel.com');
    console.log(`${ok ? 'OK' : 'FALHA'}: ${nome} — HTTP ${resposta.status}, ${tipo.split(';')[0] || 'sem content-type'}`);
    if (!ok) console.log(`  Verifique publicação, proteção de acesso ou redirecionamento: ${destino.origin}`);
    return ok;
  } catch (erro) {
    console.error(`FALHA: ${nome} — ${erro?.name === 'TimeoutError' ? 'tempo limite excedido' : 'falha de conexão/TLS'}`);
    return false;
  }
}

const resultados = await Promise.all(destinos.map(([nome, url]) => verificar(nome, url)));
if (resultados.every(Boolean)) {
  console.log('Smoke HTTP público aprovado. Homologação funcional e mobile ainda necessária.');
} else {
  console.error('Uma ou mais plataformas não passaram na checagem HTTP pública.');
  process.exitCode = 1;
}
