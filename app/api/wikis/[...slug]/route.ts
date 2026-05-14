import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { verifyAuth } from '@/lib/api-auth'
import { archiveWikiAdmin, getWikiBySlugAdmin, setPinnedAdmin, upsertWikiAdmin } from '@/lib/firestore/wikis-admin'
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

function joinSlug(slugParts: string[]): string {
  return slugParts.map(decodeURIComponent).join('/')
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const auth = await resolveUid(req)
  if (auth instanceof NextResponse) return auth

  const { slug: parts } = await ctx.params
  const slug = joinSlug(parts)
  const slugCheck = validateSlug(slug)
  if (!slugCheck.ok) return NextResponse.json({ error: slugCheck.error }, { status: 400 })

  const wiki = await getWikiBySlugAdmin(auth.uid, slug)
  if (!wiki) return NextResponse.json({ error: 'wiki not found' }, { status: 404 })
  return NextResponse.json({ wiki })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const auth = await resolveUid(req)
  if (auth instanceof NextResponse) return auth

  const { slug: parts } = await ctx.params
  const slug = joinSlug(parts)
  const slugCheck = validateSlug(slug)
  if (!slugCheck.ok) return NextResponse.json({ error: slugCheck.error }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const existing = await getWikiBySlugAdmin(auth.uid, slug)
  if (!existing) return NextResponse.json({ error: 'wiki not found' }, { status: 404 })

  const title = typeof body.title === 'string' ? body.title : existing.title
  const contentMd = typeof body.contentMd === 'string' ? body.contentMd : existing.contentMd
  const surfaceInput = typeof body.surface === 'string' ? body.surface : existing.surface
  const surface: WikiSurface = WIKI_SURFACES.includes(surfaceInput as WikiSurface)
    ? (surfaceInput as WikiSurface)
    : existing.surface
  const updatedBy = typeof body.updatedBy === 'string' ? body.updatedBy : 'lori'
  const agentVersion = typeof body.agentVersion === 'string' ? body.agentVersion : undefined
  const pinned = typeof body.pinned === 'boolean' ? body.pinned : undefined

  if (title.length > 256) return NextResponse.json({ error: 'title exceeds 256 chars' }, { status: 400 })
  if (contentMd.length > 200_000) return NextResponse.json({ error: 'contentMd exceeds 200KB' }, { status: 400 })

  const wiki = await upsertWikiAdmin(auth.uid, {
    slug,
    title,
    contentMd,
    surface,
    updatedBy,
    agentVersion,
    pinned,
  })

  return NextResponse.json({ wiki })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const auth = await resolveUid(req)
  if (auth instanceof NextResponse) return auth

  const { slug: parts } = await ctx.params
  const slug = joinSlug(parts)
  const slugCheck = validateSlug(slug)
  if (!slugCheck.ok) return NextResponse.json({ error: slugCheck.error }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (typeof body.pinned === 'boolean') {
    await setPinnedAdmin(auth.uid, slug, body.pinned)
  }

  const wiki = await getWikiBySlugAdmin(auth.uid, slug)
  return NextResponse.json({ wiki })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const auth = await resolveUid(req)
  if (auth instanceof NextResponse) return auth

  const { slug: parts } = await ctx.params
  const slug = joinSlug(parts)
  const slugCheck = validateSlug(slug)
  if (!slugCheck.ok) return NextResponse.json({ error: slugCheck.error }, { status: 400 })

  await archiveWikiAdmin(auth.uid, slug)
  return NextResponse.json({ ok: true, archived: true })
}
