import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  // Force HTTPS on subdomains — prevents HTTP/HTTPS CORS mismatch
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  if (proto === 'http' && host.endsWith('.loricorpuz.com')) {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 308)
  }

  // arc.loricorpuz.com → rewrite to /arc
  if (host === 'arc.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/arc${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // arete.loricorpuz.com → rewrite to /arete
  if (host === 'arete.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/arete${url.pathname === '/' ? '' : url.pathname}`
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

  // read.loricorpuz.com → rewrite to /read
  if (host === 'read.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/read${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // lordas.loricorpuz.com → rewrite to /lordas
  if (host === 'lordas.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/lordas${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // markovagents.loricorpuz.com → rewrite to /markov-agents
  if (host === 'markovagents.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/markov-agents${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // peakstate.loricorpuz.com → rewrite to /peak-state
  if (host === 'peakstate.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/peak-state${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // stillpoint.loricorpuz.com → rewrite to /stillpoint
  if (host === 'stillpoint.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/stillpoint${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // atune.loricorpuz.com → rewrite to /atune
  if (host === 'atune.loricorpuz.com') {
    const url = request.nextUrl.clone()
    url.pathname = `/atune${url.pathname === '/' ? '' : url.pathname}`
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.[a-zA-Z0-9]+$).*)'],
}
