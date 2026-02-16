import { NextRequest, NextResponse } from 'next/server'

// Fetches full book text from archive.org by reading the DJVU XML page-by-page
// via the BookReader text API — the same API the web reader uses.
// This works even for lending-only books where direct .txt download returns 403.

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  if (!id || !/^[a-zA-Z0-9._-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 })
  }

  try {
    // Step 1: Get metadata to find server, dir, and page count
    const metaRes = await fetch(`https://archive.org/metadata/${id}`)
    if (!metaRes.ok) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }
    const meta = await metaRes.json()

    const server = meta.server
    const dir = meta.dir
    if (!server || !dir) {
      return NextResponse.json({ error: 'Could not determine book server' }, { status: 500 })
    }

    // Find the DJVU XML file for page text
    const files = meta.files || []
    const djvuXml = files.find((f: { name: string }) => f.name.endsWith('_djvu.xml'))

    if (!djvuXml) {
      return NextResponse.json({ error: 'No OCR text available for this book' }, { status: 404 })
    }

    // Get page count from the scandata XML or estimate from file info
    const scandataFile = files.find((f: { name: string }) =>
      f.name.endsWith('_scandata.xml') || f.name === 'scandata.xml'
    )

    let pageCount = 0

    // Try to get page count from the BookReader init endpoint
    const brInitUrl = `https://${server}/BookReader/BookReaderJSIA.php?id=${id}&itemPath=${dir}&server=${server}&format=jsonp&subPrefix=${id}`
    try {
      const brRes = await fetch(brInitUrl)
      if (brRes.ok) {
        let brText = await brRes.text()
        // Strip JSONP wrapper if present
        brText = brText.replace(/^[^{]*/, '').replace(/[^}]*$/, '')
        const brData = JSON.parse(brText)
        pageCount = brData.data?.numPages || brData.numPages || 0
      }
    } catch {
      // Fall back to scanning file sizes
    }

    // If we couldn't get page count, try scandata
    if (pageCount === 0 && scandataFile) {
      try {
        const sdUrl = `https://${server}${dir}/${scandataFile.name}`
        const sdRes = await fetch(sdUrl)
        if (sdRes.ok) {
          const sdText = await sdRes.text()
          const pageMatches = sdText.match(/<page /g)
          if (pageMatches) pageCount = pageMatches.length
        }
      } catch {
        // Ignore
      }
    }

    // Last resort: estimate from djvu.xml file size (very rough: ~2KB per page)
    if (pageCount === 0) {
      const xmlSize = parseInt(djvuXml.size || '0', 10)
      pageCount = Math.max(10, Math.ceil(xmlSize / 2000))
    }

    // Cap at reasonable limit to avoid huge requests
    const maxPages = Math.min(pageCount, 800)

    // Step 2: Fetch text page-by-page using the BookReader text wrapper
    const xmlPath = `${dir}/${djvuXml.name}`
    const batchSize = 20
    const allPages: string[] = []

    for (let start = 0; start < maxPages; start += batchSize) {
      const end = Math.min(start + batchSize, maxPages)
      const promises: Promise<string>[] = []

      for (let page = start; page < end; page++) {
        const pageUrl = `https://${server}/BookReader/BookReaderGetTextWrapper.php?path=${encodeURIComponent(xmlPath)}&mode=1up&page=${page}`
        promises.push(
          fetch(pageUrl)
            .then(r => r.ok ? r.text() : '')
            .then(html => {
              // Strip HTML tags to get plain text
              return html
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<p[^>]*>/gi, '\n\n')
                .replace(/<\/p>/gi, '')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim()
            })
            .catch(() => '')
        )
      }

      const results = await Promise.all(promises)
      allPages.push(...results)
    }

    const fullText = allPages
      .filter(p => p.length > 0)
      .join('\n\n')

    if (fullText.length < 100) {
      return NextResponse.json({ error: 'Could not extract sufficient text from this book' }, { status: 404 })
    }

    return NextResponse.json({
      text: fullText,
      title: meta.metadata?.title || id,
      creator: meta.metadata?.creator || 'Unknown Author',
      pageCount: maxPages,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to extract book text' },
      { status: 502 }
    )
  }
}
