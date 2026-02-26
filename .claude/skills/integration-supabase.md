---
name: integration-supabase
description: Add Supabase PostgreSQL database with typed client, RLS, and real-time subscriptions
invocation: user
---

# Supabase Integration

Add Supabase as the database layer — PostgreSQL with real-time, auth, and RLS.

## Dependencies

```json
{ "@supabase/supabase-js": "^2.45.0", "@supabase/ssr": "^0.5.0" }
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Files to Generate

### `lib/supabase/client.ts` — Browser client
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `lib/supabase/server.ts` — Server client
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )
}
```

### `lib/supabase/types.ts` — Database types
Generate TypeScript types matching the schema. Include as comments:

```sql
-- Schema (run in Supabase SQL editor)
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  -- ... project-specific columns
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own data
CREATE POLICY "Users own their items" ON items
  FOR ALL USING (user_id = auth.uid()::text);
```

## Patterns

- Use server client in API routes and Server Components
- Use browser client in Client Components
- Always enable RLS on tables
- Include the SQL schema as comments for easy setup
- For real-time: `supabase.channel('changes').on('postgres_changes', ...)`
