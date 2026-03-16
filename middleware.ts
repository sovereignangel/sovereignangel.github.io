import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  // alamobernal.loricorpuz.com → rewrite to /alamo-bernal
  if (host === 'alamobernal.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/alamo-bernal${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // arc.loricorpuz.com → rewrite to /arc
  if (host === 'arc.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/arc${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // latentspace.loricorpuz.com → rewrite to /latent-space
  if (host === 'latentspace.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/latent-space${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
