import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

/** Checagem otimista: sem cookie de sessão, vai para o login. A checagem de verdade é no servidor (src/data/sessao.ts). */
export function proxy(request: NextRequest) {
  // Sem banco (dados em memória) não há login.
  if (!process.env.DATABASE_URL || getSessionCookie(request)) return NextResponse.next()
  const login = new URL('/login', request.url)
  if (request.nextUrl.pathname !== '/') login.searchParams.set('voltar', request.nextUrl.pathname)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
