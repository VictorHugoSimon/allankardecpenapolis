import { NextResponse, type NextRequest } from 'next/server';
import {
  assinarSessao,
  COOKIE_SESSAO,
  lerSessao,
  precisaRenovar,
  SESSAO_INATIVIDADE_S,
} from '@ceak/core/auth/sessao';
import { podeAcessarRota, temAcessoGestao } from '@ceak/core/rbac';

const PUBLICAS = ['/login', '/redefinir-senha'];

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET ausente.');
  return 'dev-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
}

/**
 * Primeira barreira de autorização do Gestão: sessão válida e perfil com acesso
 * ao módulo da rota. As páginas repetem a verificação no servidor (`exigirModulo`)
 * e o banco aplica RLS.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(COOKIE_SESSAO)?.value;
  const sessao = await lerSessao(token, secret());

  if (PUBLICAS.includes(pathname)) {
    if (sessao) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  if (!sessao) {
    const url = new URL('/login', req.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(COOKIE_SESSAO);
    return res;
  }

  let res: NextResponse;
  if (pathname === '/sem-acesso') {
    res = NextResponse.next();
  } else if (!temAcessoGestao(sessao.perfil)) {
    res = NextResponse.redirect(new URL('/sem-acesso', req.url));
  } else if (!podeAcessarRota(sessao.perfil, pathname)) {
    const url = new URL('/sem-acesso', req.url);
    url.searchParams.set('rota', pathname);
    res = NextResponse.rewrite(url, { status: 403 });
  } else {
    res = NextResponse.next();
  }

  // Sessão deslizante: renova o cookie quando passou da metade do tempo de inatividade.
  if (token && (await precisaRenovar(token, secret()))) {
    res.cookies.set(COOKIE_SESSAO, await assinarSessao(sessao, secret()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSAO_INATIVIDADE_S,
    });
  }
  return res;
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|api/health).*)'],
};
