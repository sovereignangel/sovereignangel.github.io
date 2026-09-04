import { redirect } from 'next/navigation'

/** The app opens on the sheet in play; an overview lands here later. */
export default function FinancePage() {
  redirect('/finance/taxes')
}
