---
name: venture-iterate
description: Modify an existing deployed venture — add features, change design, fix bugs
invocation: user
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Venture Iterate — Modify a Deployed Venture

Apply changes to an existing deployed venture codebase.

## Step 1: Identify the Venture

Ask the user which venture to iterate on (by name or project slug).

```bash
# Clone the repo to work on it
gh repo clone sovereignangel/<project-name> /tmp/venture-iterate/<project-name> 2>/dev/null
cd /tmp/venture-iterate/<project-name>
```

If the repo doesn't exist locally, clone it. If it does, pull latest.

## Step 2: Understand the Changes

The user will describe what they want changed. Common requests:
- Add a feature
- Change the design/brand
- Fix a bug
- Add an integration (Stripe, auth, etc.)
- Improve mobile responsiveness

## Step 3: Read Existing Code

Before making changes, read the existing codebase to understand:
- Project structure
- Current styling approach
- State management patterns
- API routes and data flow

Read the key files: `package.json`, `app/layout.tsx`, `app/page.tsx`, and any files related to the requested changes.

## Step 4: Apply Composable Skills

If the user requests a design change or integration, check for relevant skills:
- `.claude/skills/brand-armstrong.md` — Apply Armstrong aesthetic
- `.claude/skills/brand-dark-saas.md` — Apply dark SaaS theme
- `.claude/skills/integration-stripe.md` — Add Stripe payments
- `.claude/skills/integration-auth.md` — Add authentication
- `.claude/skills/integration-supabase.md` — Add Supabase database

Read and follow the instructions in the relevant skill files.

## Step 5: Make Changes

Edit the existing files directly. For new features, create new files.

### Rules:
- **Maintain consistency** with existing code style
- **Don't break existing features** — test mentally that the app still works
- **Complete implementations only** — no TODOs or placeholders
- **If adding dependencies**, update `package.json`

## Step 6: Commit & Push

```bash
cd /tmp/venture-iterate/<project-name>
git add -A
git commit -m "iterate: <description of changes>"
git push origin main
```

## Step 7: Update Venture Status

Record the iteration in the venture document:
- Append to `iterations` array: `{ request: '<changes>', completedAt: new Date() }`
- Update `build.filesGenerated` with new count
- Update `updatedAt`

## Step 8: Report

Show:
- Changes made (files modified/created)
- Repo URL
- Live URL (Vercel will auto-deploy from the push)
- "Changes will be live in ~60 seconds after Vercel redeploys"
