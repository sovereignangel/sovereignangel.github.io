export default function Footer() {
  const links = [
    { label: 'Twitter', href: 'https://x.com/LoriCorpuz' },
    { label: 'GitHub', href: 'https://github.com/sovereignangel' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/loricorpuz' },
    { label: 'Email', href: 'mailto:loricorpuz@gmail.com' },
  ]

  return (
    <footer className="pt-8 border-t border-[#eee]">
      <div className="text-sm text-[#888] mb-4">Williamsburg</div>
      <div className="flex gap-6 flex-wrap">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm text-[#1a1a1a] no-underline border-b border-[#ddd] hover:border-[#1a1a1a] transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  )
}
