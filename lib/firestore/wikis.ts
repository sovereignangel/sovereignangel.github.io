import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  orderBy,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import { slugToDocId } from '../wikis/slugify'
import type { Wiki, WikiListItem, WikiSurface, WikiBacklink } from '../types/wiki'

const COLLECTION = 'wikis'

function docToWiki(id: string, data: DocumentData): Wiki {
  return {
    id,
    slug: data.slug,
    title: data.title,
    contentMd: data.contentMd ?? '',
    surface: data.surface ?? 'general',
    sourceRefs: data.sourceRefs ?? [],
    backlinks: data.backlinks ?? [],
    updatedBy: data.updatedBy ?? 'lori',
    agentVersion: data.agentVersion,
    pinned: !!data.pinned,
    archived: !!data.archived,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? new Date().toISOString(),
  }
}

export async function getWikiBySlug(uid: string, slug: string): Promise<Wiki | null> {
  const docId = slugToDocId(slug)
  const ref = doc(db, 'users', uid, COLLECTION, docId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return docToWiki(snap.id, snap.data())
}

export async function listWikis(
  uid: string,
  options: { surface?: WikiSurface; includeArchived?: boolean } = {}
): Promise<WikiListItem[]> {
  const ref = collection(db, 'users', uid, COLLECTION)
  const constraints = []
  if (options.surface) constraints.push(where('surface', '==', options.surface))
  constraints.push(orderBy('updatedAt', 'desc'))
  const q = query(ref, ...constraints)
  const snap = await getDocs(q)
  return snap.docs
    .map(d => docToWiki(d.id, d.data()))
    .filter(w => options.includeArchived || !w.archived)
    .map(w => ({
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

export interface UpsertWikiInput {
  slug: string
  title: string
  contentMd: string
  surface: WikiSurface
  updatedBy?: string
  agentVersion?: string
  pinned?: boolean
  sourceRefs?: Wiki['sourceRefs']
}

export async function upsertWiki(uid: string, input: UpsertWikiInput): Promise<Wiki> {
  const docId = slugToDocId(input.slug)
  const ref = doc(db, 'users', uid, COLLECTION, docId)
  const existing = await getDoc(ref)

  const payload: Record<string, unknown> = {
    slug: input.slug,
    title: input.title,
    contentMd: input.contentMd,
    surface: input.surface,
    updatedBy: input.updatedBy ?? 'lori',
    updatedAt: serverTimestamp(),
  }
  if (input.agentVersion !== undefined) payload.agentVersion = input.agentVersion
  if (input.pinned !== undefined) payload.pinned = input.pinned
  if (input.sourceRefs !== undefined) payload.sourceRefs = input.sourceRefs

  if (!existing.exists()) {
    payload.createdAt = serverTimestamp()
    payload.backlinks = []
    payload.archived = false
    if (input.pinned === undefined) payload.pinned = false
    if (input.sourceRefs === undefined) payload.sourceRefs = []
  }

  await setDoc(ref, payload, { merge: true })
  const updated = await getDoc(ref)
  return docToWiki(updated.id, updated.data()!)
}

export async function archiveWiki(uid: string, slug: string): Promise<void> {
  const docId = slugToDocId(slug)
  const ref = doc(db, 'users', uid, COLLECTION, docId)
  await updateDoc(ref, { archived: true, updatedAt: serverTimestamp() })
}

export async function setPinned(uid: string, slug: string, pinned: boolean): Promise<void> {
  const docId = slugToDocId(slug)
  const ref = doc(db, 'users', uid, COLLECTION, docId)
  await updateDoc(ref, { pinned, updatedAt: serverTimestamp() })
}

export async function updateBacklinks(
  uid: string,
  fromSlug: string,
  toSlugs: string[]
): Promise<void> {
  for (const toSlug of toSlugs) {
    const docId = slugToDocId(toSlug)
    const ref = doc(db, 'users', uid, COLLECTION, docId)
    const snap = await getDoc(ref)
    if (!snap.exists()) continue
    const data = snap.data()
    const current: WikiBacklink[] = data.backlinks ?? []
    if (current.some(b => b.fromSlug === fromSlug)) continue
    await updateDoc(ref, {
      backlinks: [...current, { fromSlug }],
      updatedAt: serverTimestamp(),
    })
  }
}
