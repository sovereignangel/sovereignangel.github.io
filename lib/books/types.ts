/** Local book library — PDFs in app/books/, text extracted to data/books/. */

export interface BookPage {
  n: number
  text: string
}

/** Manifest entry — everything except the page text. */
export interface BookMeta {
  slug: string
  title: string
  author: string
  year?: string
  filename: string
  sourceSize: number
  totalPages: number
  charCount: number
  extractedAt: string
}

export interface BookRecord extends BookMeta {
  pages: BookPage[]
}

export interface BookManifest {
  generatedAt: string
  books: BookMeta[]
}

export interface BookSearchHit {
  slug: string
  title: string
  author: string
  page: number
  score: number
  /** Plain-text excerpt around the strongest match on the page. */
  snippet: string
}

export interface BookSearchResponse {
  query: string
  terms: string[]
  totalHits: number
  hits: BookSearchHit[]
  /** Hit counts per book, for the filter chips. */
  byBook: { slug: string; title: string; hits: number }[]
}
