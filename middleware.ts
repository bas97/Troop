import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/password',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/icons',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths through
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const auth = req.cookies.get('troop_auth')?.value
  const expected = process.env.TROOP_AUTH_TOKEN

  if (!expected || auth !== expected) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/password'
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
