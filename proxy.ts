import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) return NextResponse.next()

  const cookie = request.cookies.get('auth')
  if (cookie?.value === process.env.SITE_PASSWORD) return NextResponse.next()

  if (request.nextUrl.pathname === '/login') return NextResponse.next()

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
