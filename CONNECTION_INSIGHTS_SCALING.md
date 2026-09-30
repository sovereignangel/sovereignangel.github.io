# Connection Insights — hosting for friends

Live at `www.loricorpuz.com/connectioninsights`. Open Google sign-in; each
account gets a private dashboard for ONE connection (two people).

## How it works now

- **Auth:** Firebase Auth (thesis-engine-95cd5), any Google account. The page
  signs in on its own and never touches the Thesis profile/allowlist.
- **Data:** `connection_insights/{uid}` (settings) + subcollections
  `conversations | themes | values | snapshots`; `ci_wave_hooks/{hookId}` → uid.
  No client rule exists for these, so Firestore default-denies browser access;
  only API routes (firebase-admin) read/write them.
- **Ingest:** paste a transcript, or connect Wave: the user pastes a Wave API
  token (sessions:read, transcripts:read, webhooks:manage); the server
  validates it and registers a webhook on *their* Wave account pointing at
  `/api/connectioninsights/wave/hook/{hookId}`. Sessions whose title contains
  their keyword (default "connection") auto-ingest; "Import from Wave" lists
  recent sessions for manual pick.
- **LLM:** your `lib/llm.ts` keys (Groq primary, Gemini fallback) — you pay.

## What is needed to scale to 5 people

Honest read: 5 users fits the current stack. Nothing has to be re-platformed.
The gaps are cost, secrets and trust, not capacity.

| Area | Today | Needed for 5 | Effort |
|------|-------|--------------|--------|
| Compute | Vercel serverless, 120s max per extraction | Fine. ~5 users × a few sessions/week is trivial | none |
| Database | Firestore free tier | Fine (well under 50k reads/day). Set a GCP budget alert on the project | 5 min |
| LLM cost | Your Groq/Gemini keys, no limits | Per-user quota (e.g. 20 extractions/month) counted on `connection_insights/{uid}`; a usage line in your Telegram brief. Groq free tier rate-limits are the first thing to break if two people import a backlog at once — Gemini fallback covers it, but watch it | 1–2 hrs |
| Access control | Anyone with Google can sign up | Invite list: `allowedEmails` doc checked in `requireUser`, or leave open and rely on the quota | 30 min |
| Secrets | Wave tokens stored plaintext in Firestore (server-only) | Encrypt at rest with a `CI_ENCRYPTION_KEY` (AES-GCM) before storing | 1 hr |
| Wave webhook | Signature verification is permissive (hookId is the gate; transcript is re-fetched with the owner's token) | Confirm Wave's HMAC format against a real delivery, then enforce | 30 min once a payload is captured |
| Privacy/trust | Friends' relationship transcripts sit in *your* Firebase project, readable by you | Say this plainly on sign-in, add "Delete my data" (wipe `connection_insights/{uid}` + Wave webhook), and a JSON export. For people who want zero trust in you: the open-source repo self-host path | 2 hrs |
| Multiple connections | One pair per account | Nest under `connection_insights/{uid}/connections/{connectionId}/…`, names per connection, a switcher; Wave keyword per connection routes sessions | ½–1 day |
| Isolation from Thesis | Shares the thesis-engine Firebase project | Fine at 5. Past ~20, or if anyone outside close friends joins, move to its own Firebase project (separate billing, auth list, blast radius) | ½ day |
| Ops | Vercel function logs only | Error ping to your Telegram inbox (`lib/inbox/client.ts`) when an extraction fails | 30 min |

**Minimum set before inviting 5:** quota + budget alert, delete-my-data,
token encryption, and the privacy line on sign-in. Everything else can wait.
