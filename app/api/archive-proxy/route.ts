import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = ['archive.org', 'gutenberg.org', 'gutendex.com', 'arxiv.org', 'biorxiv.org', 'incompleteideas.net']

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    const parsed = new URL(url)
    if (!ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const status = response.status
      const errorMsg = status === 403
        ? 'restricted'
        : `Upstream returned ${status}`
      return NextResponse.json({ error: errorMsg }, { status })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const body = await response.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to fetch' },
      { status: 502 }
    )
  }
}
