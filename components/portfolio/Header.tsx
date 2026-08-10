import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="mb-12 relative">
      <Link
        href="/wind"
        aria-label="Kite wind forecast"
        title="Wind — kite forecast for the Lithuanian coast"
        className="absolute top-0 right-0 text-[#c4c4c4] hover:text-[#1a8a8f] transition-colors duration-200"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9.5 Q12 2 20 9.5 Q12 6.5 4 9.5 Z" fill="currentColor" stroke="none" />
          <path d="M5.5 9.5 L11 20" />
          <path d="M18.5 9.5 L13 20" />
          <path d="M10 20.5 L14 20.5" />
        </svg>
      </Link>
      <Image
        src="/Main.jpeg"
        alt="Lori Corpuz"
        width={120}
        height={120}
        className="rounded-full object-cover object-[80%_center] mb-6 grayscale-[10%]"
        priority
      />
      <h1 className="text-[28px] font-semibold tracking-tight mb-2">
        Lori Corpuz
      </h1>
      <p className="text-[#666] text-[15px] tracking-wide">
        AI · Markets · Mind
      </p>
    </header>
  )
}
