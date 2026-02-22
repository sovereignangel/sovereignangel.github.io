'use client'

interface GuidebookSection {
  heading: string
  content: string
}

interface GuidebookModalProps {
  title: string
  sections: GuidebookSection[]
  onClose: () => void
}

export default function GuidebookModal({ title, sections, onClose }: GuidebookModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-paper border border-rule rounded-sm shadow-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-paper border-b-2 border-rule px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-[15px] font-bold text-ink tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors px-2 py-1"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-5">
          {sections.map((section, i) => (
            <div key={i}>
              <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b border-rule-light">
                {section.heading}
              </h3>
              <div className="font-sans text-[11px] text-ink leading-relaxed whitespace-pre-line">
                {renderContent(section.content)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function renderContent(content: string) {
  // Simple markdown-like rendering for bold and code
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="font-mono text-[10px] bg-cream px-1 py-0.5 rounded-sm">{part.slice(1, -1)}</code>
    }
    return <span key={i}>{part}</span>
  })
}
