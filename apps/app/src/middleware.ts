import { NextResponse, type NextRequest } from 'next/server';
import { assinarSessao, lerSessao, precisaRenovar } from '@ceak/core/auth/sessao';
import { APP_SESSAO_S, COOKIE_APP } from './lib/sessao-config';

/** Telas de acesso: quem já tem sessão vai para o início. */
const PUBLICAS = ['/entrar', '/entrar/codigo', '/cadastro'];
/** Livres para todos (página offline do service worker e health check). */
const LIVRES = ['/offline', '/api/health'];

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET ausente.');
  return 'dev-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
}

/** Área do membro: exige sessão (as páginas e serviços filtram tudo pela pessoa da sessão). */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(COOKIE_APP)?.value;
  const sessao = await lerSessao(token, secret());

  if (LIVRES.includes(pathname)) return NextResponse.next();
  if (PUBLICAS.includes(pathname)) {
    if (sessao) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }
  if (!sessao) {
    if (pathname.startsWith('/api/'))
      return NextResponse.json({ erro: 'Sessão expirada.' }, { status: 401 });
    const url = new URL('/entrar', req.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(COOKIE_APP);
    return res;
  }
  const res = NextResponse.next();
  if (token && (await precisaRenovar(token, secret()))) {
    res.cookies.set(COOKIE_APP, await assinarSessao(sessao, secret(), APP_SESSAO_S), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: APP_SESSAO_S,
    });
  }
  return res;
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|icons/|manifest.webmanifest|sw.js|swe-worker|robots.txt).*)',
  ],
};
