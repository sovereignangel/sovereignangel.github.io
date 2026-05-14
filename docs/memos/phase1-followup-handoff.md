# Phase 1 — Follow-up handoff (DeepOps + AlamoBernal)

**Status:** Required to complete Phase 1
**Date authored:** 2026-05-14
**Triggered by:** Website-side Phase 1 shipped at commit `d9b1e7c`

## What is shipped

Website (`loricorpuz.com`) has:
- `POST /api/inbox` — outbound router endpoint
- `lib/inbox/{router,client,dedupe,digest,types}.ts` — pure routing logic
- 10 in-process Website call sites migrated to `sendToInbox` (8 lib/telegram.ts callers + 2 raw-fetch bypasses)
- Previously-dead `cron/overnight/synthesis` sender revived (now hits router env-based chat ID)
- Phase 3 wikis surface at `/thesis/wikis` with the architectural primer at `tech-development/inbox-router-phase1-2026-05-14`
- Two-pass audit applied to both Phase 1 router and Phase 3 wikis

## What is NOT shipped (this doc covers the remaining work)

Two repositories still hold their own Telegram bot tokens and ad-hoc senders:

1. **DeepOps** (`/Users/loricorpuz/DeepOps`) — 4 senders (3 bash + 1 Python)
2. **AlamoBernal** (`/Users/loricorpuz/alamobernal`) — 2 Vercel-cron senders

Both need to be migrated to `POST https://www.loricorpuz.com/api/inbox` (note the `www.` prefix — Vercel redirects bare `loricorpuz.com`) and then have `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` stripped from their envs.

## Why this needs a separate Claude Code instance per repo

The Phase 1 Website work was authored from a Claude Code session rooted at `/Users/loricorpuz/Website`. Editing the DeepOps and AlamoBernal trees from this same session is possible but mixes work across contexts and complicates per-repo PR scope, brand rules, and `CLAUDE.md` guardrails.

Recommended: spawn one Claude Code instance per repo, hand it the relevant section of this doc as the spec.

---

## Pre-flight: env vars to set in each downstream repo

| Env var | DeepOps | AlamoBernal | Source of truth |
|---|---|---|---|
| `INBOX_URL` | **add** | **add** | `https://www.loricorpuz.com/api/inbox` |
| `INBOX_SHARED_SECRET` | **add** (must match Website Vercel value) | **add** | Same value Lori already set in Website Vercel + Website `.env.local` |
| `TELEGRAM_BOT_TOKEN` | **remove after migration verified** | **remove after migration verified** | Was the in-tree credential |
| `TELEGRAM_CHAT_ID` | **remove after migration verified** | **remove after migration verified** | Was the in-tree recipient |

**Verification required before stripping:** make a test POST from each codebase to the new router and confirm the message arrives in Telegram with the correct source prefix (`[Armstrong]` for DeepOps, `[Alamo Bernal]` for AlamoBernal). Only after that, remove the in-tree bot creds.

**Important — production env on Vercel:** the Phase 1 prod smoke test on 2026-05-14 returned 401 even when posting with the local `INBOX_SHARED_SECRET`. Two plausible causes:
1. Vercel's `INBOX_SHARED_SECRET` value differs from local `.env.local`
2. `TELEGRAM_CHAT_ID` is unset in Vercel — without it the router returns 500 "inbox chat id not configured" even after auth passes

**Action for Lori before downstream migrations:** confirm in Vercel that the Website project has both `INBOX_SHARED_SECRET` (same value as `.env.local`) and `TELEGRAM_CHAT_ID=489068882`. Verify by curling:

```bash
SECRET="<the-prod-value>"
curl -X POST https://www.loricorpuz.com/api/inbox \
  -H "content-type: application/json" \
  -H "x-inbox-secret: $SECRET" \
  -d '{"source":"thesis","kind":"info","severity":"info","title":"Prod check","body":"verifying env vars"}'
# Expect: HTTP 200, {"ok":true,"message_id":N}
# If 401: secret mismatch
# If 500 "inbox chat id not configured": TELEGRAM_CHAT_ID unset
```

---

## DeepOps migration spec

**Repo:** `/Users/loricorpuz/DeepOps`
**Default branch:** `main` (per ROADMAP cross-cutting decisions — DeepOps differs from Website which uses `master`)

### Files to create

#### `core/notify.py`

```python
"""Outbound notifier — POSTs to the central inbox router on Website."""
import os
import json
import urllib.request
import urllib.error
from typing import Optional, Literal

InboxKind = Literal['alert', 'signal', 'info', 'digest_item']
InboxSeverity = Literal['critical', 'warn', 'info']


def send_to_inbox(
    title: str,
    body: Optional[str] = None,
    link: Optional[str] = None,
    kind: InboxKind = 'info',
    severity: InboxSeverity = 'info',
    dedupe_key: Optional[str] = None,
) -> dict:
    """Send to the central inbox router. source is always 'armstrong' from DeepOps."""
    url = os.environ.get('INBOX_URL', 'https://www.loricorpuz.com/api/inbox')
    secret = os.environ.get('INBOX_SHARED_SECRET')
    if not secret:
        raise RuntimeError('INBOX_SHARED_SECRET not set — refusing to send')

    payload = {
        'source': 'armstrong',
        'kind': kind,
        'severity': severity,
        'title': title,
    }
    if body:
        payload['body'] = body
    if link:
        payload['link'] = link
    if dedupe_key:
        payload['dedupe_key'] = dedupe_key

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'content-type': 'application/json',
            'x-inbox-secret': secret,
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'inbox HTTP {e.code}: {body}') from e
```

#### `scripts/lib/notify.sh`

```bash
#!/usr/bin/env bash
# Outbound notifier for bash scripts. source is always 'armstrong'.
# Usage: send_to_inbox "title" "body" "info|warn|critical" "dedupe_key"

send_to_inbox() {
  local title="$1"
  local body="${2:-}"
  local severity="${3:-info}"
  local dedupe_key="${4:-}"
  local kind="info"
  [[ "$severity" == "warn" || "$severity" == "critical" ]] && kind="alert"

  local url="${INBOX_URL:-https://www.loricorpuz.com/api/inbox}"
  if [[ -z "${INBOX_SHARED_SECRET:-}" ]]; then
    echo "send_to_inbox: INBOX_SHARED_SECRET not set, skipping" >&2
    return 1
  fi

  local payload
  payload=$(jq -nc \
    --arg title "$title" \
    --arg body "$body" \
    --arg severity "$severity" \
    --arg kind "$kind" \
    --arg dedupe_key "$dedupe_key" \
    '{source: "armstrong", kind: $kind, severity: $severity, title: $title}
     | if $body != "" then . + {body: $body} else . end
     | if $dedupe_key != "" then . + {dedupe_key: $dedupe_key} else . end')

  curl -sS -X POST "$url" \
    -H "content-type: application/json" \
    -H "x-inbox-secret: $INBOX_SHARED_SECRET" \
    -d "$payload"
}
```

### Files to modify

| File | Lines (per Phase 1 doc inventory) | Replace |
|---|---|---|
| `scripts/run_alpha_engine_cron.sh` | 21-28 | Replace inline `send_telegram()` with `source lib/notify.sh; send_to_inbox` |
| `scripts/refresh_jpm_pipeline.sh` | 38-46 | Same |
| `scripts/pipeline_watchdog.sh` | 22-29 | Same |
| `core/daily_data_processor.py` | 116-131 | Replace `send_telegram_alert()` body with `from core.notify import send_to_inbox; send_to_inbox(...)`. Keep function signature so callers don't break. |

### Verification

1. Locally trigger each cron via `launchctl start com.loricorpuz.alpha-engine` (or the equivalent for each script). Confirm Telegram message arrives with `[Armstrong]` prefix and correct severity.
2. After all four senders verified, remove `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` from:
   - Vercel env (Production + Preview + Development)
   - Local `.env` / `.env.local`
   - Any `.env.example` documentation
   - launchd plist files in `~/Library/LaunchAgents/com.loricorpuz.*` — grep for `TELEGRAM_` to be sure

---

## AlamoBernal migration spec

**Repo:** `/Users/loricorpuz/alamobernal` (lowercase per filesystem)
**Stack:** Next.js 14 + Supabase

### Files to modify

#### `lib/alamo-bernal/telegram.ts`

Keep the exported function signature(s) so call sites don't change. Replace internals to POST `INBOX_URL` with `source: 'alamo-bernal'`:

```typescript
const INBOX_URL = process.env.INBOX_URL || 'https://www.loricorpuz.com/api/inbox'

export async function sendTelegramMessage(
  _chatId: number | string,  // ignored — router uses env-based chat id
  text: string,
  _options?: { parseMode?: string },
): Promise<number | null> {
  const secret = process.env.INBOX_SHARED_SECRET
  if (!secret) {
    console.warn('INBOX_SHARED_SECRET not set — skipping send')
    return null
  }

  // Use first line as title, rest as body — best preservation of existing message shape
  const lines = text.split('\n')
  const title = lines[0].slice(0, 200)
  const body = lines.slice(1).join('\n').trim() || undefined

  const res = await fetch(INBOX_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-inbox-secret': secret,
    },
    body: JSON.stringify({
      source: 'alamo-bernal',
      kind: 'info',
      severity: 'info',
      title,
      ...(body ? { body } : {}),
    }),
  })

  if (!res.ok) {
    console.error(`inbox HTTP ${res.status}: ${await res.text()}`)
    return null
  }
  const data = await res.json()
  return data.message_id ?? null
}
```

### Verification

1. Trigger each Vercel-cron call site manually (via Vercel dashboard's "Run" button on the cron). Confirm Telegram message arrives with `[Alamo Bernal]` prefix.
2. After both senders verified, remove `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` from Vercel env + local `.env.local`.

---

## When all three migrations land

1. Bot token rotates by editing one env var on one Vercel project (Website). No coordinated rotation across repos.
2. The full Phase 1 inventory table in `DeepOps/docs/handoffs/telegram_router_2026-05-13.md` "Current state" section gets the senders count zeroed for DeepOps and AlamoBernal, and the helper module column gets `→ /api/inbox` for both.
3. Mark Phase 1 `✅ Done` in `DeepOps/docs/handoffs/ROADMAP.md`.
4. Phase 2 (inbound prefix-or-ask router + Wave 7-tag fanout) is unblocked. Spec is at `DeepOps/docs/handoffs/inbox_router_phase2_2026-05-14.md`.

---

## Notes for the next Claude Code instance

- Read `DeepOps/docs/handoffs/inbox_router_phase1_2026-05-13.md` first — it has architecture decisions and project taxonomy that this doc references but doesn't re-derive.
- Confirm with Lori before stripping any env var — destructive ops require explicit confirmation per `CLAUDE.md`.
- The DeepOps repo uses `main` as default branch. The Website repo uses `master`. AlamoBernal uses `master`. Don't conflate.
