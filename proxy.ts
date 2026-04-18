import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase isn't configured yet, let all traffic through
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: req })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        response = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refreshes the session if expired — must use getUser(), not getSession()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl
  const isAuthRoute = pathname.startsWith('/auth') || pathname.startsWith('/add-friend')

  // Unauthenticated user trying to access the app → send to login
  if (!user && !isAuthRoute) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated user hitting an auth page → send them in
  if (user && isAuthRoute) {
    const url = req.nextUrl.clone()
    url.pathname = '/today'
    return NextResponse.redirect(url)
  }

  // Authenticated user hitting root → send to today
  if (user && pathname === '/') {
    const url = req.nextUrl.clone()
    url.pathname = '/today'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|brand).*)'],
}
