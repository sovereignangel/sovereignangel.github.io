import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { verifyAuth } from '@/lib/api-auth'
import { listWikisAdmin, upsertWikiAdmin } from '@/lib/firestore/wikis-admin'
import { validateSlug } from '@/lib/wikis/slugify'
import { WIKI_SURFACES, type WikiSurface } from '@/lib/types/wiki'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isServiceAuth(req: NextRequest): boolean {
  const expected = process.env.INBOX_SHARED_SECRET
  if (!expected) return false
  const provided = req.headers.get('x-inbox-secret')
  if (!provided) return false
  const a = Buffer.from(provided, 'utf-8')
  const b = Buffer.from(expected, 'utf-8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

async function resolveUid(req: NextRequest): Promise<{ uid: string } | NextResponse> {
  if (isServiceAuth(req)) {
    const uid = process.env.FIREBASE_UID || process.env.TRANSCRIPT_WEBHOOK_UID
    if (!uid) {
      return NextResponse.json(
        { error: 'service auth: FIREBASE_UID not configured' },
        { status: 500 }
      )
    }
    return { uid }
  }
  return verifyAuth(req)
}

export async function GET(req: NextRequest) {
  const auth = await resolveUid(req)
  if (auth instanceof NextResponse) return auth

  const surfaceParam = req.nextUrl.searchParams.get('surface')
  const includeArchived = req.nextUrl.searchParams.get('archived') === '1'

  let surface: WikiSurface | undefined
  if (surfaceParam) {
    if (!WIKI_SURFACES.includes(surfaceParam as WikiSurface)) {
      return NextResponse.json(
        { error: `invalid surface — must be one of: ${WIKI_SURFACES.join(', ')}` },
        { status: 400 }
      )
    }
    surface = surfaceParam as WikiSurface
  }

  const items = await listWikisAdmin(auth.uid, { surface, includeArchived })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const auth = await resolveUid(req)
  if (auth instanceof NextResponse) return auth

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const { slug, title, contentMd, surface, updatedBy, agentVersion, pinned, sourceRefs } = body as {
    slug?: string
    title?: string
    contentMd?: string
    surface?: string
    updatedBy?: string
    agentVersion?: string
    pinned?: boolean
    sourceRefs?: unknown
  }

  if (typeof slug !== 'string' || typeof title !== 'string' || typeof contentMd !== 'string') {
    return NextResponse.json(
      { error: 'slug, title, contentMd are required strings' },
      { status: 400 }
    )
  }

  const slugCheck = validateSlug(slug)
  if (!slugCheck.ok) return NextResponse.json({ error: slugCheck.error }, { status: 400 })

  const finalSurface: WikiSurface =
    typeof surface === 'string' && WIKI_SURFACES.includes(surface as WikiSurface)
      ? (surface as WikiSurface)
      : 'general'

  if (title.length > 256) {
    return NextResponse.json({ error: 'title exceeds 256 chars' }, { status: 400 })
  }
  if (contentMd.length > 200_000) {
    return NextResponse.json({ error: 'contentMd exceeds 200KB' }, { status: 400 })
  }

  const wiki = await upsertWikiAdmin(auth.uid, {
    slug,
    title,
    contentMd,
    surface: finalSurface,
    updatedBy,
    agentVersion,
    pinned,
    sourceRefs: Array.isArray(sourceRefs) ? (sourceRefs as Parameters<typeof upsertWikiAdmin>[1]['sourceRefs']) : undefined,
  })

  return NextResponse.json({ wiki })
}
