export default function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`py-6 text-center text-[11px] tracking-wide text-[#8a8a8a] ${className}`}>
      © 2026 Loribel Corpuz. All rights reserved.
    </footer>
  )
}
