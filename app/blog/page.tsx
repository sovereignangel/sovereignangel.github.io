import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Writing — Lori Corpuz',
  description: 'Essays on markets, systematic investing, and building in public.',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[640px] mx-auto py-20 px-6 max-[480px]:py-12 max-[480px]:px-5">
        {/* Header */}
        <header className="mb-12">
          <Link href="/" className="text-[13px] text-[#999] hover:text-[#1a1a1a] transition-colors no-underline">
            ← Lori Corpuz
          </Link>
          <h1 className="text-[28px] font-semibold tracking-tight mt-4 mb-2">
            Writing
          </h1>
          <p className="text-[#666] text-[15px]">
            Markets, systematic investing, and building in public.
          </p>
        </header>

        {/* Posts */}
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/blog/${post.slug}`} className="no-underline block">
                <div className="flex items-baseline gap-3 mb-1">
                  <time className="text-[13px] text-[#999] shrink-0 tabular-nums">
                    {formatDate(post.date)}
                  </time>
                  <span className="text-[11px] text-[#bbb]">{post.readTime}</span>
                </div>
                <h2 className="text-[19px] font-medium text-[#1a1a1a] tracking-tight group-hover:text-[#555] transition-colors mb-1">
                  {post.title}
                </h2>
                <p className="text-[15px] text-[#888] leading-relaxed">
                  {post.subtitle}
                </p>
                <div className="flex gap-2 mt-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[11px] text-[#aaa] border border-[#e5e5e5] rounded-sm px-1.5 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* Footer */}
        <footer className="pt-12 mt-12 border-t border-[#eee]">
          <p className="text-[13px] text-[#999]">
            New posts weekly — systematic macro research and engineering.
          </p>
        </footer>
      </div>
    </div>
  )
}
