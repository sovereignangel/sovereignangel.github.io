#!/usr/bin/env bash
# Seed a wiki entry from a local markdown file via POST /api/wikis.
#
# Usage:
#   scripts/seed-wiki-memo.sh <env-file> <api-base-url> <slug> <title> <surface> <md-file>
#
# Example (prod):
#   scripts/seed-wiki-memo.sh .env.prod https://loricorpuz.com \
#     tech-development/inbox-router-phase1 \
#     "Inbox Router — Phase 1 (Outbound Consolidation)" \
#     tech-development \
#     docs/memos/inbox-router-phase1.md
#
# The env file must contain INBOX_SHARED_SECRET=<value>.
# Requires: jq, curl.

set -euo pipefail

ENV_FILE="${1:-.env.local}"
API_BASE="${2:-http://localhost:3000}"
SLUG="${3:?slug required}"
TITLE="${4:?title required}"
SURFACE="${5:?surface required}"
MD_FILE="${6:?md file required}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: env file not found: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$MD_FILE" ]]; then
  echo "ERROR: markdown file not found: $MD_FILE" >&2
  exit 1
fi

SECRET=$(awk -F= '/^INBOX_SHARED_SECRET=/ {sub(/^[^=]*=/, ""); gsub(/^"|"$/, ""); print; exit}' "$ENV_FILE")
if [[ -z "$SECRET" ]]; then
  echo "ERROR: INBOX_SHARED_SECRET not found in $ENV_FILE" >&2
  exit 1
fi

CONTENT_MD=$(cat "$MD_FILE")

PAYLOAD=$(jq -nc \
  --arg slug "$SLUG" \
  --arg title "$TITLE" \
  --arg surface "$SURFACE" \
  --arg contentMd "$CONTENT_MD" \
  '{slug: $slug, title: $title, surface: $surface, contentMd: $contentMd, updatedBy: "agent:phase1-architecture-memo"}')

echo "POST $API_BASE/api/wikis"
echo "slug:    $SLUG"
echo "title:   $TITLE"
echo "surface: $SURFACE"
echo "bytes:   ${#CONTENT_MD}"
echo

curl -sS -X POST "$API_BASE/api/wikis" \
  -H "content-type: application/json" \
  -H "x-inbox-secret: $SECRET" \
  -d "$PAYLOAD" \
  -w "\nHTTP %{http_code}\n"
