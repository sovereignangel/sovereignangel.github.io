import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'

export const metadata: Metadata = {
  title: 'Read',
  description: 'Your personal reading library',
  robots: 'noindex, nofollow',
}

export default function ReadLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-cream">
        {children}
      </div>
    </AuthProvider>
  )
}
