'use client'

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { useParams } from 'next/navigation'

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const post = getPostBySlug(slug)

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-[19px] font-medium text-[#1a1a1a] mb-2">Post not found</h1>
          <Link href="/blog" className="text-[13px] text-[#999] hover:text-[#1a1a1a] no-underline">
            ← Back to writing
          </Link>
        </div>
      </div>
    )
  }

  const posts = getAllPosts()
  const currentIndex = posts.findIndex((p) => p.slug === slug)
  const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null
  const prevPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[640px] mx-auto py-20 px-6 max-[480px]:py-12 max-[480px]:px-5">
        {/* Nav */}
        <Link href="/blog" className="text-[13px] text-[#999] hover:text-[#1a1a1a] transition-colors no-underline">
          ← Writing
        </Link>

        {/* Post header */}
        <header className="mt-8 mb-10">
          <div className="flex items-center gap-3 mb-3">
            <time className="text-[13px] text-[#999] tabular-nums">{formatDate(post.date)}</time>
            <span className="text-[11px] text-[#bbb]">{post.readTime}</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#1a1a1a] mb-2 leading-tight">
            {post.title}
          </h1>
          <p className="text-[17px] text-[#888] leading-relaxed font-serif italic">
            {post.subtitle}
          </p>
          <div className="flex gap-2 mt-3">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[11px] text-[#aaa] border border-[#e5e5e5] rounded-sm px-1.5 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Post content */}
        <article className="prose-custom">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 className="text-[19px] font-semibold text-[#1a1a1a] tracking-tight mt-10 mb-4">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-[17px] font-medium text-[#1a1a1a] mt-8 mb-3">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-[15px] text-[#444] leading-[1.75] mb-5">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="space-y-1.5 mb-5 ml-4">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="space-y-1.5 mb-5 ml-4 list-decimal">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-[15px] text-[#444] leading-[1.75] pl-1">
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-[#1a1a1a]">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-[#666]">{children}</em>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[#ddd] pl-4 my-6 italic text-[#666]">
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-')
                if (isBlock) {
                  return (
                    <code className="block bg-[#f8f8f8] border border-[#eee] rounded-sm p-4 text-[13px] font-mono text-[#333] overflow-x-auto mb-5">
                      {children}
                    </code>
                  )
                }
                return (
                  <code className="bg-[#f5f5f5] text-[14px] font-mono text-[#c7254e] px-1 py-0.5 rounded-sm">
                    {children}
                  </code>
                )
              },
              hr: () => (
                <hr className="border-none border-t border-[#eee] my-10" />
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-[#1a1a1a] border-b border-[#ccc] hover:border-[#1a1a1a] transition-colors no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        {/* Post navigation */}
        <nav className="mt-12 pt-8 border-t border-[#eee] flex justify-between">
          {prevPost ? (
            <Link href={`/blog/${prevPost.slug}`} className="no-underline group">
              <span className="text-[11px] text-[#999] block mb-1">← Previous</span>
              <span className="text-[15px] text-[#1a1a1a] group-hover:text-[#555] transition-colors">
                {prevPost.title}
              </span>
            </Link>
          ) : <div />}
          {nextPost ? (
            <Link href={`/blog/${nextPost.slug}`} className="no-underline group text-right">
              <span className="text-[11px] text-[#999] block mb-1">Next →</span>
              <span className="text-[15px] text-[#1a1a1a] group-hover:text-[#555] transition-colors">
                {nextPost.title}
              </span>
            </Link>
          ) : <div />}
        </nav>

        {/* Footer */}
        <footer className="pt-8 mt-8 border-t border-[#eee]">
          <p className="text-[13px] text-[#999]">
            <Link href="/" className="text-[#1a1a1a] border-b border-[#ddd] hover:border-[#1a1a1a] no-underline transition-colors">
              Lori Corpuz
            </Link>
            {' '}· New posts weekly on systematic macro research.
          </p>
        </footer>
      </div>
    </div>
  )
}
