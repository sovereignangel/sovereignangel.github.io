/**
 * No SiteFooter here, deliberately: the board is a fixed-height screen and a
 * footer beneath it would be the one thing forcing the page to scroll.
 */
export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
