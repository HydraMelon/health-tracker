import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard']
const authRoutes      = ['/login', '/register']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isLoggedIn   = req.cookies.has('auth_flag')

  if (protectedRoutes.some(r => pathname.startsWith(r)) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (authRoutes.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
