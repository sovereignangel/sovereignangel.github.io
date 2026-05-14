const SLUG_VALID = /^[a-z0-9][a-z0-9/_-]*[a-z0-9]$/

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/\/-+|-+\//g, '/')
}

export function validateSlug(slug: string): { ok: true } | { ok: false; error: string } {
  if (typeof slug !== 'string' || slug.length === 0) {
    return { ok: false, error: 'slug must be a non-empty string' }
  }
  if (slug.length > 256) {
    return { ok: false, error: 'slug exceeds 256 chars' }
  }
  if (slug.startsWith('/') || slug.endsWith('/')) {
    return { ok: false, error: 'slug cannot start or end with /' }
  }
  if (slug.includes('//')) {
    return { ok: false, error: 'slug cannot contain consecutive /' }
  }
  if (!SLUG_VALID.test(slug)) {
    return {
      ok: false,
      error: 'slug must match [a-z0-9][a-z0-9/_-]*[a-z0-9] (lowercase letters, digits, _, -, /)',
    }
  }
  return { ok: true }
}

export function slugToDocId(slug: string): string {
  return slug.replace(/\//g, '___')
}

export function docIdToSlug(docId: string): string {
  return docId.replace(/___/g, '/')
}
