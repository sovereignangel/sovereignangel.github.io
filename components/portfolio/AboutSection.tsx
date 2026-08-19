import Link from 'next/link'

export default function AboutSection() {
  return (
    <section className="bg-[#faf8f4]/30 backdrop-blur-sm rounded-sm p-5 -mx-5 font-serif">
      <p className="text-[19px] font-medium text-[#1a1a1a] tracking-tight mb-4">
        Quantamental research and AI infrastructure.
      </p>
      <p className="text-[#333] mb-4">
        Built a portfolio management product from scratch that drove a $16.4B revenue line at JP Morgan Asset Management. Raised $220M+ across early-stage companies, venture funds, and investment banks.
      </p>
      <p className="text-[#333] mb-4">
        Complexity economics and deep reinforcement learning are the frameworks I bring to markets.
      </p>
      <p className="text-[#333] mb-4">
        I practice Mahamudra & Kadampa Buddhism.
      </p>
      <div className="flex items-center gap-5 text-[#333]" aria-label="Sports">
        <Link
          href="/ironman"
          aria-label="Ironman training plan — swim, bike, run"
          title="Ironman build — adaptive training plan"
          className="group relative flex items-center gap-5 border border-[#33333355] rounded-sm px-3 py-2 mt-1 text-[#333] hover:text-[#7c2d2d] hover:border-[#7c2d2d] transition-colors duration-200"
        >
          <span className="absolute -top-[7px] left-2.5 px-1 bg-[#faf8f4] font-serif text-[9px] uppercase tracking-[1.5px] leading-none text-[#333] group-hover:text-[#7c2d2d] transition-colors duration-200">
            Ironman
          </span>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="15" cy="3.5" r="1.5" />
            <path d="M14.5 5L13 11" />
            <path d="M14 6.5L17.5 8L16 5" />
            <path d="M13.5 7L10 10L11.5 12.5" />
            <path d="M13 11L16.5 13L14.5 17.5" />
            <path d="M13 11L9.5 14L6.5 12" />
            <path d="M14.5 17.5L17 20" />
          </svg>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="5.5" cy="16.5" r="4" />
            <circle cx="18.5" cy="16.5" r="4" />
            <path d="M5.5 16.5l4-7h5l4 7" />
            <path d="M9.5 9.5h2.5" />
            <path d="M14.5 9.5l-2 7" />
            <circle cx="16" cy="5.5" r="1.2" />
          </svg>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="17" cy="6.5" r="1.3" />
            <path d="M3 11c1.5 0 2-1 3.5-1S8 11 9.5 11s2-1 3.5-1l3.5-2 3.5 2" />
            <path d="M3 15c1.5 0 2-1 3.5-1s2 1 3.5 1 2-1 3.5-1 2 1 3.5 1 2-1 3.5-1" />
            <path d="M3 19c1.5 0 2-1 3.5-1s2 1 3.5 1 2-1 3.5-1 2 1 3.5 1 2-1 3.5-1" />
          </svg>
        </Link>
        <Link
          href="/wind"
          aria-label="Kiteboarding — wind forecast"
          title="Wind — kite forecast for the Lithuanian coast"
          className="text-[#333] hover:text-[#1a8a8f] transition-colors duration-200"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 7 Q 12 1.5, 21 7" />
            <path d="M3 7 Q 12 5.5, 21 7" />
            <path d="M3.5 7.5 L 11 14.5" />
            <path d="M20.5 7.5 L 13 14.5" />
            <path d="M10.5 14.5 L 13.5 14.5" />
            <circle cx="12" cy="16.5" r="1.1" />
            <path d="M12 17.5 L 12 20" />
            <path d="M11 14.5 L 12 17.2" />
            <path d="M13 14.5 L 12 17.2" />
            <ellipse cx="12" cy="20.8" rx="4.5" ry="0.7" />
            <path d="M2.5 22.8 q 2.5 -1 5 0 t 5 0 t 5 0 t 5 0" />
          </svg>
        </Link>
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Skiing"
          role="img"
        >
          <circle cx="15" cy="4.5" r="1.4" />
          <path d="M13.5 8l-2 3 3 2-1 4" />
          <path d="M14.5 13l3 1" />
          <path d="M11.5 11L9 9" />
          <path d="M3 20l10-3" />
          <path d="M9 21l11-4" />
        </svg>
      </div>
    </section>
  )
}
