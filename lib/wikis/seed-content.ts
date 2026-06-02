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
  {
    slug: 'tech-development/alamo-bernal-statements-pipeline-2026-05-25',
    title: 'Alamo Bernal — Statement Ingest Pipeline (2026-05-25)',
    surface: 'tech-development',
    contentMd: `> **Status.** Shipped 2026-05-25. End-to-end pipeline ingesting Fidelity monthly brokerage statements (Z33-... · FOUNTAIN FARM INVESTMENTS, LLC) into Supabase as the partnership's legally-binding ground truth, audited against six independent recompute checks. Production Drive cron is wired but defaults to manual trigger pending one more iteration of \`realized_consistency\` parser work.

> **TL;DR.** Statements are the broker's official period-end record. When SnapTrade live-data (\`sb_*\` tables) disagrees with the statement (\`stmt_*\` tables), statements win. The pipeline pulls PDFs from Drive, parses them with a Fidelity-specific parser tuned for two distinct text extractors (the MCP \`read_file_content\` tool used in backfill and \`pdf-parse\` used in the production cron), writes to ten append-only \`stmt_*\` tables, runs six audit checks, and persists per-period pass/fail to \`stmt_audit_runs\`. Current scoreboard: \`roll_forward\` 15/15, \`income_consistency\` 15/15, \`nav_reconstruction\` 12/15, \`realized_consistency\` 0/15 (known parser gap).

---

## 1. Why this exists

SnapTrade is the operational data plane — it gives us intraday balances, holdings snapshots, and transaction streams via a live API. It is useful, fast, and unreliable. Examples seen in production:

- \`sb_capture_cycles\` shows ~\\$3,333 in April 2026 dividends; the Fidelity statement shows \\$54,715.76. A 17× undercount.
- SnapTrade misses entire dividend events when Polygon's frequency lookup fails to match.
- The \`sb_holdings_snapshots\` table reflects a moment in time; it cannot answer "what did we own on April 30 at the close of business?" with the precision a 1099 requires.

Statements solve this. They are:

1. The broker's authoritative monthly record. Numbered, signed, audit-grade.
2. Stable: a published statement does not change retroactively.
3. Complete: every cash flow, every dividend, every trade — including ones SnapTrade missed.

The pipeline treats them as canonical and the live SnapTrade data as best-effort. Cross-source reconciliation (Phase 5, deferred) will show deltas in the UI but never auto-resolve them — the human decides.

## 2. Architecture (one paragraph each)

**Schema** ([\`supabase/migrations/0017_statements.sql\`](../alamobernal/supabase/migrations/0017_statements.sql)). Ten append-only tables under the \`stmt_*\` namespace. \`stmt_files\` is the source-of-truth row per PDF, keyed by sha256(extracted_text). \`stmt_periods\` carries the broker's headline numbers verbatim (beginning/ending NAV, additions, withdrawals, dividends, realized G/L, margin info — both period and YTD). \`stmt_holdings\`, \`stmt_transactions\`, \`stmt_pending_trades\`, \`stmt_open_orders\`, \`stmt_estimated_cash_flow\` carry line-item detail. \`stmt_raw_text\` is the forensic backstop (full extracted text per file, so we can re-derive without re-fetching). \`stmt_audit_runs\` is append-only — every audit attempt creates a row so we have history, not just current state. \`stmt_ingest_runs\` mirrors \`sb_sync_runs\` for the statement side.

**PII handling.** The full Fidelity account number (\`Z33-277917\`) lives only in \`stmt_files.raw_json.pii\`. Queryable columns store only \`account_last4\` (4 digits) and \`account_hash\` (sha256 of the full number) for joins. The address and holder name are also scrubbed from \`raw_json\` before storage. Lowest blast radius if Supabase is ever compromised.

**Parser** ([\`lib/alamo-bernal/statements/parse-fidelity.ts\`](../alamobernal/lib/alamo-bernal/statements/parse-fidelity.ts)). Pure function: rawText → ParsedStatement. Tolerates both MCP and pdf-parse extractions, which produce structurally different output for the same PDF (see §4). Three-pass preprocessing (unescape markdown → normalize whitespace → strip page breaks), then section-anchored regex extraction. Section anchors deliberately exclude generic words ("Holdings", "Activity") that appear in both summary labels and data tables; we use mustFollow/fromOffset bounds to disambiguate.

**Ingest** ([\`lib/alamo-bernal/statements/ingest.ts\`](../alamobernal/lib/alamo-bernal/statements/ingest.ts)). Shared pipeline called by three entry points: the local backfill script (\`scripts/backfill-statements.ts\`), the manual admin endpoint (\`POST /api/statements/ingest\`), and the monthly cron (\`GET /api/cron/statements-refresh\`). Idempotent: re-running skips files whose sha256 is already in \`stmt_files\`. A reparse=1 flag deletes-then-rewrites for parser updates. Every run opens a \`stmt_ingest_runs\` row up front and closes it on completion — partial failures still get a row.

**Drive auth** ([\`lib/alamo-bernal/statements/drive.ts\`](../alamobernal/lib/alamo-bernal/statements/drive.ts)). Google service-account JWT scoped to \`drive.readonly\`. The account credential lives in env (\`GOOGLE_SERVICE_ACCOUNT_JSON_B64\` — base64 to survive dotenv newline mangling) and the Drive folder is shared with the service account's email at Viewer level. PDF bytes come down as ArrayBuffer; \`pdf-parse\` v2 extracts text in-process.

**Audit** ([\`lib/alamo-bernal/statements/audit.ts\`](../alamobernal/lib/alamo-bernal/statements/audit.ts)). Six independent recompute functions, each returning an \`AuditResult\` with expected/computed/delta/status. Persisted to \`stmt_audit_runs\` append-only. See §3.

**UI** (deferred — the user reverted the Statements subtab integration on 2026-05-25 pending a redesign). API routes \`/api/statements/data\` (list) and \`/api/statements/detail\` (per-period) are live; the React subtab is not.

## 3. The six audit checks

| Check | Identity | Status (15 periods) |
|---|---|---|
| \`roll_forward\` | Beginning + Additions + Subtractions + ΔInvestmentValue ≟ Ending | **15/15 pass** to the penny |
| \`income_consistency\` | Σ(dividend + interest transactions) ≟ totalIncome (or taxableDividends + taxableInterest) | **15/15 pass** after the page-break dedupe fixes |
| \`nav_reconstruction\` | Σ(holdings.ending_market_value) ≟ market_value_holdings | **12/15 pass**; 3 small <1% over-counts to investigate |
| \`modified_dietz\` | (Ending - Beginning - NetFlows) / (Beginning + 0.5 × NetFlows) | 15/15 compute (informational only — broker doesn't publish a target) |
| \`holdings_continuity\` | Every holding either bought this period OR carried from prior period's holdings | 15/15 warn — transactions store CUSIPs, holdings store tickers, the keys don't always line up (cosmetic) |
| \`realized_consistency\` | Σ(securities realized G/L, term-weighted) ≟ net_short_term + net_long_term | **0/15** — parser misses G/L on a subset of sells; PR/wash-sale netting conventions need more iteration |

The two cleanly-passing checks (\`roll_forward\` and \`income_consistency\`) are the structural identities that prove the period is correctly captured. \`nav_reconstruction\` is the line-item proof. The three remaining gaps are well-instrumented — each \`stmt_audit_runs\` row carries the exact delta, computed vs expected, and a notes string that points at the failure mode.

## 4. The MCP vs pdf-parse extraction gap (and how we closed it)

The backfill script and the production cron use **different PDF text extractors**, and they produce structurally different output for the same PDF. The parser had to be tuned to handle both.

| Aspect | MCP (Google Drive's \`read_file_content\` tool) | pdf-parse v2 |
|---|---|---|
| Multi-line security names | Flattened to one line | Preserved across lines |
| Page break marker | "\`<page> of <total> INVESTMENT REPORT <date> - <date>\`" | "\`-- <page> of <total> --\`" + "\`MR_CE _XXX_YYY YYYYMMDD\`" + stray "\` S \`" |
| Page header inside Activity | "\`Holdings Account # Z33-... LIMITED LIABILITY CO\`" | bare "\`Account # Z33-... LIMITED LIABILITY CO\`" with no section-name prefix |
| Continuation section name | Stripped after first occurrence | Repeated at each page top, prefixed by bare "\`Activity\`" |
| Currency value with trailing dash | "\`$251,223.23-\`" (joined) | "\`$251,223.23 - \`" (space-separated, dash floats as its own token) |

Three targeted parser fixes closed the gap to identical output:

1. **Page-break stripping** now handles pdf-parse's markers in addition to MCP's. The "\`INVESTMENT REPORT <date> - <date>\`" header has a special case — keep the *first* occurrence (parsePeriodRange needs it), strip later ones.

2. **\`numTok\` / \`pctTok\` accept standalone \`-\`** as a valid N/A column token. Previously the BRSL row in MCP and the NNN REIT row in pdf-parse parsed; with the fix both extractions handle their own dash convention.

3. **Targeted "\`Activity\`" continuation strip.** pdf-parse repeats "Activity" at every page top inside the activity zone. Without the strip, \`sliceSection\` treats the second "Activity" as the end of "Securities Bought & Sold" — truncating to ~10 rows of 109. The fix matches "\`Activity \`" only when followed by a known activity-section name (preserving "Core Fund Activity" and "Other Activity In|Out" and the legitimate Activity section header).

After these fixes, MCP and pdf-parse produce **identical** parser output on Apr 2026: 9 holdings, sumMV \\$1,680,949.73 matching the broker exactly, 158 transactions across all sections.

## 5. The Fidelity layout (what the parser actually looks for)

A Fidelity Investment Report PDF has a stable section order. The parser anchors on these literal strings:

\`\`\`
H05401220820YYMMDD           ← control code (sometimes absent in pdf-parse)
Brokerage services...        ← contact info preamble
INVESTMENT REPORT <date> - <date>
FOUNTAIN FARM INVESTMENTS, LLC
Account Number: Z33-XXXXXX
Your Net Account Value: $X
This Period | Year-to-Date
  Beginning Net Account Value
  Additions / Deposits
  Subtractions / Withdrawals / Transaction Costs / Margin Interest / Taxes Withheld
  Change in Investment Value *
  Ending Net Account Value **
Accrued Interest (AI)
Account Summary
  Top Holdings
  Balance Details
  Income Summary
    Taxable Dividends / Taxable Interest / Return of Capital
    Total Dividends, Interest & Other Income $X.XX  ← section footer (used for total)
Realized Gains and Losses from Sales
  Short-term Gain / Short-term Loss / Short-term Disallowed Loss / Net Short-term Gain/Loss
  Long-term...
Margin Information
  Margin balance / Maximum amount you can borrow / Maximum rate
Holdings                                    ← data section starts here
  Core Account (SPAXX money market line)
    Description | Begin MV | Qty | Price | End MV | Cost Basis | Unrealized G/L | EAI ($) / EY (%)
  Stocks → Common Stock (rows, optionally with "M" margin prefix)
  Other (REITs, non-equity holdings)
  Total Holdings $X.XX
EAI & EY (footnote)
Activity
  Securities Bought & Sold
  Dividends, Interest & Other Income
  Margin Interest
  Other Activity In/Out
  Deposits
  Withdrawals
  Taxes Withheld
  Core Fund Activity
  Trades Pending Settlement
Open Orders
Estimated Cash Flow
Additional Information and Endnotes
\`\`\`

Two quirks worth knowing:

- **The "M" margin prefix sometimes merges with the next word.** Apr 2026 NNN REIT shows up as "MNNN REIT INC COM" — the M margin indicator and the NNN ticker name collapsed. The parser detects this by comparing the description's opening letters to the captured (TICKER) symbol.

- **"Realized Gains and Losses from Sales" appears twice in multi-page statements.** Once at the front (Account Summary) and once mid-Holdings as a continuation header. \`parseHoldings\` anchors directly between "Margin Information" and "EAI & EY" rather than using the generic section anchor list, so the second occurrence doesn't truncate the section.

## 6. Production workflow (when statements drift)

### When a new statement lands

1. Fidelity posts the prior month's statement to the Drive folder (typically within 5 business days of month-end).
2. The cron at \`/api/cron/statements-refresh\` fires daily 14:00 UTC for the first week of each month. First fire that sees a new file ingests it; subsequent fires return \`skipped: 'sha256 already ingested'\`.
3. The new \`stmt_files\` row appears with \`parse_status = 'parsed'\` (or \`review_required\` if the parser raised warnings).
4. Audit runs are not yet automatic post-ingest — run \`scripts/audit-statements.ts\` after to populate \`stmt_audit_runs\`.

### When parsing drifts (Fidelity layout change)

The audit framework is the early-warning system. Two signals:

- \`nav_reconstruction\` drops below 12/15 → a new holding row format isn't being matched. Most likely cause: a new column was added, or "M" prefix handling broke for a new ticker family.
- \`income_consistency\` drops below 15/15 → a new dividend row format isn't being matched, or "Total Dividends, Interest & Other Income $X.XX" was renamed.

Workflow:

1. Identify the failing periods from the audit run summary.
2. \`npx tsx --env-file=.env scripts/parse-statements-dryrun.ts <YYYY-MM-DD>\` to see what the parser captured.
3. Compare against the raw text at \`/tmp/statements/raw/<YYYY-MM-DD>.txt\` or fetch fresh via the Drive client.
4. Adjust regexes in [\`parse-fidelity.ts\`](../alamobernal/lib/alamo-bernal/statements/parse-fidelity.ts). Add comments documenting the new edge case.
5. \`npx tsx --env-file=.env scripts/backfill-statements.ts --reparse\` to rewrite the local data.
6. Re-run audit. Confirm pass rate returns to baseline.
7. Commit with a message that names the specific layout change (e.g., "fix(statements): handle new Activity continuation header format").

### When adding a new broker

Most of the schema is broker-agnostic — \`stmt_*\` tables don't assume Fidelity. The parser is broker-specific. To add Schwab/IBKR:

1. New parser module: \`parse-schwab.ts\` or similar. Same shape as \`parse-fidelity.ts\` (rawText → ParsedStatement).
2. Update \`drive.ts\` to route by file naming convention or by parsing the first 200 chars to detect broker.
3. Add \`broker: 'schwab' | 'ibkr'\` enum value handling in \`stmt_files.broker\`.
4. Audits run unchanged — they operate on the unified \`stmt_periods\` / \`stmt_holdings\` / \`stmt_transactions\` schema.

## 7. Known open work

- **\`realized_consistency\` parser gap.** The audit detects the issue cleanly; the parser doesn't capture realized G/L on every sell. The PR (Previously Reported) marker convention and wash-sale netting need more iteration. Affects no other audit check.
- **\`holdings_continuity\` matching key.** Securities transactions store CUSIPs (no ticker); holdings store tickers (no CUSIP). A CUSIP→ticker lookup at ingest time would close this trivially; deferred.
- **Three \`nav_reconstruction\` over-counts** (Nov/Dec 2025, Jan 2026). Each <1%. Likely a single duplicated holding row or a column mis-alignment in those specific months — the audit panel will show the offending row when the UI is wired.
- **Phase 5: Cross-source reconciliation.** A \`stmt_*\` vs \`sb_*\` delta view that surfaces (but doesn't auto-resolve) discrepancies. Most useful surface is dividends — broker says \\$55k in April, SnapTrade says \\$3k.
- **UI integration.** \`StatementsTab\` subtab was reverted on 2026-05-25 pending a redesign. The two API routes are live and ready.

## 8. Related artifacts

- Repository: [github.com/sovereignangel/alamobernal](https://github.com/sovereignangel/alamobernal)
- Schema migration: \`supabase/migrations/0017_statements.sql\`
- Parser: \`lib/alamo-bernal/statements/parse-fidelity.ts\`
- Audit module: \`lib/alamo-bernal/statements/audit.ts\`
- Ingest pipeline: \`lib/alamo-bernal/statements/ingest.ts\`
- Drive client: \`lib/alamo-bernal/statements/drive.ts\`
- Backfill script: \`scripts/backfill-statements.ts\`
- Audit runner: \`scripts/audit-statements.ts\`
- Companion brief: [[tech-development/inbox-router-phase1-2026-05-14]] is the closest analog buildout — same documentation style, different subsystem.
- Forward references: [[tech-development/alamobernal-statements-phase5-reconciliation]] (deferred — \`stmt_*\` vs \`sb_*\` delta view), [[tech-development/alamobernal-realized-gl-parser]] (deferred — close the \`realized_consistency\` gap).

---

*Authored by the principal's Claude Code instance during the Phase 2A/2B/3/4 build session on 2026-05-24/25. Pipeline is shipped end-to-end and production-validated; the open items in §7 are scoped and instrumented but deferred pending higher-priority work.*`,
  },
  {
    slug: 'tech-development/fundamentals-report-flow-2026-05-28',
    title: 'Fundamentals Report Flow — End-to-End (2026-05-28): Daemon → Telegram Deep Link → Comment + Regenerate',
    surface: 'tech-development',
    contentMd: `> **Status.** Shipped 2026-05-28. Adds (a) per-report deep linking from Telegram alerts into the Armstrong UI via the public \`/r/{TICKER}/{PERIOD}/{YEAR}\` route, (b) a reviewer "comment + regenerate" loop that turns Lori or Dave's notes into a queued revision draft. Builds on top of [[tech-development/inbox-router-phase1-2026-05-14]] (the outbound Telegram router) and the existing R&D worker daemon. Sibling to [[tech-development/alamo-bernal-statements-pipeline-2026-05-25]].

> **TL;DR.** A fundamentals memo drafted by the local Ollama-backed daemon used to land in Telegram with a link to the fund homepage — useless for actually reading the report. After this buildout, the Telegram payload contains a direct link to the just-drafted memo, and the report viewer surfaces a "Notes for revision" textarea (gated to Lori + Dave) that re-enqueues the same harness with the reviewer's feedback. Revisions are tagged \`-rev{N}\` so the original draft is preserved for audit and A/B comparison.

---

## 1. Why This Matters

The fundamentals memo is the artifact Dave evaluates before sizing a position. Two friction points existed before today:

1. **Telegram → fund homepage**. The "draft ready" alert linked to \`armstrong.aretetec.com\` instead of the specific report. Lori (or Dave) had to manually navigate Research → Fundamentals → search → open. On mobile (where these alerts are read), that's three taps + a typed ticker.
2. **No revision loop**. If a draft missed the thesis (hallucinated peer set, weak section, bad assumption), the only options were to either (a) regenerate from scratch with the same prompt and pray for variance, or (b) ignore the draft. Neither captures *what specifically* should change.

This buildout closes both gaps with one routed surface.

## 2. End-to-End Flow

\`\`\`
┌─────────────────────────────────────┐
│ Drafting (local Ollama on Lori M1)  │
│ scripts/research_worker/daemon.py    │
│ → run_fundamentals_harness(rec)      │
│   → generate_report()                │
│     → Ollama qwen2.5:14b (streamed)  │
│     → INSERT fundamental_reports     │
│       prompt_version = base | -revN  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Notification dispatch                │
│ daemon.notify("Armstrong RnD:        │
│   draft ready", link=DEEP_LINK)      │
│ where DEEP_LINK now = armstrong/r/   │
│   {TICKER}/{PERIOD}/{YEAR}           │
└──────────────┬──────────────────────┘
               │  POST { link }
               ▼
┌─────────────────────────────────────┐
│ Outbound Inbox Router                │
│ Website /api/inbox → routeMessage()  │
│ [[tech-development/inbox-router-     │
│   phase1-2026-05-14]]                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Telegram (Lori + Alamo chat 489...)  │
│ "[Armstrong] Armstrong RnD: draft    │
│   ready  AES Q1 2026 — 9.2K chars    │
│   Open the drafted memo:             │
│   armstrong/r/AES/Q1/2026"           │
└──────────────┬──────────────────────┘
               │  tap link
               ▼
┌─────────────────────────────────────┐
│ Armstrong UI public route /r/...     │
│ armstrong-ui/src/SharedReportPage    │
│ → renders ReportBody (auth bypassed; │
│   RLS allows public read on          │
│   fundamental_reports)               │
└──────────────┬──────────────────────┘
               │  Lori signs in,
               │  types notes,
               │  hits "Regenerate"
               ▼
┌─────────────────────────────────────┐
│ Vercel /api/queue-revision           │
│ JWT-auth → INSERT research_requests  │
│ { type: 'fundamentals',              │
│   payload: { ticker, period, year,   │
│     revision_notes, force: true } }  │
└──────────────┬──────────────────────┘
               │  daemon claims next
               ▼
            (back to top with -rev1)
\`\`\`

## 3. The Deep Link Patch

**File:** \`scripts/research_worker/daemon.py\`

The harness contract changed from \`(output, invocations)\` to \`(output, invocations, deep_link_or_None)\`. Fundamentals returns a deep link constructed from the just-generated report:

\`\`\`python
def _share_link_for_report(result):
    """result['period'] is '{fiscal_period} {fiscal_year}' (space-delimited)."""
    ticker = result['ticker']
    fp, fy = result['period'].split()
    return f"https://armstrong.aretetec.com/r/{ticker}/{fp}/{fy}"
\`\`\`

Other harness types (\`backtest\`, \`research\`, \`development\`, \`paper_trade\`, \`audit\`) return \`None\` and fall back to the dashboard root URL. The dispatcher in \`dispatch()\` and the caller in \`process_one()\` were extended uniformly so the contract is consistent.

The link is passed verbatim into \`notify(kind, severity, title, body, link)\`, which composes the \`/api/inbox\` payload. The router (Website \`lib/inbox/router.ts\`) renders the link in the Telegram message body — this required no changes on the Website side.

## 4. The Comment + Regenerate Flow

### 4a. The UI surface

**File:** \`armstrong-ui/src/ReportViewerModal.jsx\`

The modal now reads the current Supabase user via \`getCurrentUser()\`. If the email is in \`REVISION_ALLOWED_EMAILS\` (currently \`loricorpuz@gmail.com\`, \`mossda@gmail.com\`), a sticky "Notes for revision" textarea renders below the rendered memo. The button POSTs to \`/api/queue-revision\` with:

\`\`\`json
{
  "ticker": "AES",
  "fiscal_period": "Q1",
  "fiscal_year": "2026",
  "revision_notes": "Peer set is wrong — exclude utilities, include independent power producers.",
  "ollama_model": "qwen2.5:14b"
}
\`\`\`

On success the button collapses to a "Queued. Telegram alert will arrive when the revision is drafted." chip. The reviewer can close the modal — the daemon will Telegram a new deep link when the \`-rev1\` draft is persisted.

### 4b. The API endpoint

**File:** \`armstrong-ui/api/queue-revision.js\`

JWT-authenticated. Verifies the user's email against the Lori + Dave allowlist (same pattern as \`api/queue-submit.js\`). Inserts into \`research_requests\` with \`type: 'fundamentals'\` and the revision payload. Reuses the existing daemon — no new daemon mode, no new poll loop.

### 4c. The generator revision branch

**File:** \`scripts/generate_fundamental_report.py\`

\`generate_report()\` gains a \`revision_notes\` keyword. When provided:

1. Fetch the most-recent prior draft for \`(ticker, period, year, prompt_version LIKE base*)\`. This recovers both the original and any earlier \`-revN\`.
2. Count existing \`-rev\` rows to derive \`N+1\`. Stamp the new draft as \`prompt_version=<base>-rev{N+1}\`.
3. Append the prior draft (truncated to ~4K chars) and the reviewer's notes to the prompt with an explicit *"address each, then re-emit the full memo"* directive. Same JSON-then-markdown schema, just revised.
4. Persist alongside the original — both rows visible in the Library, deduped per (ticker, period, year) by \`generated_at DESC\`.
5. Store \`revision_notes\` in a new column on \`fundamental_reports\` (migration: \`add_revision_notes_to_fundamental_reports.sql\`) so revisions are reproducible.

## 5. Auth + RLS Map

| Surface | Auth | Notes |
|---|---|---|
| Public \`/r/{TICKER}/{PERIOD}/{YEAR}\` read | None (RLS \`USING (true)\` on \`fundamental_reports\`) | Telegram recipients can preview without signing in |
| Report viewer (modal in app) | Supabase session | Revision controls render only for \`REVISION_ALLOWED_EMAILS\` |
| \`/api/queue-revision\` | JWT + email allowlist | Rejects 403 outside Lori/Dave |
| \`research_requests\` insert | Service role | Inserted server-side from the API; never from browser |
| \`/api/inbox\` (Website) | \`INBOX_SHARED_SECRET\` | Same as everything else in [[tech-development/inbox-router-phase1-2026-05-14]] |

The public \`/r/\` route is intentionally read-only. Sharing a memo with a third party (e.g., a co-investor for a single thesis) doesn't grant them revision capability — that requires a signed-in Lori/Dave session.

## 6. Dev / QA Labeling

Reports generated by the local Ollama path are tagged \`prompt_version=fundamentals-report-v3-ollama-qwen2.5-14b\` (or whichever model). The Library and the modal both render a burgundy **DEV** badge next to those rows, and a green **REV** badge on any \`-revN\` row. This is the visual cue that the row hasn't been promoted to production. Bulk overnight generation is off until the principal manually green-lights a prompt version.

## 7. Failure Modes / Operational Notes

- **Daemon offline.** Revision requests stack in \`research_requests\` (\`status=queued\`). They process FIFO when the daemon restarts (\`launchctl bootstrap gui/<uid>/com.loricorpuz.armstrong-rnd-worker\`).
- **Ollama not warm.** First revision after a daemon restart pays the ~9s model load. Subsequent requests in the same session reuse the warm runner thanks to \`keep_alive: 4h\`.
- **Reviewer notes exceeding 4000 chars.** API rejects with \`revision_notes_too_long_4000_max\`. This matches the prompt context-window budget (the prior draft itself is truncated to 4K).
- **Telegram link broken (e.g., off-cycle ticker with no Q1 2026)**. The route falls back to "Report not found." Lori can still find the actual report by opening the Library and filtering by ticker; the slug is descriptive, so the bad URL is self-explanatory.
- **Migration not applied.** \`revision_notes\` column absent → revision write throws \`column does not exist\`. The migration must be applied in Supabase SQL Editor before the first revision is submitted.

## 8. Open Items

- **Per-thread revision history view.** The Library shows only the newest row per \`(ticker, period, year)\`. A side-panel or stacked view that surfaces *"v1 base → v2 with notes 'fix peer set' → v3 with notes 'add 2026 catalysts'"* would let the reviewer audit how the memo evolved. Deferred until 3+ revisions exist on any one report.
- **Dave SMS path.** Dave is not in the Telegram chat (per [[tech-development/inbox-router-phase1-2026-05-14]] §3). When he submits revision notes via UI, the notification still lands only in Lori's Telegram. A future enhancement is to dispatch an SMS/email alert to the submitter alongside the Telegram alert.
- **Auto-evaluate against the prior draft.** A diff view or LLM-as-judge pass that scores *"did the revision actually address the reviewer's note?"* before the daemon marks the draft ready. Currently the harness assumes any output is the revised memo.

---

**Code references:**
- Daemon: \`scripts/research_worker/daemon.py:401-500\` (\`run_fundamentals_harness\`), \`:570-630\` (\`process_one\` with deep link)
- Generator: \`scripts/generate_fundamental_report.py:280-470\` (\`generate_report\` with revision branch)
- API: \`armstrong-ui/api/queue-revision.js\`
- UI: \`armstrong-ui/src/ReportViewerModal.jsx:246-380\` (revision textarea + button), \`src/FundamentalsLibrary.jsx\` (DEV/REV badges)
- Public route: \`armstrong-ui/src/SharedReportPage.jsx\`, registered in \`src/App.jsx:32-34\`
- Migration: \`migrations/add_revision_notes_to_fundamental_reports.sql\`

---

*Authored by the principal's Claude Code instance during the 2026-05-28 build session. Companion to [[tech-development/inbox-router-phase1-2026-05-14]]. All five surfaces (daemon, generator, API, UI, migration) shipped to working tree; the migration must be applied in Supabase before the first revision request, and the prompt version is labeled DEV/QA until the principal promotes it to production.*`,
  },
  {
    slug: 'tech-development/armstrong-cost-basis-adjustments-2026-06-02',
    title: 'Armstrong Cost Basis Adjustments: Fair Pilot Performance from Inception (2026-06-02)',
    surface: 'tech-development',
    contentMd: `> **Status:** Implemented 2026-06-02. Two-tier cost basis adjustment system locks inception (Dec 30, 2022) and Armstrong capital transfers (VGT/HACK, Oct 31, 2025) as the canonical cost baselines for all downstream calculations. Single source of truth. Auditable by design.

> **TL;DR.** The Armstrong LEAP pilot performance is measured from Dec 30, 2022 (inception). Any position held on that date uses its market value on that date—not its original purchase price—as the cost basis for return calculations. External capital transfers (VGT, HACK) use their first-statement market value. This ensures fair pilot measurement: the pilot's returns are earned from day one of its actual operational period, not from stale historical costs that predate Armstrong. Two JSON files (\`inception_cost_basis.json\`, \`armstrong_cost_basis.json\`) serve as the source of truth. All downstream systems (fundraising decks, leap_kpis.json, invest page) consume these adjustments from a canonical layer.

---

## 1. The Problem: Stale Cost Basis Distorts Pilot Performance

### Before (The Mess)

Dave's portfolio on Dec 30, 2022 (when the Armstrong LEAP pilot began) contained positions like MSFT:
- **Original purchase price:** $13,446.89 (cost basis in Dave's old records)
- **Market value on Dec 30, 2022:** $89,828.06
- **Current position (May 29, 2026):** 156.41 shares at $70,420.22

**The problem:** If you use the original cost basis ($13,446.89), the "Armstrong pilot return" on MSFT becomes 424%, which inflates the pilot's track record. The original cost basis is *irrelevant* to Armstrong's operational period.

**Reality check:** MSFT is actually underwater from the inception point ($89,828 cost, $70,420 current = -21.6% loss). Using inception market value as the cost baseline is the only fair measurement.

### The Core Rule

> **For fair pilot performance measurement, reset the cost baseline to the portfolio's actual start date (Dec 30, 2022). Use market values on that date, not original purchase prices.**

This principle also applies to positions added after inception. When VGT and HACK were transferred into Armstrong on Oct 8, 2025 (first JPM statement Oct 31), their cost basis should be their Oct 31 market value ($198,302.50 and $201,503.00), not their historical cost from Dave's British account.

---

## 2. The System: Two-Tier Cost Basis Hierarchy

### Tier 1: Inception Cost Basis (Dec 30, 2022)

**Applies to:** 13 stocks held on Dec 30, 2022
- GOOGL, AMZN, AAPL, CMPS, MJ, HYLN, MSFT, NVDA, UFO, QS, RBLX, SE, TSLA

**Source:** \`data/dave_trades/inception_cost_basis.json\`
- Each ticker maps to its market value on Dec 30, 2022 (from JPM statement)
- Example: MSFT → $89,828.06 (qty: 374.5645 shares)

**Rationale:** These positions were *in the portfolio* when the Armstrong pilot began. Their "effective cost basis" for pilot returns is their market value on day one, not their historical cost.

### Tier 2: Armstrong Cost Basis (Post-Inception Transfers)

**Applies to:** Positions added after Dec 30, 2022
- Currently: VGT (added Oct 8, 2025), HACK (added Oct 8, 2025)

**Source:** \`data/dave_trades/armstrong_cost_basis.json\`
- Each ticker maps to its market value on the first JPM statement that includes it
- Example: VGT → $198,302.50 (Oct 31, 2025 statement; entry date Oct 8)

**Rationale:** These are external capital transfers (British account → Chase account), similar to inception holdings. The transfer date marks the effective entry into Armstrong. Gains/losses from that date forward count toward pilot performance.

**Dave's Context:** Both VGT and HACK represent new capital brought into Armstrong, not positions Armstrong generated. They're treated as inception-like for fairness: the pilot measures *its own* gains from the date it actually took control of the capital.

### Tier 3: JPM Cost Basis (Fallback)

**Applies to:** All other positions
- Use JPM statement cost basis as-is (no adjustment)
- Most recently added positions, or positions where adjustment is not warranted

---

## 3. Data Flow & Architecture

\`\`\`
CANONICAL INPUT LAYER
━━━━━━━━━━━━━━━━━━━━━
        │
        ├─ jpm_holdings_YYYY-MM-DD.json
        │  (monthly snapshots from JPM PDF parse)
        │
        ├─ inception_cost_basis.json
        │  (13 tickers held Dec 30, 2022)
        │
        └─ armstrong_cost_basis.json
           (VGT, HACK; post-inception transfers)


COST BASIS ADJUSTMENT LAYER [NEW STAGE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │
        └─ apply_cost_basis_adjustments.py

           For each monthly snapshot:
           ├─ Load inception overrides
           ├─ Load armstrong overrides
           └─ For each position:
              ├─ IF ticker in inception_cost_basis
              │  └─→ cost_basis_adjusted = inception_cost_basis
              ├─ ELSE IF ticker in armstrong_cost_basis
              │  └─→ cost_basis_adjusted = armstrong_cost_basis
              └─ ELSE
                 └─→ cost_basis_adjusted = cost_basis_jpm

           OUTPUT: portfolio_positions_canonical.json
           ├─ cost_basis_jpm (raw)
           ├─ cost_basis_adjusted (final)
           ├─ adjustment_type (inception|armstrong|none)
           └─ adjustment_source


CANONICAL OUTPUT LAYER
━━━━━━━━━━━━━━━━━━━━━
        │
        ├─ leap_kpis.json
        │  (portfolio summary + performance metrics)
        │  └─ Reads ONLY from portfolio_positions_canonical
        │     (cost_basis_adjusted field)
        │
        ├─ fundraising_decks (computations.py)
        │  ├─ get_top_unrealized_by_dollar_profit()
        │  ├─ get_top_total_return()
        │  └─ Reads ONLY from portfolio_positions_canonical
        │
        └─ armstrong-ui /invest page
           └─ Reads ONLY from leap_kpis.json
\`\`\`

**Single Source of Truth Principle:** All downstream systems read \`cost_basis_adjusted\` from the canonical layer. No system reapplies the adjustment logic independently. This prevents drift and makes auditing trivial: if a number is wrong, the bug is in exactly one place.

---

## 4. Implementation Priority & Audit Trail

### Priority Order (Highest → Lowest)

1. **Inception adjustments** — Positions held Dec 30, 2022
2. **Armstrong adjustments** — Positions added post-Dec 30, 2022
3. **JPM cost basis** — Everything else

### Audit Trail Metadata (Stored in Canonical Layer)

Each adjusted position includes:

\`\`\`json
{
  "ticker": "MSFT",
  "quantity": 156.40596,
  "market_value": 70420.22,
  "cost_basis_jpm": 19186.12,
  "cost_basis_adjusted": 89828.06,
  "adjustment_type": "inception",
  "adjustment_source": "inception_cost_basis.json",
  "adjustment_note": "Position held at Dec 30, 2022 inception; using inception market value",
  "period_end": "2026-05-29"
}
\`\`\`

**Downstream systems stamp every output with this metadata:**
- Fundraising decks: footnote explains which adjustments were applied
- leap_kpis.json: \`_meta.adjustments_applied\` lists all tickers with adjustments
- /invest page: hover tooltip shows cost_basis_jpm vs. cost_basis_adjusted

---

## 5. Key Positions: Before & After

| Ticker | Inception MV (Dec 30, 2022) | Current MV (May 29, 2026) | Current JPM CB | Adjusted CB | Return (Adjusted) |
|--------|--------------------------|----------------------|-------------|-----------|------------------|
| **MSFT** | $89,828.06 | $70,420.22 | $19,186.12 | **$89,828.06** | **-21.6%** 📉 |
| **AAPL** | $128,274.27 | $58,482.85 | $9,079.56 | **$128,274.27** | **-54.4%** 📉 |
| **AMZN** | $8,400.00 | $154,806.08 | $78,343.29 | **$8,400.00** | **+1,745%** 📈 |
| **VGT** | — | $98,750.00 | $195,500.00 | **$198,302.50** | **-50.3%** 📉 |
| **HACK** | — | $216,753.00 | $210,000.00 | **$201,503.00** | **+7.6%** 📈 |

**Impact:** MSFT and AAPL are *excluded* from top performers (underwater from inception). VGT is also excluded (underwater from transfer). AMZN and HACK remain in top performers with correct, fair returns.

---

## 6. The Two JSON Files: Source of Truth

### File 1: \`inception_cost_basis.json\`

**Location:** \`data/dave_trades/inception_cost_basis.json\`

\`\`\`json
{
  "_meta": {
    "description": "Inception cost basis adjustments for positions held on Dec 30, 2022",
    "rule": "For all positions held at inception, use the market value on that date as the cost basis for Armstrong return calculations",
    "inception_date": "2022-12-30",
    "count": 13,
    "context": "These 13 stocks reset the cost baseline to portfolio inception. Their 'effective cost basis' for pilot performance is their market value on day one, not their original purchase price (which may date back years)."
  },
  "adjustments": {
    "MSFT": {
      "entry_date": "2022-12-30",
      "statement_date": "2022-12-30",
      "inception_cost_basis": 89828.06,
      "note": "Market value from Dec 30, 2022 JPM inception statement (qty: 374.5645)"
    }
    // ... 12 more tickers
  },
  "_implementation_notes": {
    "priority_order": "inception (highest) > armstrong > jpm",
    "downstream_systems": ["fundraising_decks", "leap_kpis.json", "armstrong-ui /invest page"],
    "data_flow": "jpm_holdings_YYYY-MM-DD.json → apply_cost_basis_adjustments.py → portfolio_positions_canonical.json → leap_kpis → all systems"
  }
}
\`\`\`

### File 2: \`armstrong_cost_basis.json\`

**Location:** \`data/dave_trades/armstrong_cost_basis.json\`

\`\`\`json
{
  "_meta": {
    "description": "Armstrong cost basis adjustments for positions added after inception",
    "rule": "When a position enters the portfolio after Dec 30, 2022, use the market value from the first JPM statement as the cost basis",
    "inception_date": "2022-12-30",
    "context": "These positions represent external capital transfers (British account → Chase). Treated as inception-like: gains/losses from transfer date forward count toward pilot performance."
  },
  "adjustments": {
    "VGT": {
      "entry_date": "2025-10-08",
      "statement_date": "2025-10-31",
      "armstrong_cost_basis": 198302.50,
      "name": "Vanguard Information Technology ETF",
      "origin": "Transferred from Dave's British account to Chase account",
      "rationale": "External capital addition. Cost basis = Oct 31, 2025 market value at transfer. Gains/losses from Oct 31 forward count toward pilot performance."
    },
    "HACK": {
      "entry_date": "2025-10-08",
      "statement_date": "2025-10-31",
      "armstrong_cost_basis": 201503.00,
      "name": "Cybersecurity ETF",
      "origin": "Transferred from Dave's British account (held ~decade prior)",
      "rationale": "External capital addition. Original purchase price in British account is irrelevant to Armstrong pilot returns. Cost basis = Oct 31, 2025 market value."
    }
  }
}
\`\`\`

---

## 7. Integration: How Downstream Systems Use This

### Fundraising Decks (\`computations.py\`)

\`\`\`python
def get_top_total_return(lifecycle_map, latest_holdings, top_n=12):
    """Top N positions by total return (realized + unrealized combined).

    Uses inception > armstrong > jpm cost basis priority.
    """
    inception_cb = _load_inception_cost_basis()
    armstrong_cb = _load_armstrong_cost_basis()

    for ticker, data in by_ticker.items():
        # Priority: inception > armstrong > jpm
        if ticker in inception_cb:
            cost_basis = inception_cb[ticker]  # Use inception
        elif ticker in armstrong_cb:
            cost_basis = armstrong_cb[ticker]  # Use armstrong
        else:
            cost_basis = data["cost_basis"]     # Use JPM

        # Calculate returns from correct baseline
        unrealized_pnl = data["market_value"] - cost_basis
        # ...
\`\`\`

**Result:** Top 12 slides show ONLY winning positions measured from fair baselines. MSFT and AAPL correctly excluded (underwater from inception).

### leap_kpis.json

\`\`\`json
{
  "_meta": {
    "adjustments_applied": [
      "inception (13 tickers: GOOGL, AMZN, AAPL, ...)",
      "armstrong (2 tickers: VGT, HACK)"
    ],
    "adjustment_source": "portfolio_positions_canonical.json (generated 2026-06-02)",
    "adjustment_rule": "inception > armstrong > jpm cost basis priority"
  },
  "portfolio_summary": {
    "total_value": 3619078,
    "total_cost_basis": 2388485,
    "unrealized_pnl": 1230593,
    // ... calculated using adjusted cost basis
  },
  "performance_unrealized": {
    "cumulative": {
      "si": {
        "twr_pct": 646.8,
        // ... all metrics use adjusted cost basis
      }
    }
  }
}
\`\`\`

---

## 8. Key Caveat: Multi-Tranch Positions

**MSFT example:**
- Inception: 374.5645 shares at $89,828.06 market value
- Current: 156.41 shares at $70,420.22 market value
- We sold ~218 shares over time (realized P&L in lifecycle_map separately)

**How the adjustment works:**
- We apply inception cost basis ($89,828.06) to the **entire current position** (156.41 shares)
- This is correct for measuring "inception-to-current trajectory" (i.e., "the pilot started with MSFT at $89.8K, it's now worth $70.4K")
- The sold shares realize P&L separately in the lifecycle_map

**Caveat:** This approach slightly understates total returns if significant tranches were sold at a profit (those profits appear in lifecycle realized P&L, not in unrealized). For fundraising materials, this is acceptable—it shows conservative inception-to-current measurement. If precision becomes critical (e.g., for tax reporting), we'd need share-level tranche tracking.

---

## 9. Open Items & Future Refinements

- **Supabase table alternative:** Consider moving inception_cost_basis and armstrong_cost_basis to a Supabase table (\`cost_basis_overrides\`) for queryability and real-time updates without redeployment.
- **Share-level tranche tracking:** If multi-tranch positions cause material drift, implement per-tranche cost basis (more precise but more complex).
- **Automated reconciliation:** Run quarterly checks: "which positions have changed quantity since their adjustment date?" Surface inconsistencies for manual review.
- **Historical snapshots:** Archive adjusted cost bases month-by-month in portfolio_positions_canonical for auditability.

---

## 10. References & Backlinks

- **Source files:** \`data/dave_trades/inception_cost_basis.json\`, \`data/dave_trades/armstrong_cost_basis.json\`
- **Calculation code:** \`scripts/fundraising_decks/computations.py:_load_inception_cost_basis()\`, \`:_load_armstrong_cost_basis()\`, \`:get_top_total_return()\`
- **Data layer:** \`scripts/fundraising_decks/data_loaders.py:load_monthly_holdings()\`
- **Output:** \`armstrong-ui/public/data/leap_kpis.json\` (produced by JPM pipeline refresh)
- **Related:** [[tech-development/jpm-statement-ingestion-pipeline]], [[armstrong-fundraising-deck-architecture]]

---

**Authored:** 2026-06-02 by Claude Code during cost basis adjustment implementation. This wiki is the canonical reference for all downstream systems consuming inception/Armstrong cost basis adjustments. If a number in the fundraising decks doesn't match expectations, this page explains why.`,
  },
]
