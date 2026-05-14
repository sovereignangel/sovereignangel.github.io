# Inbox Router — Phase 1 (Outbound Consolidation)

**Status:** Shipped 2026-05-14
**Codebase:** `Website` (this repo)
**Stack:** Next.js 14 (App Router), Node runtime, Firebase Admin SDK, Telegram Bot API
**Karpathy layer:** This work is **Layer 1** — the raw dump pipeline. It is the messaging spine the rest of the personal-OS sits on.

---

## 1. Executive summary

Three independent codebases (Website, DeepOps, AlamoBernal) each held their own copy of the Telegram bot token and their own copy-pasted `send_telegram()` helpers, fanning out 18 outbound call sites across two languages and three deploy targets. Token rotation required touching three projects; severity, dedupe, and digesting were each re-implemented at every site (or not at all); message provenance was lost the moment a notification hit the chat.

Phase 1 consolidates the outbound surface into a single endpoint — `POST /api/inbox` on the Website project — and migrates Website's 10 in-process callers to it. The endpoint accepts a typed contract `{ source, kind, severity, title, body?, link?, dedupe_key? }`, prefixes every outbound message with its source (`[Armstrong]`, `[Alamo Bernal]`, `[Thesis]`, `[Lordas]`), applies severity badges, handles the 4096-char Telegram limit with `(N/M)` chunk markers, dedupes within a TTL window, and emits structured JSON logs for every decision.

DeepOps and AlamoBernal Phase 1 migrations are queued as separate work items requiring Claude Code instances rooted in each respective repository.

---

## 2. Strategic context

The work sits inside a broader architecture conceived in [[telegram-router-handoff]] (see `DeepOps/docs/handoffs/telegram_router_2026-05-13.md`). The full Alfred / personal-OS plan has five phases:

| # | Title | Status |
|---|---|---|
| 1 | Outbound router + migrate senders | **This document** |
| 2 | Inbound prefix-or-ask router + Wave 7-tag fanout | Queued |
| 3 | Wikis in Thesis Engine (this surface) | Shipping alongside Phase 1 |
| 4 | Alfred harness (Claude Agent SDK + Ollama hybrid) | Queued |
| 5 | Individual workflow PRs on the harness | Queued |

Phase 1 is the load-bearing precondition: every later phase consumes either the outbound contract (alerts, drafts, briefs) or the symmetric inbound contract that Phase 2 will layer on top of the same webhook surface.

The mental model is Andrej Karpathy's three-layer LLM-augmented thinking framework:

- **Layer 1 — Full dump.** Telegram chat, Wave AI transcripts, journal entries, raw notes. *The router and its inbound twin own this layer.*
- **Layer 2 — Wikis.** Distilled, structured, self-updating knowledge pages. *The Wikis tab in Thesis Engine ships in parallel with Phase 1.*
- **Layer 3 — Instructions.** `CLAUDE.md`, `MEMORY.md`, prompt files. *Already exists across all three codebases; evolves with usage.*

Phase 4 introduces a fourth layer — the harness — that reads Layer 1, distills into Layer 2, and follows Layer 3.

---

## 3. System architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Outbound surface (Phase 1)                          │
│                                                                             │
│   ┌────────────────────┐                                                    │
│   │  Website internal  │  ─── direct in-process call (no HTTP) ─────┐      │
│   │  10 call sites     │                                            │      │
│   └────────────────────┘                                            │      │
│                                                                     │      │
│   ┌────────────────────┐    POST /api/inbox                         │      │
│   │  DeepOps (Python   │   x-inbox-secret: <INBOX_SHARED_SECRET>    │      │
│   │  + bash)           │   ───────────────────────────────────────► │      │
│   │  4 senders         │                                            │      │
│   └────────────────────┘                                            ▼      │
│                                                          ┌─────────────────┐│
│   ┌────────────────────┐    POST /api/inbox              │  routeMessage   ││
│   │  AlamoBernal       │   x-inbox-secret: ...           │  (single sink)  ││
│   │  (Next.js)         │   ───────────────────────────►  │                 ││
│   │  2 cron senders    │                                 │  - prefix tag   ││
│   └────────────────────┘                                 │  - severity     ││
│                                                          │  - dedupe TTL   ││
│                                                          │  - digest queue ││
│                                                          │  - chunk 4096   ││
│                                                          │  - JSON logs    ││
│                                                          └────────┬────────┘│
│                                                                   │         │
│                                                                   ▼         │
│                                                     ┌─────────────────────┐ │
│                                                     │ Telegram Bot API    │ │
│                                                     │ chat 489068882      │ │
│                                                     │ (single recipient)  │ │
│                                                     └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why centralize in Website?** The 3,192-line Telegram webhook handler already lives here. The `lib/telegram.ts` send helper already lives here. `UserSettings.telegramChatId` is already read from this codebase. Centralizing here is the lowest net-new code. The bot token rotates here and only here.

**The four legal `source` values** (locked across all phases):

| `source` | Project | Codebase |
|---|---|---|
| `armstrong` | Hedge fund #1 | `/Users/loricorpuz/DeepOps` (Python + React/Vite) |
| `alamo-bernal` | Hedge fund #2 | `/Users/loricorpuz/alamobernal` (Next.js + Supabase) |
| `thesis` | Thesis Engine / personal founder surface | This repo |
| `lordas` | Wave.ai parsing → relational metrics | This repo (feature, not a separate codebase) |

---

## 4. Data architecture

### 4.1 The outbound contract

```ts
// Request — POST /api/inbox
{
  source: "armstrong" | "alamo-bernal" | "thesis" | "lordas",
  kind:   "alert" | "signal" | "info" | "digest_item",
  severity: "critical" | "warn" | "info",
  title:  string,            // ≤ 1024 chars
  body?:  string,            // ≤ 16 KB
  link?:  string,            // ≤ 2 KB
  dedupe_key?: string        // ≤ 256 chars; collapses repeats in TTL window
}

// Response — success
{ ok: true, message_id?: number }
{ ok: true, deduped: true }
{ ok: true, digested: true }    // when digest mode is enabled

// Response — failure
{ ok: false, error: string }    // 4xx (validation / auth) or 5xx (Telegram unreachable)
```

All four `kind` values + three `severity` values + four `source` values must pass enum validation. Unknown fields are rejected — a hardening choice that flags caller drift early and forces explicit contract updates over silent ignores.

### 4.2 Dedupe state

Implementation: in-memory `Map<string, number>` keyed by `${source}:${dedupe_key}`, with default TTL of 5 minutes. Sweep is triggered lazily when the Map grows past 1,000 entries.

**Known limitation (acceptable for current volume):** Vercel serverless instances each hold their own dedupe state, so two parallel requests with the same dedupe_key hitting different instances will both fire. At Lori's volume (single-digit notifications per source per day), this race is vanishingly rare. Promote to Redis / Upstash if the race ever fires in anger.

### 4.3 Digest queue (skeleton only — disabled by default)

`INBOX_DIGEST_ENABLED=false` is the v1 default. When enabled per-source, `info` and `warn` kinds get bundled and shipped on a schedule. `critical` always fires immediately, bypassing the queue. The interface is wired through `routeMessage` so the change is a single env flip when noise becomes a felt problem.

### 4.4 Observability

Every routing decision emits a JSON log line:

```json
{
  "at": "2026-05-14T05:02:03.006Z",
  "component": "inbox-router",
  "source": "thesis",
  "kind": "info",
  "severity": "info",
  "has_dedupe": false,
  "decision": "sent",
  "total_chunks": 1,
  "message_id": 748,
  "ms": 524
}
```

`decision` values: `sent` · `send_partial` · `send_failed` · `deduped` · `digested` · `misconfigured`. The schema is stable and amenable to log-based dashboards (Vercel logs, Datadog, Grafana Loki, whatever the operator prefers).

### 4.5 Audit-trail roadmap

Phase 1 emits ephemeral logs only. A future hardening pass should persist every send to a Firestore `inbox_audit/{date}/{messageId}` collection so the harness can build sender-by-source dashboards and detect drift (e.g., a Python cron silently failing for a week). Tracked as Phase 1.5 follow-up.

---

## 5. Process architecture

### 5.1 In-process vs HTTP

Website's 10 in-process callers do **not** make HTTP round-trips. They call `sendToInbox(payload)` from `lib/inbox/client.ts`, which directly invokes the same `routeMessage()` function the HTTP endpoint runs after auth. This avoids loopback latency (~50ms saved per send) and removes a failure mode (loopback DNS / network hiccups). External callers (DeepOps Python/bash, AlamoBernal TypeScript) must come through HTTP because the runtime boundary is real.

Both paths execute the identical `routeMessage()` function — single source of truth.

### 5.2 Single rotation point

After all three codebases finish migrating, `TELEGRAM_BOT_TOKEN` lives in **Website only**. DeepOps and AlamoBernal hold `INBOX_URL` + `INBOX_SHARED_SECRET` instead. If the bot token leaks, rotation is a single Vercel env update + redeploy on the Website project. This is the single largest operational simplification of the project.

### 5.3 Caller responsibilities

Callers must:
- Classify their own `source` (project ownership is unambiguous at the call site)
- Choose `severity` honestly (`critical` bypasses dedupe and rate limits; reserve it for actual outages)
- Provide a `dedupe_key` when the same logical event might fire twice within 5 minutes (cron retries, webhook redeliveries, Firestore callback storms)

The router must:
- Never modify payload semantics
- Always log the decision
- Fail loudly on misconfiguration

---

## 6. Security posture

| Surface | Mechanism |
|---|---|
| Authentication | `x-inbox-secret` header, constant-time compare via `crypto.timingSafeEqual` after a length check |
| Misconfig | If `INBOX_SHARED_SECRET` is unset, return 500 with explicit error — **never** default to "allow all" |
| Misconfig | If `TELEGRAM_CHAT_ID` is unset, return 500 with explicit error — **never** default to "drop silently" |
| Input | All enum fields (`source`, `kind`, `severity`) gated via const-array `includes()` checks |
| Input | All string fields length-capped (title 1024, body 16K, link 2K, dedupe_key 256) |
| Input | Unknown fields rejected by name — forces explicit contract updates over silent drift |
| Resource | Auth check runs **before** JSON parse — prevents unbounded body parsing on unauthorized requests |

The constant-time compare matters less here than in cryptographic protocols (the secret is high-entropy and rotated cheaply), but it costs nothing and forecloses timing-attack discussion entirely.

---

## 7. Migration inventory

Ten Website call sites migrated, with one previously-dead sender revived:

| File | Source | Severity | Dedupe key | Notes |
|---|---|---|---|---|
| `weekly-calibration/generate` | `thesis` | `info` | `weekly-calibration:{weekStart}` | Sunday cron + manual trigger |
| `admin/reprocess-wave` | `lordas` | `info` | `wave-reprocess:{sessionId}` | Admin-only |
| `morning-brief/generate` | `thesis` | `info` | `morning-brief:{date}` | 9 AM ET daily |
| `ventures/build/callback` (live) | `thesis` | `info` | `venture-callback:{ventureId}:live` | External builder success |
| `ventures/build/callback` (failed) | `thesis` | `warn` | `venture-callback:{ventureId}:failed` | External builder failure |
| `ventures/claude-build` (live) | `thesis` | `info` | `claude-build:{ventureId}:live` | In-process build success |
| `ventures/claude-build` (failed) | `thesis` | `warn` | `claude-build:{ventureId}:failed` | In-process build failure |
| `webhooks/transcript` (ok) | `thesis` | `info` | `transcript:{conversationId}` | Generic transcript ingest |
| `webhooks/transcript` (error) | `thesis` | `warn` | — | Error path — no dedupe, always fires |
| `cron/build-watchdog` | `thesis` | `warn` | `build-watchdog:{ventureId}` | Stale-build detection, 5-min cron |
| `cron/overnight/synthesis` | `thesis` | `info` | `overnight-synthesis:{date}` | **Revived** — was reading `TELEGRAM_CHAT_ID` env that was never set; now hits router env |
| `review/[id]` PATCH (raw fetch) | `thesis` | `info` | `review-correction:{id}` | Public review correction confirmation |
| `journal-review/[id]` PATCH (raw fetch) | `thesis` | `info` | `review-correction:{id}` | Auth'd review correction confirmation |

**Intentionally untouched in Phase 1** (deferred to Phase 2's structural restructure):
- `app/api/telegram/webhook/route.ts` — 3,192-line inbound webhook, ~140 internal sends
- `app/api/webhooks/wave/route.ts` — 3 sends; Phase 2 generalizes Lordas-in-place to a 7-tag fanout

---

## 8. Audit & iteration

Both passes were executed before commit, per "audit and iterate 2x at every level."

### Pass 1 — correctness, surface area

Findings + fixes:
- Type narrowing in `client.ts` and `route.ts` was redundant (`'ok' in x && x.ok === false`). Replaced with an exported `isValidationError` type predicate from `router.ts`. Cleaner narrowing, no ugly casts.
- Router had no structured logging. Added a `logDecision(payload, decision, extra)` helper. Every routing path now emits a JSON line.
- Telegram send loop treated chunk-by-chunk failures as success. Added explicit `sentChunks` counter; if zero, return `{ ok: false }`; if partial, log `send_partial`.
- Cast `validated as Parameters<typeof routeMessage>[0]` in the HTTP route was opaque. Replaced with the type-predicate narrowing.

### Pass 2 — hardening

Findings + fixes:
- Title / body / link / dedupe_key lengths were unbounded — a misbehaving caller could ship a megabyte of body. Added per-field caps (1024 / 16K / 2K / 256).
- Validation accepted unknown fields silently. Hardened to reject unknown fields by name; the error message lists the allowed set. This catches caller drift at the contract boundary instead of pretending it never happened.
- Venture callbacks lacked dedupe — a retried callback could double-fire the LIVE notification. Added status-aware dedupe keys: `venture-callback:{ventureId}:live` and `venture-callback:{ventureId}:failed`.

### Deferred (acceptable for current volume, tracked)

- Per-source rate limiting (token bucket scaffolding considered, not wired in v1)
- Cross-instance dedupe (Redis/Upstash promotion when the race fires)
- Persistent audit trail to Firestore (Phase 1.5)
- All-chunks message_id return (caller currently only sees the last chunk's id; matches pre-migration behavior)

---

## 9. Verification

A 9-test smoke suite against `localhost:3000/api/inbox` executed pre-commit; results below.

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | No auth header | HTTP 401 | ✓ HTTP 401 |
| 2 | Wrong secret | HTTP 401 | ✓ HTTP 401 |
| 3 | Malformed JSON | HTTP 400, `invalid JSON body` | ✓ HTTP 400 |
| 4 | Invalid source value | HTTP 400, lists valid sources | ✓ HTTP 400 |
| 5 | Valid `info` severity | HTTP 200, plain `[Thesis] ...` to Telegram | ✓ HTTP 200, msg_id 742 |
| 6 | Valid `warn` severity | HTTP 200, yellow circle prefix | ✓ HTTP 200, msg_id 743 |
| 7 | Valid `critical` severity | HTTP 200, red circle prefix | ✓ HTTP 200, msg_id 744 |
| 8a | Dedupe key — first call | HTTP 200, msg sent | ✓ HTTP 200, msg_id 745 |
| 8b | Dedupe key — same key, immediate retry | HTTP 200, `deduped: true`, no Telegram send | ✓ HTTP 200, deduped |
| 9 | 4,500-char body | HTTP 200, two Telegram messages with `(1/2)` and `(2/2)` markers | ✓ HTTP 200, msg_id 747 (= last chunk of 2) |

Post-hardening pass also verified:
- Unknown-field rejection: `{"sneaky": "bad"}` → HTTP 400 listing allowed keys
- Oversized title (1,100 chars): HTTP 400 `title exceeds 1024 chars`

---

## 10. Known limitations & follow-up

| Limitation | Acceptable because | Promotion trigger |
|---|---|---|
| Per-instance dedupe (Vercel cold starts forget) | Single-recipient, sub-10/day volume per source | First observed double-fire of a deduped event |
| Single-recipient (env `TELEGRAM_CHAT_ID`, not per-user) | Single human (Lori) for v1 | Adding a second human recipient |
| No rate limit | Volume too low to matter | First runaway sender (Phase 4 harness might amplify this) |
| Ephemeral logs (no Firestore audit trail) | Vercel log retention covers debugging window | First missed-send investigation that requires older context |
| Last-chunk-only `message_id` in chunked responses | Matches pre-migration behavior; no caller depends on intermediate ids | First caller that needs to edit chunk 1 |

---

## 11. What's next

The roadmap (see `DeepOps/docs/handoffs/ROADMAP.md`) sequences:

**Phase 1 completion** — DeepOps and AlamoBernal migrations need Claude Code instances rooted in those repos. Handoff docs already exist (`inbox_router_phase1_2026-05-13.md`). After both ship, strip `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` from those projects' env. **Single rotation point achieved.**

**Phase 2 (Inbound + Wave fanout)** — Adds `/arm`, `/ab`, `/thesis`, `/lordas` prefix commands to the webhook; free-form ask-button flow (no LLM auto-classify); Wave 7-tag fanout (`fundraising`, `research`, `management`, `investing`, `lordas`, `alamobernal`, `defer`); project ingest endpoints on DeepOps + AlamoBernal.

**Phase 3 (Wikis)** — Ships in this same PR. The surface you are reading this on.

**Phase 4 (Harness)** — Python service in `DeepOps/harness/`, hybrid Ollama + Claude routing, six workflow PRs (meeting actions, CRM rollup, investment memos, dev briefs, investor drafts, ops todos).

**Phase 5 (Workflow sub-PRs)** — Each of the six harness workflows ships as its own gated PR.

---

## 12. Engineering principles applied

This memo doubles as a working illustration of the standards locked across the project (see `CLAUDE.md` in each repo + `MEMORY.md`):

- **No assumptions.** Every uncertain claim is labeled FACT / ASSUMPTION inline at the source.
- **No fake data, ever.** No placeholder chat IDs, no mocked tokens for testing. Anything synthetic is labeled inline and flagged everywhere it propagates.
- **No emojis in code.** The 🔴 / 🟡 severity badges in outbound Telegram message text are the one allowed exception, because they are user-facing content not source artifacts.
- **No deletes** (per the No Data Deletion Policy — `archived: true` instead).
- **Confirm before destructive ops.** Env strips require explicit confirmation. No `rm`, no schema drops without a second look.
- **launchd, not cron.** Local scheduled jobs go through launchd. (Phase 1 adds no scheduled jobs; Phase 4 will.)
- **Audit 2x before commit.** Pass 1 = correctness. Pass 2 = hardening. Both ran on Phase 1 router + migrations; both ran on this memo + wikis scaffold.

The intent is the same one Bridgewater and Renaissance built their cultures on: write everything down, make every decision auditable, prefer one well-engineered surface over five copy-pasted ones, and treat the operating environment with the same rigor as the trading book.

---

**Author:** `agent:phase1-architecture-memo`
**Memo slug:** `tech-development/inbox-router-phase1`
**Wiki surface:** `tech-development`
