---
name: integration-auth
description: Add authentication with Clerk or NextAuth — social login, user management, protected routes
invocation: user
---

# Authentication Integration

Add auth to the venture. Default to Clerk (simpler). Use NextAuth if the user prefers.

## Option A: Clerk (recommended for speed)

### Dependencies
```json
{ "@clerk/nextjs": "^6.0.0" }
```

### Environment Variables
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Files to Generate

**`app/layout.tsx`** — Wrap in `<ClerkProvider>`
**`middleware.ts`** — Protect routes with `clerkMiddleware()`
**`app/sign-in/[[...sign-in]]/page.tsx`** — `<SignIn />`
**`app/sign-up/[[...sign-up]]/page.tsx`** — `<SignUp />`

### Usage in Components
```typescript
// Client components
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
const { user, isLoaded } = useUser()

// Server components
import { auth } from '@clerk/nextjs/server'
const { userId } = await auth()
```

## Option B: NextAuth (if user prefers)

### Dependencies
```json
{ "next-auth": "^5.0.0" }
```

### Setup
- `auth.ts` — Configure providers (Google, GitHub)
- `app/api/auth/[...nextauth]/route.ts` — API handler
- `middleware.ts` — Route protection

## Protected Route Pattern

```typescript
// In page.tsx (Server Component)
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  // ... render page
}
```
