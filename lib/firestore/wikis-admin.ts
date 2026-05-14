import { adminDb } from '@/lib/firebase-admin'
import type { Wiki, WikiListItem, WikiSurface, WikiBacklink } from '@/lib/types/wiki'
import { slugToDocId, docIdToSlug, validateSlug } from '@/lib/wikis/slugify'
import { extractWikiLinks } from '@/lib/wikis/parse-links'

const COLLECTION = 'wikis'

function isoNow(): string {
  return new Date().toISOString()
}

function tsToIso(v: unknown, fallback: string): string {
  if (!v) return fallback
  if (typeof v === 'string') return v
  const maybeTs = v as { toDate?: () => Date }
  if (typeof maybeTs.toDate === 'function') return maybeTs.toDate().toISOString()
  if (v instanceof Date) return v.toISOString()
  return fallback
}

function rowToWiki(id: string, data: FirebaseFirestore.DocumentData): Wiki {
  const now = isoNow()
  return {
    id,
    slug: data.slug,
    title: data.title,
    contentMd: data.contentMd ?? '',
    surface: (data.surface ?? 'general') as WikiSurface,
    sourceRefs: data.sourceRefs ?? [],
    backlinks: data.backlinks ?? [],
    updatedBy: data.updatedBy ?? 'lori',
    agentVersion: data.agentVersion,
    pinned: !!data.pinned,
    archived: !!data.archived,
    createdAt: tsToIso(data.createdAt, now),
    updatedAt: tsToIso(data.updatedAt, now),
  }
}

function wikiCol(uid: string) {
  return adminDb.collection('users').doc(uid).collection(COLLECTION)
}

export async function getWikiBySlugAdmin(uid: string, slug: string): Promise<Wiki | null> {
  const v = validateSlug(slug)
  if (!v.ok) return null
  const docId = slugToDocId(slug)
  const snap = await wikiCol(uid).doc(docId).get()
  if (!snap.exists) return null
  return rowToWiki(snap.id, snap.data()!)
}

export async function listWikisAdmin(
  uid: string,
  options: { surface?: WikiSurface; includeArchived?: boolean; limit?: number } = {},
): Promise<WikiListItem[]> {
  const { surface, includeArchived = false, limit = 500 } = options
  let q: FirebaseFirestore.Query = wikiCol(uid).orderBy('updatedAt', 'desc').limit(limit)
  if (surface) q = q.where('surface', '==', surface)
  const snap = await q.get()
  const wikis = snap.docs.map(d => rowToWiki(d.id, d.data()))
  const visible = includeArchived ? wikis : wikis.filter(w => !w.archived)
  visible.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return (b.updatedAt || '').localeCompare(a.updatedAt || '')
  })
  return visible.map(w => ({
    id: w.id!,
    slug: w.slug,
    title: w.title,
    surface: w.surface,
    updatedBy: w.updatedBy,
    pinned: w.pinned,
    archived: w.archived,
    updatedAt: w.updatedAt,
  }))
}

export interface UpsertWikiAdminInput {
  slug: string
  title: string
  contentMd: string
  surface: WikiSurface
  updatedBy?: string
  agentVersion?: string
  pinned?: boolean
  sourceRefs?: Wiki['sourceRefs']
}

export async function upsertWikiAdmin(uid: string, input: UpsertWikiAdminInput): Promise<Wiki> {
  const v = validateSlug(input.slug)
  if (!v.ok) throw new Error(v.error)
  const docId = slugToDocId(input.slug)
  const ref = wikiCol(uid).doc(docId)
  const existing = await ref.get()
  const now = isoNow()

  const next: Wiki = {
    slug: input.slug,
    title: input.title.trim(),
    contentMd: input.contentMd,
    surface: input.surface,
    sourceRefs: input.sourceRefs ?? (existing.exists ? (existing.data() as Wiki).sourceRefs ?? [] : []),
    backlinks: existing.exists ? (existing.data() as Wiki).backlinks ?? [] : [],
    updatedBy: input.updatedBy ?? 'lori',
    agentVersion: input.agentVersion,
    pinned: input.pinned ?? (existing.exists ? !!(existing.data() as Wiki).pinned : false),
    archived: existing.exists ? !!(existing.data() as Wiki).archived : false,
    createdAt: existing.exists ? (existing.data() as Wiki).createdAt : now,
    updatedAt: now,
  }

  await ref.set(next, { merge: true })
  await syncBacklinksAdmin(uid, input.slug, input.contentMd)
  return next
}

export async function archiveWikiAdmin(uid: string, slug: string): Promise<boolean> {
  const v = validateSlug(slug)
  if (!v.ok) return false
  const ref = wikiCol(uid).doc(slugToDocId(slug))
  const snap = await ref.get()
  if (!snap.exists) return false
  await ref.update({ archived: true, updatedAt: isoNow() })
  return true
}

export async function setPinnedAdmin(uid: string, slug: string, pinned: boolean): Promise<boolean> {
  const v = validateSlug(slug)
  if (!v.ok) return false
  const ref = wikiCol(uid).doc(slugToDocId(slug))
  const snap = await ref.get()
  if (!snap.exists) return false
  await ref.update({ pinned, updatedAt: isoNow() })
  return true
}

async function syncBacklinksAdmin(uid: string, fromSlug: string, contentMd: string): Promise<void> {
  const referenced = extractWikiLinks(contentMd)
  if (referenced.length === 0) return
  for (const targetSlug of referenced) {
    if (targetSlug === fromSlug) continue
    const v = validateSlug(targetSlug)
    if (!v.ok) continue
    const targetRef = wikiCol(uid).doc(slugToDocId(targetSlug))
    const targetSnap = await targetRef.get()
    if (!targetSnap.exists) continue
    const target = targetSnap.data() as Wiki
    const existingBacklinks: WikiBacklink[] = target.backlinks ?? []
    if (existingBacklinks.some(b => b.fromSlug === fromSlug)) continue
    await targetRef.update({
      backlinks: [...existingBacklinks, { fromSlug }],
      updatedAt: isoNow(),
    })
  }
}

export async function listAllSlugsAdmin(uid: string): Promise<string[]> {
  const snap = await wikiCol(uid).select('slug').get()
  return snap.docs.map(d => docIdToSlug(d.id))
}
