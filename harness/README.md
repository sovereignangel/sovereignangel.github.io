# Alfred Harness (Phase 4 — scaffold)

> **Status:** Empty scaffold. Phase 4 work has NOT begun. This directory holds the planned tree so future work walks into an oriented frame instead of building structure from scratch.
>
> **Authoritative spec:** `/Users/loricorpuz/DeepOps/docs/handoffs/harness_phase4_2026-05-14.md`. Read that first — this README is the quickstart, not the design.
>
> **Home decision (2026-05-15):** harness lives in Website, not DeepOps. Website is Lori's personal "operating system" hosting Thesis Engine + Telegram router + wikis + all her apps (Lordas, manifold, atune, arete, etc.). The harness is cross-project by definition (reads from Website Firestore, DeepOps Supabase, AB Supabase) and shouldn't live inside any single fund's repo. AB is a paying client; data flow through neutral infra is audit-clean.
>
> **Vercel is unaffected.** Vercel ignores `harness/` (not under `app/` or any Next.js-tracked path). Python files run on launchd locally (v1) or Cloud Run (v2). Mixed-language repo is intentional.

## What this is

The persistent "Alfred" agent that consumes the queues built in Phases 1–2 (Telegram outbound router + inbound prefix-or-ask dispatch) and produces structured output via Phase 3 wikis + targeted artifacts (memos, dev briefs, investor comms drafts).

- **Reads from:**
  - `research_requests` table in DeepOps Supabase (via `/api/inbox-ingest` from Website)
  - `research_requests` table in AlamoBernal Supabase (same)
  - `users/{uid}/inbox_messages` Firestore in Website (for `thesis` + `lordas` sources)
  - `meetings` table in DeepOps + AB Supabase (via Wave fanout, Phase 2B)
- **Writes to:**
  - Wikis API on Website (`PUT /api/wikis/<slug>` with `INBOX_SHARED_SECRET` auth + `updatedBy: 'agent:<workflow>'`)
  - `ops_todos` table in DeepOps Supabase (new — Phase 4)
  - Gmail drafts (via MCP) — **drafts only, never auto-send**
  - Telegram alerts via Website's `/api/inbox`
- **Hybrid model routing:** Ollama (local, free) for cheap repetitive work; Claude API (Sonnet 4.6 / Opus 4.7) for premium output

## Why Phase 4 is blocked right now

Per `/Users/loricorpuz/DeepOps/docs/handoffs/ROADMAP.md` (the multi-phase Alfred index — kept in DeepOps for historical continuity; will move to Website when Phase 4 actively starts):

| Dep | State | Blocks |
|---|---|---|
| Phase 1 — outbound router | ✅ Done (2026-05-15) | — |
| Phase 2A — inbound router + queues | 🟡 Built end-to-end 2026-05-15; awaits Supabase migration runs | The "read from queues" part of Alfred |
| Phase 2B — Wave AI 7-tag fanout | ⚪ Not started | The "process Wave transcripts" workflows |
| Phase 3 — Wikis (Karpathy L2) | 🟡 In reconciliation (other agent) | The "write to wikis" part of Alfred |
| Anthropic API billing decision | ❓ Open | Whether Agent SDK uses Claude Max/Pro credits or needs a separate key |
| Ollama installed locally | ❓ Unknown | Local model fallback |

## Planned structure

```
harness/
├── README.md                            ← this file
├── pyproject.toml                       ← Python package config (not installed yet)
├── alfred/
│   ├── __init__.py
│   ├── runner.py                        ← main poll loop, queue → workflow dispatch
│   ├── config.py                        ← env config, model routing thresholds
│   ├── models/
│   │   ├── __init__.py
│   │   ├── ollama.py                    ← local model client (http://localhost:11434)
│   │   ├── claude.py                    ← Anthropic SDK wrapper
│   │   └── routing.py                   ← picks model per workflow + escalation policy
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── supabase.py                  ← DeepOps + AB Supabase R/W (whitelisted tables)
│   │   ├── firestore.py                 ← Website Firestore R/W via firebase-admin
│   │   ├── wave.py                      ← Wave API client (port from Website webhook)
│   │   ├── gmail.py                     ← Gmail MCP wrapper (drafts only)
│   │   ├── polygon.py                   ← reuse from core/
│   │   ├── wikis.py                     ← PUT /api/wikis/<slug>
│   │   └── inbox.py                     ← POST /api/inbox for outbound alerts
│   ├── workflows/
│   │   ├── __init__.py
│   │   ├── base.py                      ← Workflow ABC: name, model, run()
│   │   ├── meeting_actions.py           ← 4a: Wave transcript → action items
│   │   ├── crm_rollup.py                ← 4b: journal entry → CRM contact wiki
│   │   ├── memo.py                      ← 4c: Telegram /arm memo <ticker> → investment memo
│   │   ├── dev_brief.py                 ← 4d: git log → daily dev brief
│   │   ├── investor_draft.py            ← 4e: /arm draft <recipient> → Gmail draft
│   │   └── todo_extract.py              ← 4f: text → ops_todos
│   └── tests/
│       ├── test_routing.py
│       └── test_workflows.py
├── prompts/                              ← versioned per CLAUDE.md prompt-versioning rule
│   ├── meeting_actions/v1.md
│   ├── crm_rollup/v1.md
│   ├── memo/v1.md
│   ├── dev_brief/v1.md
│   ├── investor_draft/v1.md
│   └── todo_extract/v1.md
└── scripts/
    └── run_alfred.sh                     ← launchd entry point
```

## Hard constraints (locked across all Phase 4 work)

Per [`../CLAUDE.md`](../CLAUDE.md) (Website project guide) and the phase 4 handoff doc:

- **No deletes, ever.** Per the No Data Deletion Policy.
- **No auto-sends** (email, trade, anything externally visible). Drafts only — Lori reviews and sends.
- **No auto-execute trades.** Zero IBKR/broker access. Trade-related workflows produce recommendations only.
- **No schema mutations.** No `ALTER TABLE`, no `CREATE TABLE` from the harness.
- **No fake/sample data.** Per the No Fake Data Policy.
- **Token budgets per workflow.** Crash loudly if exceeded — don't silently truncate.
- **Prompt versioning.** Every prompt file at `prompts/<workflow>/v<N>.md`. Never edit released versions in place; copy to v(N+1) and bump.
- **Every LLM call logs** workflow, model, prompt_version, input_token_count, output_token_count, cost_estimate, escalation_reason — to a `harness_invocations` table (new).

## Quickstart for whoever picks up Phase 4

1. **Read first:** `/Users/loricorpuz/DeepOps/docs/handoffs/harness_phase4_2026-05-14.md` — the full spec
2. **Verify prerequisites** (per the "Why Phase 4 is blocked" table above)
3. **Resolve open questions** (Python vs TypeScript, Ollama model sizes, Anthropic billing model, Cloud Run timing)
4. **Workflow build order** (recommended): 4a (meeting actions) → 4b (CRM rollup) → 4d (dev brief) → 4c (memo) → 4f (todo extract) → 4e (investor draft). Each workflow is its own PR; don't try to ship all six in one.
5. **Test plan** — see phase 4 handoff doc "Test plan" section. Unit tests for routing + Ollama fallback; integration tests for each workflow against staging data.

## Recommended decisions (defer to actual Phase 4 owner)

- **Language:** Python — DeepOps is Python-heavy (`core/`, `scripts/`) so harness can call into that codebase for shared logic; Anthropic's Python SDK is mature.
- **Location (decided 2026-05-15):** `/Users/loricorpuz/Website/harness/` — Website is Lori's personal "operating system" hosting all her apps. Harness joining that family matches the reality that it's a cross-project meta-harness, not a DeepOps-specific tool.
- **Hosting v1:** launchd on Lori's Mac (`~/Library/LaunchAgents/com.loricorpuz.alfred.plist`). Migrate to Cloud Run later when laptop-on becomes a felt problem.
- **Default model:** Ollama llama3.1:8b for cheap workflows; escalate to Claude Sonnet 4.6 on confidence-low; Opus 4.7 for memos + investor comms only.
- **Cost ceiling:** est. $15–60/month at projected volume (80% Ollama, 15% Sonnet, 5% Opus).

## What this scaffold does NOT include

- Any runnable code. Stubs only. All real work is Phase 4.
- A virtual environment, installed dependencies, or anything that runs on `python -m alfred.runner`.
- Real prompts. Each `prompts/<workflow>/v1.md` is empty until that workflow ships.
- launchd plist. Stays in `~/Library/LaunchAgents/` per existing convention; built when 4a ships.
