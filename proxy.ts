import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Check optimista (solo mira si la cookie existe) para el redirect de UX.
// La comprobación real de la sesión vive en requireUser() (lib/session.ts),
// que se ejecuta en cada página/ruta protegida.
export function proxy(request: NextRequest) {
  const token = request.cookies.get('aura_session')?.value
  const isAuth = !!token
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isLogin = request.nextUrl.pathname.startsWith('/login')

  if (isDashboard && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLogin && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
}
