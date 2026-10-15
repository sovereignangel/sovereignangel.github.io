// The reading sheets render the site footer themselves; the Models dashboard
// is sized to the window and carries none, so the layout adds nothing.
export default function ComplexeconLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
