import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Check optimista (solo mira si la cookie existe, sin validarla) para evitar
// una llamada a la base de datos en cada navegación. La comprobación real de
// la sesión vive en requireUser() (lib/session.ts), que se ejecuta en cada
// página protegida y en /login (ver app/login/page.tsx) — esa es la que
// decide el redirect cuando la cookie existe pero ya no es válida. No hacer
// aquí el redirect inverso (login -> dashboard solo por la cookie): con una
// sesión caducada o borrada, la página de dashboard rebotaría a /login y esto
// la mandaría de vuelta a /dashboard, un bucle infinito.
export function proxy(request: NextRequest) {
  const isAuth = !!request.cookies.get('aura_session')?.value
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  if (isDashboard && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
