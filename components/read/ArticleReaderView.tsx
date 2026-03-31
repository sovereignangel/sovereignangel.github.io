'use client'

import { useState } from 'react'

interface ArticleReaderViewProps {
  title: string
  author: string
  siteName?: string
  content: string  // HTML content from Readability
  onClose: () => void
}

export default function ArticleReaderView({ title, author, siteName, content, onClose }: ArticleReaderViewProps) {
  const [fontSize, setFontSize] = useState(17)

  return (
    <div className="fixed inset-0 z-50 bg-cream flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-rule bg-white shrink-0">
        <button
          onClick={onClose}
          className="text-[10px] font-serif font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-ink-faint transition-colors"
        >
          Close
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-serif text-[13px] font-semibold text-burgundy truncate">{title}</div>
          <div className="text-[10px] text-ink-muted">{author}{siteName ? ` · ${siteName}` : ''}</div>
        </div>

        {/* Font size controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFontSize(s => Math.max(13, s - 1))}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink"
          >
            A-
          </button>
          <span className="font-mono text-[9px] text-ink-muted w-8 text-center">{fontSize}px</span>
          <button
            onClick={() => setFontSize(s => Math.min(28, s + 1))}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink"
          >
            A+
          </button>
        </div>
      </div>

      {/* Article content */}
      <div className="flex-1 overflow-y-auto">
        <article
          className="max-w-[680px] mx-auto px-6 py-8"
          style={{ fontSize: `${fontSize}px` }}
        >
          <h1 className="font-serif text-[1.8em] font-bold text-ink leading-tight mb-2">{title}</h1>
          <div className="text-[0.75em] text-ink-muted mb-6 pb-4 border-b border-rule-light">
            {author}{siteName ? ` · ${siteName}` : ''}
          </div>
          <div
            className="article-content font-serif text-ink leading-[1.7] [&_p]:mb-4 [&_h1]:text-[1.4em] [&_h1]:font-bold [&_h1]:text-ink [&_h1]:mt-8 [&_h1]:mb-3 [&_h2]:text-[1.2em] [&_h2]:font-bold [&_h2]:text-ink [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-[1.05em] [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-5 [&_h3]:mb-2 [&_a]:text-burgundy [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-burgundy/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ink-muted [&_img]:max-w-full [&_img]:rounded-sm [&_img]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1 [&_pre]:bg-paper [&_pre]:border [&_pre]:border-rule [&_pre]:rounded-sm [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:text-[0.85em] [&_pre]:mb-4 [&_code]:font-mono [&_code]:text-[0.9em] [&_figure]:my-4 [&_figcaption]:text-[0.8em] [&_figcaption]:text-ink-muted [&_figcaption]:mt-1"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>
      </div>
    </div>
  )
}
