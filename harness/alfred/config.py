"""Env config + model routing thresholds. Single source of truth so the rest
of the harness doesn't read os.environ directly.

Phase 4 scaffold. Expected env vars when this gets wired up:
- ANTHROPIC_API_KEY          Claude API access
- INBOX_SHARED_SECRET        auth to Website's /api/inbox + /api/wikis
- INBOX_URL                  default https://www.loricorpuz.com/api/inbox
- WIKIS_API_BASE             default https://www.loricorpuz.com/api/wikis
- SUPABASE_URL               DeepOps Supabase
- SUPABASE_SERVICE_KEY       DeepOps service role
- AB_SUPABASE_URL            AlamoBernal Supabase
- AB_SUPABASE_SERVICE_KEY    AlamoBernal service role
- FIREBASE_ADMIN_CREDENTIALS path to Website Firebase service account JSON
- OLLAMA_BASE_URL            default http://localhost:11434
- LOG_LEVEL                  default INFO
"""
