"""Per-workflow model selection + escalation policy. See harness_phase4 handoff
"Per-workflow model selection" table for the routing matrix.

Default tier: Ollama (free). Escalate to Claude Sonnet 4.6 on confidence-low or
no-schema-match. Opus 4.7 reserved for memos + investor comms (explicit tier).

Phase 4 scaffold — implementation TBD. See README.md.
"""
