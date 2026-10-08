import { redirect } from 'next/navigation'

/** /book is the natural thing to type; the shelf lives at /books. */
export default function BookRedirect() {
  redirect('/books')
}
