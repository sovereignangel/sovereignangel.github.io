"""Anthropic SDK wrapper. Wraps anthropic.Anthropic().messages.create() with the
harness's logging contract (per-call: workflow, model, prompt_version, input/output
tokens, cost_estimate, escalation_reason → harness_invocations table).

Phase 4 scaffold — implementation TBD. See README.md.
"""
