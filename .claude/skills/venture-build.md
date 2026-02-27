---
name: venture-build
description: Generate a complete codebase from a venture PRD, create GitHub repo, push code, and deploy
invocation: user
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Venture Build — Generate, Push & Deploy

Generate a complete, working application from a venture's PRD, push it to GitHub, and deploy it.

## Prerequisites

The venture must have a PRD (stage: `prd_draft`). If not, tell the user to run `/venture-spec` first.

## Step 1: Load the Venture

Ask the user which venture to build (by name or number), then read the spec and PRD.

If the venture data is provided inline, use that. Otherwise check Firestore.

Read these files for project patterns:
- `lib/types/venture.ts` — Type definitions
- `CLAUDE.md` — Armstrong brand system and project patterns

## Step 2: Check for Composable Skills

Ask the user if they want to apply any skills. Available skills are in `.claude/skills/`:
- `brand-armstrong.md` — Armstrong burgundy/cream editorial aesthetic
- `brand-dark-saas.md` — Dark mode SaaS
- `integration-stripe.md` — Stripe payments
- `integration-auth.md` — Authentication (Clerk or NextAuth)
- `integration-supabase.md` — Supabase database
- `pattern-landing.md` — SaaS landing page sections
- `pattern-dashboard.md` — App dashboard layout

Read the relevant skill files and incorporate their instructions into the build.

## Step 3: Generate the Codebase

Create a new directory for the venture project and generate ALL files needed:

```bash
# Create project directory (temporary, for organizing files before push)
mkdir -p /tmp/venture-build/<project-name>
cd /tmp/venture-build/<project-name>
```

### Required Files (always generate):
1. `package.json` — Dependencies matching the tech stack
2. `tsconfig.json` — TypeScript strict config
3. `next.config.js` — Next.js configuration
4. `tailwind.config.ts` — Tailwind with custom theme
5. `postcss.config.js` — PostCSS config
6. `app/layout.tsx` — Root layout with fonts and metadata
7. `app/page.tsx` — Main page
8. `README.md` — One-line setup: `npm install && npm run dev`

### Feature Files:
Generate components, API routes, and utilities for every P0 feature in the PRD.
P1 features should be included if time permits.

### Critical Rules:
- **Complete code only** — no TODOs, no placeholders, no "implement later"
- **TypeScript strict** — no `any` types
- **Responsive** — works on mobile and desktop
- **Working on first run** — `npm install && npm run dev` must work
- **Environment variables** — use `.env.example` to document required vars
- For external APIs that need keys, include graceful fallbacks/mock data

## Step 4: Create GitHub Repo & Push

```bash
# Create the repo
gh repo create sovereignangel/<project-name> --public --description "<one-liner>" --clone 2>/dev/null || true

# If repo exists, clone it
cd /tmp/venture-build
gh repo clone sovereignangel/<project-name> 2>/dev/null || true
cd <project-name>

# Copy generated files
# (files were written directly to this directory)

# Commit and push
git add -A
git commit -m "feat: initial build — <venture-name>"
git push -u origin main
```

## Step 5: Deploy

### Option A: Vercel (preferred)
```bash
# If vercel CLI available
vercel --yes --prod 2>/dev/null

# Or link via Vercel dashboard — just push to GitHub and Vercel auto-deploys
# if the repo is connected
```

### Option B: Manual deploy note
Tell the user:
1. Go to vercel.com → New Project → Import `sovereignangel/<project-name>`
2. Deploy with defaults
3. Add custom domain: `<project-name>.loricorpuz.com`

### Cloudflare DNS (if credentials available)
```bash
# Add CNAME record for subdomain
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"<project-name>","content":"cname.vercel-dns.com","proxied":false}'
```

## Step 6: Update Venture Status

After successful deployment, update the venture document in Firestore:
- `stage: 'deployed'`
- `build.status: 'live'`
- `build.repoUrl: 'https://github.com/sovereignangel/<project-name>'`
- `build.previewUrl: '<deployed-url>'`
- `build.customDomain: '<project-name>.loricorpuz.com'`
- `build.repoName: '<project-name>'`
- `build.filesGenerated: <count>`
- `build.completedAt: new Date()`

Also log the ship to today's daily_log for reward computation.

## Step 7: Report to User

Show:
- Repo URL
- Live URL (or preview URL)
- Number of files generated
- Features built (P0/P1)
- Next steps: "Use `/venture-iterate` to modify, `/venture-memo` for investment memo"
