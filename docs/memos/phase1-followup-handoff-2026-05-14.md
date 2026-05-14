# Phase 1 Follow-up Handoff — DeepOps + AlamoBernal Migrations

> Written 2026-05-14. Phase 1 outbound router shipped in Website repo at commit `d9b1e7c`. The remaining work — migrating the 6 senders living in DeepOps (4) and AlamoBernal (2) — must be done in fresh Claude Code instances rooted in those codebases. This document is the prompt.

## What's done

- `POST https://loricorpuz.com/api/inbox` is live (returns 401 on unauthorized — verified 2026-05-14).
- 10 Website call sites migrated to `sendToInbox` from `@/lib/inbox/client`. Bot token still required in Website env (the router uses it internally).
- Architectural memo seeded (or seedable via `/thesis/wikis/seed`) at the slug `tech-development/inbox-router-phase1-2026-05-14`. Read it before touching any of this code.

## What this follow-up needs to do

Two separate Claude Code instances, run sequentially or in parallel:

### DeepOps (`/Users/loricorpuz/DeepOps`)

1. **Confirm env vars.** Set in DeepOps's `.env.local` and Vercel (Production + Preview + Development):
   - `INBOX_URL=https://loricorpuz.com/api/inbox`
   - `INBOX_SHARED_SECRET=<same value as Website>`
2. **Build clients.**
   - `core/notify.py` — Python `send_to_inbox(source, kind, severity, title, body=None, link=None, dedupe_key=None)`. Reads `INBOX_URL` and `INBOX_SHARED_SECRET` from env. Hardcoded `source="armstrong"` is acceptable — it's always armstrong from DeepOps.
   - `scripts/lib/notify.sh` — bash equivalent for the 3 bash senders. Single function `send_to_inbox()` callable from any script.
3. **Migrate 4 existing senders.**
   - `scripts/run_alpha_engine_cron.sh:21-28` — replace inline `send_telegram()` with `source lib/notify.sh; send_to_inbox`
   - `scripts/refresh_jpm_pipeline.sh:38-46` — same
   - `scripts/pipeline_watchdog.sh:22-29` — same
   - `core/daily_data_processor.py:116-131` — replace `send_telegram_alert()` body with `notify.send_to_inbox()`. Keep the function signature so callers don't break.
4. **Verify** by triggering each launchd job manually:
   - `launchctl start com.loricorpuz.alpha-engine`
   - The two refresh + watchdog jobs (whichever launchd labels they have)
   - Confirm Telegram arrives with `[Armstrong]` prefix and the correct severity badge.
5. **Strip `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`** from DeepOps's `.env.local`, `.env.example`, and any launchd `.plist` files. **Ask the principal before deleting** — these may be referenced in places the inventory doesn't capture.

### AlamoBernal (`/Users/loricorpuz/alamobernal` — lowercase)

1. **Confirm env vars.** Same as DeepOps:
   - `INBOX_URL=https://loricorpuz.com/api/inbox`
   - `INBOX_SHARED_SECRET=<same value>`
2. **Replace `lib/alamo-bernal/telegram.ts` body** — keep the exported function signature(s) so call sites don't change. Internal `fetch('api.telegram.org')` becomes a POST to `INBOX_URL` carrying `source: "alamo-bernal"` plus the `x-inbox-secret` header.
3. **Verify** by triggering each Vercel cron manually. Confirm Telegram arrives with `[Alamo Bernal]` prefix.
4. **Strip `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`** from AlamoBernal's envs. Ask first.

## Outcome when both ship

Single rotation point for the bot token, in Website only. Three independent rotation events collapse to one. The bot credential's blast radius is minimized.

## What NOT to do

- Do not modify Website's `lib/telegram.ts` — it remains the internal sink used by `lib/inbox/router.ts`.
- Do not modify Website's `app/api/telegram/webhook/route.ts` (3192-line inbound handler — Phase 2 territory).
- Do not modify Website's `app/api/webhooks/wave/route.ts` (Phase 2 will restructure it for the 7-tag fanout).
- Do not add LLM auto-classification anywhere — the principal explicitly declined this.

## Reference

- Phase 1 architectural primer (wiki entry): `https://loricorpuz.com/thesis/wikis/tech-development/inbox-router-phase1-2026-05-14`
- Phase 1 build commit (Website): `d9b1e7c`
- Original Phase 1 handoff: `/Users/loricorpuz/DeepOps/docs/handoffs/inbox_router_phase1_2026-05-13.md`
- Roadmap index: `/Users/loricorpuz/DeepOps/docs/handoffs/ROADMAP.md`
- Persistent memory: `/Users/loricorpuz/.claude/projects/-Users-loricorpuz-DeepOps/memory/`

## When done

- Update [ROADMAP.md](../../../DeepOps/docs/handoffs/ROADMAP.md) Phase 1 status to fully shipped.
- Append a "lessons learned" section to the wiki entry above (auth via `INBOX_SHARED_SECRET` against `/api/wikis/[...slug]` PUT, with `updatedBy: 'agent:phase1-followup'`).
- Write the Phase 2 handoff stub if not already present: `/Users/loricorpuz/DeepOps/docs/handoffs/inbox_router_phase2_<date>.md`.
