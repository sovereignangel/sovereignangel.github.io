'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { preprocessWikiLinks } from '@/lib/wikis/parse-links'

export default function MarkdownView({ content }: { content: string }) {
  const processed = preprocessWikiLinks(content)
  return (
    <div className="wiki-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-serif text-[22px] font-bold text-ink mt-6 mb-3 border-b border-rule pb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif text-[18px] font-semibold text-ink mt-5 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif text-[15px] font-semibold text-ink mt-4 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-serif text-[13px] font-semibold text-ink mt-3 mb-1.5 uppercase tracking-[0.5px]">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="font-serif text-[14px] leading-[1.65] text-ink mb-3">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="font-serif text-[14px] leading-[1.65] text-ink mb-3 pl-5 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="font-serif text-[14px] leading-[1.65] text-ink mb-3 pl-5 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="text-ink">{children}</li>,
          a: ({ children, href }) => {
            const internal = typeof href === 'string' && href.startsWith('/')
            if (internal) {
              return (
                <Link href={href!} className="text-burgundy underline decoration-burgundy/40 hover:decoration-burgundy">
                  {children}
                </Link>
              )
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-burgundy underline decoration-burgundy/40 hover:decoration-burgundy"
              >
                {children}
              </a>
            )
          },
          code: ({ children, className }) => {
            const isBlock = className?.startsWith('language-')
            if (isBlock) {
              return (
                <code className={`font-mono text-[12px] ${className}`}>{children}</code>
              )
            }
            return (
              <code className="font-mono text-[12px] bg-cream px-1 py-0.5 rounded-sm border border-rule">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="font-mono text-[12px] bg-cream border border-rule rounded-sm p-3 mb-3 overflow-x-auto leading-[1.5]">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="font-serif text-[14px] italic text-ink-muted border-l-2 border-burgundy/40 pl-3 mb-3">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="font-mono text-[12px] border border-rule border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-cream">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-rule px-2 py-1 text-left font-semibold text-burgundy uppercase tracking-[0.5px] text-[10px]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-rule px-2 py-1 text-ink align-top">{children}</td>
          ),
          hr: () => <hr className="border-rule my-4" />,
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
