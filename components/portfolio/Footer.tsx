export default function Footer() {
  const links = [
    { label: 'Twitter', href: 'https://x.com/LoriCorpuz', context: 'markets + mind' },
    { label: 'GitHub', href: 'https://github.com/sovereignangel', context: 'building in public' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/loricorpuz', context: 'professional background' },
    { label: 'Email', href: 'mailto:loricorpuz@gmail.com', context: 'say hello' },
  ]

  return (
    <footer className="pt-8">
      <div className="text-sm text-[#888] mb-4">Williamsburg</div>
      <div className="flex gap-6 flex-wrap">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm no-underline transition-colors duration-200 group"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="text-[#1a1a1a] border-b border-[#ddd] group-hover:border-[#1a1a1a]">
              {link.label}
            </span>
            <span className="block text-[11px] text-[#999] mt-0.5">{link.context}</span>
          </a>
        ))}
      </div>
    </footer>
  )
}
