import { redirect } from 'next/navigation'

// Dynamic so the redirect is a real Location header, not a prerendered page
// that waits for client JS to bounce.
export const dynamic = 'force-dynamic'

/** /book is the natural thing to type; the shelf lives at /books. */
export default function BookRedirect() {
  redirect('/books')
}
