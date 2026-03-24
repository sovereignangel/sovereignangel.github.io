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

  // aruba.loricorpuz.com → rewrite to /aruba
  if (host === 'aruba.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/aruba${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // scavengerhunt.loricorpuz.com → rewrite to /scavenger-hunt
  if (host === 'scavengerhunt.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/scavenger-hunt${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // latentspace.loricorpuz.com — hidden from public
  if (host.startsWith('latentspace.')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // /latent-space route — hidden from public
  if (request.nextUrl.pathname.startsWith('/latent-space')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
