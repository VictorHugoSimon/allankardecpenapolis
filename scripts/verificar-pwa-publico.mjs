#!/usr/bin/env node
/**
 * CEAK Digital — checagem pública do PWA.
 * Não usa credenciais nem grava dados. Valida manifesto e imagens em HTTPS.
 * Uso: node scripts/verificar-pwa-publico.mjs
 * CEAK_APP_URL permite usar o domínio definitivo.
 */
const base = new URL(process.env.CEAK_APP_URL || 'https://ceak-app-git-preview.vercel.app/');
if (base.protocol !== 'https:') {
  console.error('CEAK_APP_URL precisa usar HTTPS.');
  process.exit(1);
}

async function consultar(url, aceitarTipo) {
  const resposta = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
    headers: { 'user-agent': 'CEAK-Digital-PWA-Check/1.0' },
  });
  const tipo = resposta.headers.get('content-type')?.split(';')[0]?.trim() || '';
  if (!resposta.ok || !aceitarTipo.includes(tipo)) {
    throw new Error(`HTTP ${resposta.status}, tipo ${tipo || 'ausente'}`);
  }
  if (new URL(resposta.url).protocol !== 'https:') {
    throw new Error('Redirecionamento inseguro');
  }
  return resposta;
}

const falhas = [];
async function testar(rotulo, url, tipos, validar) {
  try {
    const resposta = await consultar(url, tipos);
    if (validar) await validar(resposta);
    console.log(`OK: ${rotulo}`);
  } catch (erro) {
    falhas.push(rotulo);
    console.error(`FALHA: ${rotulo} — ${erro.message}`);
  }
}

await testar('Página inicial', base, ['text/html'], async (r) => {
  const html = await r.text();
  if (!html.includes('<html')) throw new Error('HTML não encontrado');
});

const manifestUrl = new URL('/manifest.webmanifest', base);
await testar('Manifesto PWA', manifestUrl, ['application/manifest+json', 'application/json'], async (r) => {
  const data = await r.json();
  if (data.display !== 'standalone') throw new Error('display standalone ausente');
  if (!data.name || !data.start_url || !data.scope) throw new Error('campos essenciais ausentes');
  if (!Array.isArray(data.icons)) throw new Error('ícones ausentes');
  const tamanhos = new Set(data.icons.map((i) => i.sizes));
  if (!tamanhos.has('192x192') || !tamanhos.has('512x512')) {
    throw new Error('ícones 192x192 e 512x512 obrigatórios');
  }
  const icones = data.icons.filter((i) => ['192x192', '512x512'].includes(i.sizes));
  for (const icone of icones) {
    const endereco = new URL(icone.src, manifestUrl);
    if (endereco.origin !== base.origin) throw new Error('ícone externo não permitido');
    const img = await consultar(endereco, ['image/png']);
    const bytes = await img.arrayBuffer();
    if (bytes.byteLength < 100) throw new Error('ícone vazio');
  }
});

await testar('Service worker', new URL('/sw.js', base), ['text/javascript', 'application/javascript'], async (r) => {
  const script = await r.text();
  if (script.length < 100) throw new Error('service worker vazio');
});

if (falhas.length) {
  console.error(`Checagem PWA reprovada: ${falhas.join(', ')}.`);
  process.exitCode = 1;
} else {
  console.log('Recursos públicos do PWA verificados. Instalação em Android/iOS exige teste manual.');
}
