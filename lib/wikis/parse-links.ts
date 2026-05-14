const WIKI_LINK_RE = /\[\[([a-z0-9][a-z0-9/_-]*[a-z0-9])\]\]/g

export function extractWikiLinks(contentMd: string): string[] {
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  WIKI_LINK_RE.lastIndex = 0
  while ((m = WIKI_LINK_RE.exec(contentMd)) !== null) {
    seen.add(m[1])
  }
  return [...seen]
}

export function preprocessWikiLinks(contentMd: string): string {
  return contentMd.replace(WIKI_LINK_RE, (_match, slug) => {
    return `[${slug}](/thesis/wikis/${slug})`
  })
}
