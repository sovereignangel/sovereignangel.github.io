# Thesis Engine Setup Guide
**Zero-cost Bridgewater-style life portfolio management system**

---

## Quick Start

This guide will walk you through setting up your complete Thesis Engine from scratch. Total time: ~2 hours.

### Cost Breakdown
- **Phase 1 (Now)**: $0/month using Groq free tier
- **Phase 2 ($6k MRR)**: $2/month with Together.ai for weekly synthesis
- **Phase 3 ($10k MRR)**: $5/month with Claude for monthly deep intelligence

---

## Phase 1: API Setup (30 minutes)

### 1. Groq API (Free - Required)

**Sign up**: https://console.groq.com/signup

1. Create account (free)
2. Navigate to "API Keys"
3. Create new key
4. Copy to `.env.local`:
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```

**What it does**: Powers all LLM intelligence (daily reflections, weekly synthesis, monthly reviews) using Llama 3.1 70B

---

### 2. Supabase (Free tier - Required)

**Sign up**: https://supabase.com/dashboard

1. Create new project
2. Wait for database to spin up (~2 minutes)
3. Go to Project Settings → API
4. Copy URL and keys to `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

**Run the schema**:
1. Go to SQL Editor in Supabase dashboard
2. Open `supabase/schema.sql` from this repo
3. Copy entire file
4. Paste and click "Run"
5. Verify tables created (check "Table Editor")

**What it does**: Stores all your data (metrics, goals, reflections, insights)

---

### 3. Garmin Connect API (Free - Required)

**You already have**: Your Garmin account

**Add to `.env.local`**:
```bash
GARMIN_EMAIL=your_email@example.com
GARMIN_PASSWORD=your_garmin_password
```

**What it syncs**:
- VO2 Max (daily)
- Resting heart rate
- HRV (heart rate variability)
- Sleep hours + score
- Body battery
- Steps, active minutes
- Training load
- Recovery time

**Syncs**: Automatically at 5am daily

---

### 4. Google Calendar API (Free - Required for time tracking)

**Enable API**:
1. Go to: https://console.cloud.google.com/
2. Create new project (or select existing)
3. Enable "Google Calendar API"
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret

**Get refresh token**:
```bash
# Add to .env.local first:
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Then run locally:
npm run dev

# Visit: http://localhost:3000/api/auth/google/authorize
# Follow OAuth flow
# Copy the refresh token shown
```

**Color-code your calendar**:
- **Red (11)**: Deep work (coding, research, writing)
- **Blue (9)**: Meetings (calls, meetings)
- **Green (10)**: Learning (courses, reading)
- **Yellow (5)**: Fitness (workouts, training)
- **Purple (3)**: Social (dates, networking)
- **Gray (8)**: Recovery (rest, leisure)

**What it syncs**: Daily time allocation by category

**Syncs**: Automatically at 5am daily

---

### 5. Chess.com API (Free - No auth required)

**Add to `.env.local`**:
```bash
CHESS_COM_USERNAME=your_chess_username
```

**What it syncs**:
- Rapid/Blitz/Bullet ratings
- Games played today
- Average accuracy
- Daily progress toward 1800 ELO goal

**Syncs**: Automatically at 5am daily

---

### 6. Stripe API (Free - Required for revenue tracking)

**Get API key**:
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy "Secret key" (starts with `sk_live_` or `sk_test_`)

**Add to `.env.local`**:
```bash
STRIPE_SECRET_KEY=sk_live_your_key
```

**What it syncs**:
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Daily revenue
- Active subscriptions
- New customers
- Churn

**Syncs**: Automatically at 5am daily

---

### 7. GitHub API (Free - Optional but recommended)

**Create token**:
1. Go to: https://github.com/settings/tokens/new
2. Select scopes: `repo`, `read:user`
3. Generate token

**Add to `.env.local`**:
```bash
GITHUB_TOKEN=ghp_your_token
GITHUB_USERNAME=your_github_username
```

**What it syncs**:
- Commits per day
- Pull requests created
- Issues closed
- Lines of code added/deleted
- Active repositories

**Syncs**: Automatically at 5am daily

---

### 8. Wave.ai Integration (Optional - for voice input)

**You already have**: Wave.ai subscription

**Setup Dropbox**:
1. Go to: https://www.dropbox.com/developers/apps
2. Create app → Scoped access → App folder
3. Generate access token

**Add to `.env.local`**:
```bash
DROPBOX_ACCESS_TOKEN=your_token
WAVE_AI_FOLDER_PATH=/Apps/Wave/transcripts
```

**Configure Wave.ai**:
1. Open Wave.ai settings
2. Set auto-export to Dropbox
3. Folder: `/Apps/Wave/transcripts`
4. Use file naming conventions:
   - `daily-YYYY-MM-DD.txt` → Daily reflection
   - `signal-YYYY-MM-DD-HHmm.txt` → Quick insight
   - `goal-chess-YYYY-MM-DD.txt` → Goal-specific note

**What it does**: Automatically processes voice reflections with Groq LLM, extracts insights, saves to database

**Processes**: Every hour via cron job

---

### 9. Cron Secret (Required for security)

**Generate random secret**:
```bash
openssl rand -base64 32
```

**Add to `.env.local`**:
```bash
CRON_SECRET=your_random_secret_here
```

**What it does**: Secures your cron job endpoints from unauthorized access

---

## Phase 2: Deploy to Vercel (10 minutes)

### 1. Push to GitHub

```bash
git add .
git commit -m "Setup Thesis Engine"
git push origin master
```

### 2. Deploy to Vercel

1. Go to: https://vercel.com/new
2. Import your repository
3. Add all environment variables from `.env.local`
4. Deploy

**Cron jobs will auto-activate** (configured in `vercel.json`):
- **5am daily**: Sync all data (Garmin, Calendar, Chess, Stripe, GitHub)
- **Every hour**: Process Wave.ai voice transcripts
- **6am daily**: Aggregate signals (existing)
- **6:15am daily**: Generate daily report (existing)

---

## Phase 3: Backfill Data (20 minutes)

Once deployed, backfill historical data:

```bash
# Backfill last 30 days
curl -X POST https://your-app.vercel.app/api/cron/backfill \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```

This will populate your dashboard with 30 days of historical data.

---

## Phase 4: Daily Usage

### Morning Routine (5 minutes)

1. **Check dashboard** at `/thesis`
   - View overnight data sync
   - Review reward score (g*)
   - Identify any ruin risks (components approaching zero)

2. **Review Intelligence tab**
   - Read daily LLM synthesis
   - Check high-priority signals
   - Review action items

3. **Check Goals tab**
   - See progress toward 19 goals
   - Verify you're on track
   - Adjust systems if needed

### Throughout the Day

**Capture signals via Wave.ai**:
- Quick insights: "Signal - I just realized that..."
- Patterns: "Signal - I keep noticing..."
- Warnings: "Signal - This is concerning..."

**Your transcripts auto-process hourly** → analyzed by Groq → saved to database → appear in Intelligence tab

### Evening Routine (5 minutes)

**Daily reflection via Wave.ai**:
```
"Daily reflection for February 12th.

Energy today was 7 out of 10. Felt good after morning workout.

Wins: Shipped the new pricing page, had productive call with potential client, solved the authentication bug.

Struggles: Got distracted by Twitter for an hour, should have batched that.

Insights: I notice I'm most productive 9-11am. Need to protect that time.

Tomorrow: Block 9-11am for deep work, reach out to 5 prospects, finish the dashboard UI."
```

Save as: `daily-2026-02-12.txt` → Auto-processes → Extracts structured insights → Updates your coherence and fragmentation scores

---

## Phase 5: Weekly Review (30 minutes)

Every Sunday, Groq synthesizes your week:
- Patterns across 7 days of reflections
- Ruin risks (any components trending toward zero)
- Coherence assessment (actions vs stated goals)
- Fragmentation trend (focus improving or degrading)
- Specific recommendations

**Access via**: `/thesis/intelligence` → Weekly Synthesis tab

---

## Phase 6: Monthly Review (1 hour)

Last day of each month:
- Deep analysis of all metrics
- Goal progress review (19 goals)
- System effectiveness audit
- Strategic adjustments

**When revenue hits $10k/month**: Upgrade to Claude Opus for even deeper monthly intelligence

---

## Data Flow Architecture

```
5:00am → Sync all APIs (Garmin, Calendar, Chess, Stripe, GitHub)
         ↓
         Database updated with yesterday's metrics
         ↓
6:00am → Daily LLM synthesis (Groq Llama 70B)
         ↓
         Reward components calculated
         ↓
         Dashboard live with fresh data

Hourly  → Wave.ai folder check
         ↓
         New transcripts found?
         ↓
         Process with Groq → Extract insights → Save to DB
```

---

## Monitoring & Debugging

### Check Sync Status

```bash
# View recent syncs
curl https://your-app.vercel.app/api/sync-status \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Manual Trigger

```bash
# Sync specific date
curl -X POST https://your-app.vercel.app/api/cron/sync-daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-02-12"}'
```

### View Logs

Vercel Dashboard → Your Project → Functions → `/api/cron/sync-daily` → Logs

---

## Upgrade Path

### At $6k/month MRR:

Add Together.ai for weekly synthesis:
```bash
# .env.local
TOGETHER_API_KEY=your_key  # $2/month
```

Uses Llama 3.1 405B for weekly reviews (10-15% deeper insights)

### At $10k/month MRR:

Add Claude for monthly reviews:
```bash
# .env.local
ANTHROPIC_API_KEY=your_key  # $3/month
```

Uses Claude Opus for monthly deep intelligence (best-in-class reasoning)

---

## Troubleshooting

### Garmin sync fails
- Check credentials in `.env.local`
- Garmin may require 2FA → use app password
- Rate limited? Wait 1 hour

### Calendar sync fails
- Refresh token expired → re-run OAuth flow
- Check color mappings in `lib/etl/calendar.ts`
- Verify calendar permissions

### Voice processing not working
- Check Dropbox token is valid
- Verify Wave.ai is saving to correct folder
- Check file naming conventions
- View logs: `/api/cron/process-voice`

### No data in dashboard
- Run backfill: `/api/cron/backfill`
- Check sync status table in Supabase
- Verify cron jobs are active in Vercel

---

## Support

- **Documentation**: Read all `.md` files in repo root
- **Database schema**: `supabase/schema.sql`
- **ETL code**: `lib/etl/`
- **Voice processing**: `lib/voice/`
- **Dashboard UI**: `app/thesis/`, `components/thesis/`

---

## Next Steps

1. ✅ Complete API setup (this guide)
2. ✅ Deploy to Vercel
3. ✅ Backfill 30 days of data
4. 🎯 Use daily for 7 days → establish baseline
5. 📊 Review after 1 month → decide on LLM upgrades
6. 🚀 Scale revenue → unlock better intelligence tiers

---

**You now have**: A complete, zero-cost Bridgewater-style command center with automated data collection, LLM-powered intelligence, and systematic progress tracking toward $10M+ net worth.

**Start building.**
