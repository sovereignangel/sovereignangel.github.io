import type { WikiSurface } from '@/lib/types/wiki'

export interface SeedWiki {
  slug: string
  title: string
  surface: WikiSurface
  contentMd: string
}

export const TECH_DEV_SEED_WIKIS: SeedWiki[] = [
  {
    slug: 'tech-development/inbox-router-phase1-2026-05-14',
    title: 'Inbox Router — Phase 1 (2026-05-14): Architectural Primer',
    surface: 'tech-development',
    contentMd: `> **Status.** Shipped 2026-05-14. Phase 1 of the [[telegram-alfred-roadmap]] (outbound + sender migration). Predecessor in this series: none. Successor: [[tech-development/inbound-router-phase2]] (forward reference — not yet written).

> **TL;DR.** A single endpoint, \`POST /api/inbox\`, now sits between every Telegram-emitting workflow across the institutional surface (Armstrong, Alamo Bernal, Thesis Engine, Lordas) and the single Telegram bot. It enforces source attribution, severity classification, deduplication, payload validation, and structured observability. Eighteen ad-hoc senders across three codebases collapse to one routed surface with a single rotation point for the bot credential.

---

## 1. Executive Summary

A research-and-execution operation that runs across multiple repositories cannot afford undisciplined channels. When one human (the principal) is also the recipient of every system signal, every uncategorized notification is a tax on attention. When a credential leaks, every uncentralized sender is a separate rotation event. When a process fails silently, every uninstrumented send is a forensic gap.

Phase 1 of the Alfred telegram-router buildout addresses all three problems simultaneously by collapsing the outbound surface to a single routed endpoint hosted in the [[thesis-engine-architecture]] Next.js app on \`loricorpuz.com\`. Every project — \`armstrong\`, \`alamo-bernal\`, \`thesis\`, \`lordas\` — now emits notifications by POSTing a typed payload to that endpoint, authenticated by a shared secret (\`INBOX_SHARED_SECRET\`). The endpoint formats, deduplicates, optionally bundles, and dispatches via Telegram. Future inbound routing (Phase 2), wiki self-update (Phase 3), and the [[alfred-harness]] (Phase 4) all layer on top of this contract.

This memo is the primary artifact of the buildout. It documents what was built, why, and how — in enough detail that a successor engineer can audit, extend, or refactor without rediscovery.

## 2. The Problem Space

### 2.1 Three-layer mental model (per Andrej Karpathy)

The buildout follows a three-layer cognitive architecture:

1. **Layer 1 — Full dump.** The raw stream of every observation, action, signal: Telegram messages, Wave AI session transcripts, journal entries, alpha-engine runs, capacity test outputs, fundamental-research notes. High volume, low structure.
2. **Layer 2 — Wikis.** Distilled, structured, self-updating knowledge pages. Contact pages, ticker theses, project status. The wiki you are reading is itself a Layer 2 artifact. Stored in [[wikis-collection-schema]].
3. **Layer 3 — Instructions.** \`CLAUDE.md\`, \`MEMORY.md\`, \`AGENTS.md\` across every codebase. The system prompts that govern automated work.

A fourth tier — the **harness** — is the agent that reads Layer 1, distills it into Layer 2, and operates under Layer 3. It is the subject of [[tech-development/phase4-alfred-harness]].

Phase 1 ships the messaging substrate that makes Layer 1 routable.

### 2.2 Inventory at start of work (2026-05-13)

| Project | Outbound senders | Helper module | Inbound | Credential |
|---|---|---|---|---|
| DeepOps (\`armstrong\`) | 4 (3 bash + 1 python, copy-pasted) | none | none | \`TELEGRAM_BOT_TOKEN\` env |
| AlamoBernal | 2 (Vercel cron) | own \`lib/alamo-bernal/telegram.ts\` | none | own \`TELEGRAM_BOT_TOKEN\` env |
| Website (\`thesis\` + \`lordas\`) | 12 internal + full webhook | \`lib/telegram.ts\` (bypassed in 2 spots) | 3192-line webhook handler | \`TELEGRAM_BOT_TOKEN\` env |
| macro-signals | 0 | — | — | — |

Eighteen total outbound call sites. Three independent rotation points for one bot credential. Two raw \`fetch()\` calls bypassed the helper module entirely. One sender was silently dead (\`TELEGRAM_CHAT_ID\` env never set). Three identical copies of \`send_telegram()\` lived in three bash scripts in DeepOps. The principal lost track of which project emitted which alert because outbound messages contained no source attribution.

### 2.3 Design constraints (locked across all phases)

- **Single human recipient, single bot.** Chat \`489068882\`, bot \`8510659406:AAF...\`. No forum topics, no per-user routing.
- **No LLM auto-classification on routing decisions.** The principal explicitly declined LLM-based inbound classification. Inbound prefix-or-ask (Phase 2) uses an explicit slash command or inline-keyboard prompt.
- **Always source-tagged.** Every outbound message leads with \`[Armstrong]\`, \`[Alamo Bernal]\`, \`[Thesis]\`, or \`[Lordas]\`. Non-negotiable per persistent memory \`feedback_telegram_alerts_identify_project\`.
- **Single bot-token rotation point.** The token lives in the Website codebase env only. DeepOps and AlamoBernal hold only the inbox shared secret.
- **No fake data, ever.** Per CLAUDE.md no-fake-data policy. Synthetic test values are clearly marked.
- **No auto-deletes.** Per CLAUDE.md no-data-deletion policy.
- **launchd, not cron**, on the local Mac for any scheduled job.

## 3. The Architectural Decision

### 3.1 Where the router lives

The router lives in the Website repository (\`/Users/loricorpuz/Website\`, deployed to \`loricorpuz.com\`). The decision is forced by three facts:

1. Website already owns the Telegram inbound webhook (3192 lines, HMAC-verified). It already imports \`firebase-admin\`, holds the bot token, and stores \`UserSettings.telegramChatId\` in Firestore.
2. Both other codebases (DeepOps Python+React, AlamoBernal Next.js+Supabase) need a *recipient* of their outbound calls. That recipient can be either of the three codebases. Putting it in Website minimizes net-new infrastructure.
3. Phase 2 layers the inbound router on the same codebase. Co-locating outbound + inbound simplifies the shared-state surface (chat ID, parse mode, dedupe table).

The router itself is a Next.js Route Handler at \`app/api/inbox/route.ts\` plus a pure-function library at \`lib/inbox/\`. Pure functions are testable in isolation; the route handler is a thin adapter.

### 3.2 The contract

\`\`\`ts
POST /api/inbox
Headers:
  Content-Type: application/json
  x-inbox-secret: <INBOX_SHARED_SECRET>

Body:
  source: "armstrong" | "alamo-bernal" | "thesis" | "lordas"
  kind:   "alert" | "signal" | "info" | "digest_item"
  severity: "critical" | "warn" | "info"
  title:  string                  // ≤ 1024 chars, non-empty, leads the outbound message
  body?:  string                  // ≤ 16384 chars, Markdown OK, chunked if > 4096
  link?:  string                  // ≤ 2048 chars, deeplink to source artifact
  dedupe_key?: string             // ≤ 256 chars, collapses repeats within TTL window

Response (200):
  { ok: true, message_id?: number, deduped?: boolean, digested?: boolean }

Response (400):
  { ok: false, error: <validation message> }

Response (401):
  { ok: false, error: "unauthorized" }

Response (500):
  { ok: false, error: <reason> }
\`\`\`

The router is **strict-mode**: unknown fields are rejected with 400, with the list of allowed fields in the error. Typos like \`boady\` fail loudly instead of producing a body-less message.

### 3.3 Why this contract

Each field is load-bearing:

- **\`source\`** drives the prefix tag (\`[Armstrong]\`) and the dedupe namespace (\`<source>:<dedupe_key>\`). The four-value enum mirrors the project taxonomy and is locked across the [[telegram-alfred-roadmap]].
- **\`kind\`** is forward-looking: \`alert\` vs \`signal\` vs \`info\` lets Phase 1.5 add per-kind routing rules (e.g., \`signal\` items might bundle into a daily digest, \`alert\` never bundles).
- **\`severity\`** drives the visual badge (\`🔴\` critical, \`🟡\` warn, no badge info) and the digest eligibility (\`critical\` always immediate).
- **\`title\`** is the one-line summary. It always renders at the top of the outbound message. Cap (1024 chars) is generous but bounded.
- **\`body\`** is the optional detail. Cap (16384 chars) corresponds to roughly four Telegram messages after chunking. Larger payloads should link to a wiki entry instead of inlining.
- **\`link\`** is the deeplink back. Renders as a bare URL beneath the body; Telegram auto-linkifies.
- **\`dedupe_key\`** is opaque. Callers choose it. The router collapses repeats within a 5-minute TTL window. Senders without a dedupe_key fire every invocation.

### 3.4 What the router does *not* do

- **No payload modification beyond prefix + severity badge + chunking.** Markdown passes through to Telegram unchanged.
- **No retries.** Telegram failures bubble up; callers handle. (Phase 1.5 may add a Firestore-backed retry queue.)
- **No per-user routing.** Single human, single chat. The chat ID comes from \`TELEGRAM_CHAT_ID\` env, not from the caller.
- **No HTML or MarkdownV2 escaping.** Senders are trusted to produce safe Markdown.
- **No cross-project bot tokens.** Token lives in Website only.

## 4. System Architecture

\`\`\`
┌─────────────────────────────┐    POST /api/inbox          ┌─────────────────────────────────────┐
│  DeepOps (Armstrong)        │   ─────────────────────►    │  Website  ─  loricorpuz.com         │
│  - core/notify.py           │   x-inbox-secret: …         │                                     │
│  - scripts/lib/notify.sh    │                             │  app/api/inbox/route.ts             │
└─────────────────────────────┘                             │     ▼                               │
                                                            │  lib/inbox/router.ts                │
┌─────────────────────────────┐    POST /api/inbox          │     ▼                               │
│  AlamoBernal                │   ─────────────────────►    │  validatePayload (strict mode)      │
│  - lib/alamo-bernal/        │   x-inbox-secret: …         │     ▼                               │
│    telegram.ts (replaced)   │                             │  checkAndRecord (dedupe TTL)        │
└─────────────────────────────┘                             │     ▼                               │
                                                            │  shouldBundle (digest, off by dflt) │
┌─────────────────────────────┐    direct function call     │     ▼                               │
│  Website internal callers   │   sendToInbox({…})          │  composeMessage + chunkMessage      │
│  (10 migrated sites)        │   ─────────────────────►    │     ▼                               │
└─────────────────────────────┘                             │  sendTelegramMessage (lib/telegram) │
                                                            │     ▼                               │
                                                            │  Telegram Bot API  →  Chat 489068882│
                                                            └─────────────────────────────────────┘
\`\`\`

### 4.1 In-process vs HTTP

Two access patterns:

- **External codebases (DeepOps, AlamoBernal)** POST to \`/api/inbox\` over HTTPS with the shared-secret header.
- **In-process Website callers** import \`sendToInbox\` from \`lib/inbox/client.ts\` and invoke the same \`routeMessage\` function directly — no HTTP round trip, identical formatting, identical dedupe state.

This avoids the Vercel-serverless cold-start tax for sends originating inside Website itself, while keeping a single source of truth for the routing logic. The external HTTP path adds only authentication and validation around the same core function.

### 4.2 File layout

\`\`\`
app/api/inbox/route.ts          Route Handler. Auth, JSON parse, validate, route.
lib/inbox/types.ts              Source/kind/severity unions, payload + result types.
lib/inbox/dedupe.ts             In-memory Map<string,number> with TTL + sweep.
lib/inbox/digest.ts             Bundle decision (flag-gated OFF by default).
lib/inbox/router.ts             Pure routing logic — compose, chunk, log, send.
lib/inbox/client.ts             In-process sendToInbox() — re-exports router.
\`\`\`

Pure modules have no side effects beyond their declared inputs/outputs and are unit-testable. The route handler is a 50-line adapter that handles HTTP-specific concerns (auth, JSON, status codes).

## 5. Data Architecture

### 5.1 Dedupe store

The dedupe layer is an in-memory \`Map<string, number>\` where keys are \`<source>:<dedupe_key>\` and values are expiration timestamps (\`Date.now() + 5 minutes\`).

**Properties.**
- Per-instance state. Two Vercel Lambda instances handling the same key in parallel would each fire — a documented limitation (see §10.1).
- O(1) check-and-set per call. Sweep at \`size > 1000\` entries; otherwise expired keys are overwritten in place.
- 5-minute default TTL. Tuned for the principal's empirical cadence: cron jobs fire on minute boundaries; user actions may trigger duplicate routes.

**Key examples in production.**
- \`thesis:morning-brief:2026-05-14\`
- \`thesis:overnight-synthesis:2026-05-14\`
- \`thesis:build-watchdog:<ventureId>\`
- \`thesis:review-correction:<reviewId>\`
- \`thesis:weekly-calibration:2026-05-12\`
- \`thesis:claude-build:<ventureId>:live\` and \`...:failed\`
- \`lordas:wave-reprocess:<sessionId>\`

### 5.2 Telegram message

After dedupe and digest decisions, the router composes the outbound text:

\`\`\`
{severityBadge} {sourcePrefix} {title}

{body}

{link}
\`\`\`

If the total exceeds 4096 characters (Telegram's per-message hard cap), the router chunks at line boundaries when possible, appending \`(N/M)\` markers. Each chunk fires a separate \`sendMessage\` API call. The returned \`message_id\` is the *last* chunk's ID — callers that need the first chunk (for threaded replies) currently cannot resolve it.

### 5.3 Audit trail

Every routing decision emits a single JSON line to \`stdout\` (captured by Vercel's log stream):

\`\`\`json
{
  "at": "2026-05-14T05:02:03.006Z",
  "component": "inbox-router",
  "source": "thesis",
  "kind": "info",
  "severity": "info",
  "has_dedupe": false,
  "decision": "sent",          // sent | deduped | digested | send_failed | send_partial | misconfigured
  "total_chunks": 1,
  "message_id": 748,
  "ms": 524
}
\`\`\`

No payload content (title, body) is logged — only metadata. This preserves the audit trail without exfiltrating sensitive content. For future hedge-fund-grade observability, this stream can be drained to a Firestore \`router_invocations\` collection or a LogDrain.

## 6. Process Architecture

### 6.1 Validation pipeline

\`\`\`
HTTP POST
  ▼
secretMatches(provided, expected)        constant-time compare; reject 401 on miss
  ▼
req.json()                                catch parse error; reject 400 on invalid JSON
  ▼
validatePayload(body)                     strict-mode: unknown fields → 400
                                          enum checks (source, kind, severity)
                                          string-type + size caps (title, body, link, dedupe_key)
  ▼
routeMessage(validated)
  ▼
[ env TELEGRAM_CHAT_ID set? ]             missing → log misconfigured, return 500
  ▼
[ dedupe_key set && already seen? ]       hit → log deduped, return { deduped: true }
  ▼
[ shouldBundle (digest enabled & severity ≠ critical)? ]  digest-eligible → log digested, enqueue
  ▼
composeMessage + chunkMessage
  ▼
forEach chunk: sendTelegramMessage         track sent count + last id
  ▼
[ sentChunks === 0 ? ]                    full failure → log send_failed, return 500
[ sentChunks < total ? ]                  partial → log send_partial, return 200 with last id
[ all sent ? ]                            log sent, return 200 with last id
\`\`\`

### 6.2 Single-recipient simplification

The migrated call sites previously iterated Firestore users to find those with \`telegramChatId\` configured, then sent per-user. The router uses a single env-based chat ID. For the current single-principal setup, this is functionally equivalent. For future multi-user expansion, the call sites' iteration logic still gates *generation* (only generate the morning brief for users with Telegram enabled), but *delivery* is centralized.

### 6.3 Phase-1 sender migration

| Call site | Source | Kind | Severity | Dedupe key |
|---|---|---|---|---|
| \`weekly-calibration/generate\` (GET + POST) | thesis | info | info | \`weekly-calibration:<weekStart>\` |
| \`admin/reprocess-wave\` | **lordas** | info | info | \`wave-reprocess:<sessionId>\` |
| \`morning-brief/generate\` (GET + POST) | thesis | info | info | \`morning-brief:<date>\` |
| \`ventures/build/callback\` LIVE | thesis | info | info | \`venture-callback:<ventureId>:live\` |
| \`ventures/build/callback\` FAILED | thesis | alert | warn | \`venture-callback:<ventureId>:failed\` |
| \`ventures/claude-build\` LIVE | thesis | info | info | \`claude-build:<ventureId>:live\` |
| \`ventures/claude-build\` FAILED | thesis | alert | warn | \`claude-build:<ventureId>:failed\` |
| \`webhooks/transcript\` success | thesis | info | info | \`transcript:<conversationId>\` |
| \`webhooks/transcript\` error | thesis | alert | warn | (none — every error fires) |
| \`cron/build-watchdog\` | thesis | alert | warn | \`build-watchdog:<ventureId>\` |
| \`cron/overnight/synthesis\` (was dead) | thesis | info | info | \`overnight-synthesis:<date>\` |
| \`review/[id]\` (raw fetch → sendToInbox) | thesis | info | info | \`review-correction:<id>\` |
| \`journal-review/[id]\` (raw fetch → sendToInbox) | thesis | info | info | \`review-correction:<id>\` |

**Out of Phase 1 scope (intentionally untouched):**
- \`app/api/telegram/webhook/route.ts\` — the 3192-line inbound handler. Phase 2 layers prefix-dispatch and ask-button flow on top.
- \`app/api/webhooks/wave/route.ts\` — Phase 2 restructures this to the 7-tag fanout.

The two protected files remain wired to \`lib/telegram.ts\` directly. The bot token therefore still must live in the Website env after Phase 1 — but it no longer needs to live in DeepOps or AlamoBernal once those migrations land in their respective Claude Code instances. See [[tech-development/deepops-notify-migration]] and [[tech-development/alamobernal-notify-migration]] for the per-codebase work (these are forward references — the migrations are queued).

## 7. Security Model

### 7.1 Authentication

\`/api/inbox\` is authenticated by a single shared secret: \`INBOX_SHARED_SECRET\`. The secret is a 32-byte base64-encoded random value (\`openssl rand -base64 32\`) provisioned in Vercel Production, Preview, and Development environments across all three projects (Website, DeepOps's \`armstrong-ui\`, AlamoBernal).

Comparison uses \`crypto.timingSafeEqual\` against the expected value, with a length pre-check (the length is not secret — both sides are known to be the same length when correct).

Rejected requests return 401 \`{ ok: false, error: "unauthorized" }\` with no information leakage about whether the secret was absent or wrong.

### 7.2 Rotation

To rotate the shared secret:
1. Generate a new value: \`openssl rand -base64 32\`.
2. Update the env var in all three Vercel projects.
3. Redeploy each (or trigger a rolling restart).
4. There is no rotation window — sends that arrive after the old value is invalidated and before the new value is propagated will 401. Plan rotation during a low-traffic window.

The bot token (\`TELEGRAM_BOT_TOKEN\`) rotates similarly but only needs to update in Website. Single rotation point — that's the headline win of Phase 1.

### 7.3 Fail-closed defaults

- \`INBOX_SHARED_SECRET\` unset → 500 \`"inbox auth not configured"\`. The endpoint refuses to serve when misconfigured.
- \`TELEGRAM_CHAT_ID\` unset → 500 \`"inbox chat id not configured"\`. No fallback chat. No fake test values.

### 7.4 What this doesn't protect against

- A compromised \`INBOX_SHARED_SECRET\` lets the attacker fire arbitrary Telegram messages to the principal. Mitigation: the principal recognizes spam quickly, rotation is straightforward, and Telegram's bot API rate-limits per chat.
- The shared secret travels in plaintext in HTTPS request headers. TLS protects it on the wire.
- No rate limiting at the endpoint. Vercel's edge DDoS protection handles abuse; the secret check rejects unauthorized traffic before reaching business logic.

## 8. Operational Model

### 8.1 Single rotation point

Before Phase 1: three independent rotation events to swap a leaked bot token (Website + DeepOps + AlamoBernal envs).

After Phase 1 (and after the DeepOps/AlamoBernal sub-migrations ship): one rotation event in Website. DeepOps and AlamoBernal hold only \`INBOX_URL\` and \`INBOX_SHARED_SECRET\`.

### 8.2 Observability

Every router decision emits the structured log line shown in §5.3. Filter Vercel logs by \`"component":"inbox-router"\` for the full activity stream. Useful queries:

- \`decision=send_failed\` — Telegram is down or the bot is misconfigured.
- \`decision=deduped\` — operational behavior; expect ~5% rate from cron retries.
- \`decision=misconfigured\` — env vars dropped; immediate action.
- \`ms > 2000\` — Telegram API latency anomaly.

### 8.3 Local development

Dev server: \`npm run dev\`. The router runs identically locally, sending to the same chat \`489068882\`. To smoke-test:

\`\`\`bash
SECRET=$(awk -F= '/^INBOX_SHARED_SECRET=/ {sub(/^[^=]*=/, ""); gsub(/^"|"$/, ""); print; exit}' .env.local)
curl -X POST http://localhost:3000/api/inbox \\
  -H "Content-Type: application/json" \\
  -H "x-inbox-secret: $SECRET" \\
  -d '{"source":"thesis","kind":"info","severity":"info","title":"smoke","body":"hi"}'
\`\`\`

Local dedupe state lives in the dev process and is wiped on restart.

## 9. Audit & Verification

Two passes were performed before merging.

**Pass 1 found and fixed:**
- Redundant type narrowing (\`'ok' in validated && validated.ok === false\`) — replaced with an \`isValidationError\` type predicate.
- Bare cast \`validated as Parameters<typeof routeMessage>[0]\` — replaced with the type predicate's narrowing.
- No observability for routing decisions — added structured JSON logging on every send/dedupe/digest/error path.
- Silent send failures — \`sendTelegramMessage\` returning \`null\` was treated as success. Now if zero chunks succeed, the router returns 500 with \`"telegram send failed — see server logs"\`. Partial-failure case (some chunks succeed, some fail) logs \`send_partial\`.

**Pass 2 found and fixed:**
- Permissive validator — \`validatePayload\` silently accepted unknown fields. A typo like \`boady\` would route a body-less message. Added strict-mode: any field outside the seven allowed keys returns 400 with the field-name list.
- No payload size caps — a 1MB body would chunk into ~250 messages. Added explicit caps: \`title ≤ 1024\`, \`body ≤ 16384\`, \`link ≤ 2048\`, \`dedupe_key ≤ 256\`. Larger payloads return 400 with a clear message.

**Smoke test results** (10 cases, all green):
- T1–T2: 401 on absent / wrong secret ✓
- T3–T4: 400 on malformed JSON / invalid source ✓
- T5–T7: 200 on each severity, correct prefix in Telegram message ✓
- T8a / T8b: dedupe returns \`{ deduped: true }\` on second invocation with same key ✓
- T9: 4500-char body chunks into two messages with \`(1/N)\` markers ✓
- Post-fix: strict-mode rejects \`boady\` typo ✓; title-cap and body-cap enforced ✓

Total elapsed routing latency under load: \`~225–525 ms\` per send (Telegram-bound; the router adds < 5 ms).

## 10. Known Limitations

### 10.1 Single-instance dedupe

The dedupe Map is per-Lambda-instance. Two concurrent invocations of \`/api/inbox\` on different instances with the same \`dedupe_key\` will both fire. In practice, dedupe keys are tied to time windows (date, weekStart) or unique IDs (ventureId, reviewId, sessionId), where concurrent duplicates are rare. Mitigation if it becomes a felt problem: promote dedupe to a Firestore-backed store or Vercel KV.

### 10.2 Single-recipient design

The router reads \`TELEGRAM_CHAT_ID\` from env and sends every message there. Multi-recipient support (per-user routing for a future B2B variant) would require adding a \`recipient\` field to the payload and a lookup table. Not blocking for the single-principal setup.

### 10.3 Markdown injection

Telegram \`parseMode: "Markdown"\` is permissive but can fail to parse if user-provided \`title\` or \`body\` contains unbalanced \`*\`, \`_\`, \`[\`. The router does not escape Markdown special characters. This matches the prior behavior of \`lib/telegram.ts\`. A future hardening would migrate to MarkdownV2 with explicit escaping.

### 10.4 No retries on transient Telegram failures

If Telegram's API returns an error (rate limit, temporary 5xx), the router logs and surfaces failure to the caller. There is no exponential-backoff retry queue. Most callers are crons that re-fire within minutes; for one-shot user actions, the failure is visible in the response. A future enhancement: a Firestore-backed retry queue with idempotency guarantees.

### 10.5 First-chunk message_id not returned

Chunked messages return only the *last* chunk's \`message_id\`. Workflows that need the first chunk's ID (for threaded replies) cannot resolve it. Same behavior as the prior \`lib/telegram.ts\`. To fix: return the array of all chunk IDs and let the caller pick.

## 11. Roadmap Forward

This phase is one of five in the buildout. The full plan is tracked in [[telegram-alfred-roadmap]].

| Phase | Title | Status |
|---|---|---|
| **1** | Outbound router + sender migration | **shipped 2026-05-14 (this memo)** |
| 2 | Inbound prefix-or-ask router + Wave 7-tag fanout | queued; depends on Phase 1 prod-stable |
| 3 | Wikis in Thesis Engine (Karpathy Layer 2) | partially shipped — you are reading this in the wikis scaffolding |
| 4 | Alfred harness (Claude Agent SDK + Ollama hybrid) | queued; depends on Phases 1–3 |
| 4a–4f | Individual workflows (memo, brief, draft, etc.) | parked sub-PRs on the harness |

**Phase 2** layers slash commands (\`/arm\`, \`/ab\`, \`/thesis\`, \`/lordas\`) and a free-form ask-button flow on top of the existing 3192-line webhook. It also generalizes the Wave webhook to prompt the principal for one of seven destination tags (fundraising / research / management / investing / lordas / alamobernal / defer). New \`/api/inbox-ingest\` and \`/api/meetings/ingest\` endpoints stand up in DeepOps and AlamoBernal.

**Phase 3** (this very wiki is part of it) provides the storage and UI for Layer 2 knowledge: contact pages, ticker theses, project status, technical-development memos like this one. \`[[slug]]\`-style links between wikis are tracked as bidirectional backlinks. The schema supports agent writes (Phase 4) by allowing arbitrary \`updatedBy\` values and \`agentVersion\` tagging.

**Phase 4** introduces the agent harness — a persistent Python service in \`DeepOps/harness/\` that consumes the project queues (filled by Phase 1–2 routing) and produces wiki rollups, memos, briefs, and drafts. Local Ollama for cheap classification work; Claude Opus/Sonnet for memo-quality output. Hosted on launchd initially, Cloud Run when laptop-on becomes a felt constraint.

**Phase 5** is the long tail of workflows on the harness runtime: meeting transcripts → action items (4a), journal entries → CRM contact rollup (4b), \`/arm memo <ticker>\` (4c), daily dev brief from commits (4d), investor comms drafts (4e), ops todo extraction (4f). Each is its own PR.

## 12. Appendix — Quick Reference

### 12.1 Project source taxonomy

| \`source\` value | Codebase | Prefix in outbound message |
|---|---|---|
| \`armstrong\` | DeepOps | \`[Armstrong]\` |
| \`alamo-bernal\` | AlamoBernal | \`[Alamo Bernal]\` |
| \`thesis\` | Website (this) | \`[Thesis]\` |
| \`lordas\` | Website feature | \`[Lordas]\` |

### 12.2 Severity decision matrix

| Severity | Badge | Bundled in digest? | When to use |
|---|---|---|---|
| \`critical\` | 🔴 | Never. Always immediate. | Process down, capital at risk, immediate action required. |
| \`warn\` | 🟡 | Eligible when digest is enabled. | Build failed, transcript processing error, stale state detected. |
| \`info\` | (none) | Eligible when digest is enabled. | Routine completion notifications: morning brief, weekly calibration, venture live. |

### 12.3 Env var inventory

| Variable | Where | Purpose |
|---|---|---|
| \`INBOX_SHARED_SECRET\` | Website, DeepOps, AlamoBernal | Authenticates POST \`/api/inbox\` |
| \`INBOX_URL\` | DeepOps, AlamoBernal | Where to POST (\`https://loricorpuz.com/api/inbox\`) |
| \`TELEGRAM_BOT_TOKEN\` | Website only | The single bot credential |
| \`TELEGRAM_CHAT_ID\` | Website only | The single recipient chat (489068882) |
| \`INBOX_DIGEST_ENABLED\` | Website only | Set to \`true\` to enable digest bundling per source |

### 12.4 Links

- Phase 1 handoff: \`DeepOps/docs/handoffs/inbox_router_phase1_2026-05-13.md\`
- Architecture decision record: \`DeepOps/docs/handoffs/telegram_router_2026-05-13.md\`
- Roadmap index: \`DeepOps/docs/handoffs/ROADMAP.md\`
- Forward references: [[tech-development/deepops-notify-migration]], [[tech-development/alamobernal-notify-migration]], [[tech-development/inbound-router-phase2]], [[tech-development/wave-7tag-fanout]], [[tech-development/alfred-harness-design]]

---

*Authored by the principal's Claude Code instance during the Phase 1 build session on 2026-05-14. Subject to revision as Phases 2–5 land. This is the canonical artifact for the inbox-router subsystem; later phases extend rather than replace it.*`,
  },
]
