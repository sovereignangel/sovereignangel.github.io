# THESIS ENGINE V2: AUTOMATED COMMAND CONTROL
## Implementation Plan for AI-Powered, Data-Driven Life Portfolio Management

**Goal:** Minimize manual input, maximize automated data collection, add LLM-powered pattern recognition and daily reflection synthesis.

---

## PHILOSOPHY: FROM MANUAL LOGGING TO AUTOMATED INTELLIGENCE

**Current State:** You manually log 40+ fields daily (5-10 minutes)
**Target State:** System auto-collects 80% of data, you provide 5 inputs + 1 reflection (2 minutes)

**The Bridgewater Principle:**
> "The best systems are those where humans do what humans do best (reflection, judgment, creativity) and machines do what machines do best (data collection, pattern recognition, systematic execution)."

---

## PART 1: DATA AUTOMATION MATRIX

### 1.1 What Can Be Fully Automated (Zero Manual Input)

| Data Point | Current | Automated Source | Implementation |
|------------|---------|------------------|----------------|
| **Sleep Hours** | Manual entry | Garmin (sleep tracking) | API integration |
| **HRV** | Manual entry | Garmin (HRV tracking) | API integration |
| **Training Type** | Manual entry | Garmin (activity auto-detect) | API integration |
| **VO2 Max** | Manual entry | Garmin (calculated daily) | API integration |
| **VO2 Intervals** | Manual entry | Garmin (running dynamics) | API integration |
| **Zone 2 Distance** | Manual entry | Garmin (HR zones) | API integration |
| **Resting HR** | Manual entry | Garmin (daily calculation) | API integration |
| **Body Composition** | Manual entry | Smart Scale (Withings/Tanita) | API integration |
| **Strength PRs** | Manual entry | Strong App / Hevy / Fitbod | API integration |
| **Calendar Focus Hours** | Manual entry | Google Calendar | API integration |
| **Time Allocation by Project** | Manual entry | Google Calendar (color-coded events) | API integration (parses calendar) |
| **Revenue (Armstrong)** | Manual entry | Stripe / Bank API | API integration |
| **Revenue (Manifold)** | Manual entry | Stripe / Bank API | API integration |
| **GitHub Commits** | Not tracked | GitHub API | Count commits, PRs, LOC |
| **Public Iterations** | Manual boolean | GitHub/Twitter/LinkedIn | Count: commits, tweets, posts |
| **Email Sends** | Not tracked | Gmail API | Count outbound emails (proxy for asks) |
| **Meeting Count** | Not tracked | Google Calendar | Count meetings (proxy for discovery conversations) |
| **Social Engagement** | Not tracked | Twitter/LinkedIn API | Replies, DMs, engagement rate |
| **Website Analytics** | Not tracked | Vercel/Google Analytics | Traffic, conversions |

**Technical Stack:**
- **Garmin Watch** (sleep, HRV, VO2 Max, training, HR zones) - Primary device
- **Wave.ai** (voice memos → transcripts saved to folder) - Voice input system
- **Withings Scale** (weight, body fat %) - Optional but recommended
- **Google Calendar** (time tracking via color-coded events + meetings)
- **Stripe** (revenue)
- **GitHub API** (public iterations)
- **Chess.com API** (ELO tracking for goals)
- **Twitter/LinkedIn APIs** (building in public tracking)

### 1.2 What Needs Manual Input (But Can Be Minimized)

| Data Point | Why Manual | Minimization Strategy |
|------------|------------|----------------------|
| **Daily Reflection** | Core human input | Wave.ai voice memo → saved to folder → LLM processes |
| **Signal Capture** | Requires judgment | Wave.ai voice memo → saved to folder → LLM extracts |
| **What Shipped Today** | Qualitative description | Included in daily reflection voice memo |
| **Revenue Asks** | Context matters | Included in daily reflection voice memo |
| **Nervous System State** | Subjective | Included in daily reflection voice memo |
| **Body Felt** | Somatic awareness | Included in daily reflection voice memo |

**Key Innovation: Wave.ai → Folder Watching System**

**How it works:**
1. **You record voice memo in Wave.ai** (anywhere, anytime - walking, driving, end of day)
2. **Wave.ai saves transcript** to a designated folder (Dropbox/Google Drive/local)
3. **Naming convention determines processing:**
   - `daily-2026-03-15.txt` → Daily reflection (LLM extracts: nervous system, body felt, shipped, asks, insights)
   - `signal-2026-03-15-arbitrage.txt` → Signal capture (LLM extracts: problem, pain point, solution, why broken)
   - `goal-chess-2026-03-15.txt` → Goal update (LLM extracts: progress, obstacles, insights)
4. **System watches folder** (every 5 min or webhook)
5. **LLM processes new files automatically**
6. **Dashboard updates in real-time**

**Benefits:**
- ✅ No app switching (record in Wave.ai, system auto-processes)
- ✅ Works offline (sync when connected)
- ✅ More natural (speak freely vs. filling forms)
- ✅ Flexible (can record 30 sec or 5 min)
- ✅ No Whisper API cost (Wave.ai already transcribes)

**Total Manual Input Time: <2 minutes (just speak into Wave.ai)**

### 1.3 New Automated Metrics (Bridgewater Additions)

| Metric | Data Source | Formula |
|--------|-------------|---------|
| **Time-to-Ruin (Sleep)** | Oura Ring | Days until <5hrs if current trend continues |
| **Time-to-Ruin (Revenue)** | Bank API | Months of runway at current burn rate |
| **Capture Rate** | Stripe ÷ RescueTime | Revenue per focus hour |
| **Signal Win Rate** | Signals DB + Revenue DB | % of signals that led to revenue within 90 days |
| **Compounding Multiplier** | Revenue correlation | Does Armstrong revenue predict fund interest? |
| **Relationship Depth** | Calendar + Email | Deep conversations (>30min meetings) per week |
| **Skill Velocity** | GitHub + Learning platforms | Commits + course completion rate |
| **Physical Capital Trend** | Smart Scale | 7-day moving average of body comp |
| **Volatility (by component)** | All metrics | 7-day rolling std dev of each g* component |
| **Correlation Matrix** | All metrics | Which components move together? |

---

## PART 2: LLM PATTERN RECOGNITION ARCHITECTURE

### 2.1 The Daily Reflection System

**User Experience:**
1. End of day: System prompts "Daily Reflection (2 min)"
2. You speak or type free-form:
   - "What surprised me today?"
   - "What pattern am I seeing?"
   - "What should I do differently tomorrow?"
3. LLM processes reflection → extracts structured insights
4. LLM cross-references with:
   - Your historical reflections
   - Your daily log data
   - Your reward score trajectory
   - Your signal library
5. LLM returns:
   - Pattern recognition: "You've mentioned 'distracted by research' 4 times this month when GE < 0.6"
   - Predictions: "Based on 60 days of data, when you sleep <6.5hrs, your κ drops by 40% next day"
   - Recommendations: "Your GE is at 0.65. Historical data shows this precedes fragmentation. Consider recovery mode."

### 2.2 LLM Integration Points

**4 LLM Agents, Each with Specific Role:**

#### Agent 1: **Reflection Analyzer** (Daily)
- **Input:** Your daily free-form reflection
- **Task:**
  - Extract: Insights, concerns, patterns you noticed
  - Classify: Emotional state, confidence level, decision quality
  - Tag: Which thesis pillars (AI/Markets/Mind) were touched
- **Output:** Structured reflection object stored in DB

#### Agent 2: **Pattern Recognizer** (Weekly)
- **Input:** 7 days of reflections + daily log data
- **Task:**
  - Identify recurring themes ("You mentioned 'asking anxiety' 3 times this week")
  - Spot correlations ("When you train in AM, your κ is 2x higher")
  - Flag anomalies ("You shipped 5x more than usual this week—what changed?")
- **Output:** Weekly pattern report

#### Agent 3: **Prediction Engine** (Daily)
- **Input:** Full historical data (all daily logs, reflections, reward scores)
- **Task:**
  - Build predictive models: "If you're spiked today, 70% chance you fragment tomorrow"
  - Risk forecasting: "Your sleep trend suggests GE collapse in 3 days"
  - Opportunity detection: "Last 3 times you felt like this, you shipped your best work next day"
- **Output:** Daily predictions + risk warnings

#### Agent 4: **Strategy Advisor** (Weekly + On-Demand)
- **Input:** Full system state + your weekly synthesis
- **Task:**
  - Portfolio rebalancing: "Manifold is 15% time but 0% revenue for 8 weeks. Kill or pivot?"
  - Compounding chain analysis: "Armstrong customers aren't converting to fund interest. Missing link: credibility signal."
  - Thesis stress test: "You've touched Mind pillar only 2x this month. Coherence dropping."
- **Output:** Strategic recommendations (not commands—you still decide)

### 2.3 Technical Implementation

**Option A: ChatGPT API (OpenAI)**
```typescript
// Daily Reflection Processing
const reflectionPrompt = `
You are analyzing Lori's daily reflection in the context of her Thesis Engine life portfolio system.

CONTEXT:
- Today's reward score: ${todayScore}
- Today's component breakdown: GE=${GE}, κ=${kappa}, ĠI=${GI}
- 7-day trajectory: ${trajectory}
- Recent reflections: ${recentReflections}

USER REFLECTION:
"${userReflection}"

TASK:
1. Extract key insights (what did she learn?)
2. Identify emotional state (regulated/spiked/neutral)
3. Classify themes (fragmentation/capture/regulation/thesis)
4. Spot patterns (has she mentioned this before?)
5. Generate prediction (what's likely to happen tomorrow based on this state?)

OUTPUT (JSON):
{
  "insights": ["insight 1", "insight 2"],
  "emotionalState": "regulated|spiked|neutral",
  "themes": ["theme1", "theme2"],
  "patterns": ["pattern recognition statement"],
  "prediction": "prediction statement",
  "riskFlags": ["flag1 if any"]
}
`;

const analysis = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: reflectionPrompt }],
  response_format: { type: "json_object" }
});
```

**Option B: Claude API (Anthropic)**
```typescript
// Same prompt structure, but Claude has:
// - Longer context window (better for full historical analysis)
// - Better at nuanced reasoning
// - Safer for personal data (Anthropic's privacy stance)

const analysis = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{ role: "user", content: reflectionPrompt }]
});
```

**Recommendation: Use Claude for reflections (nuance), GPT-4 for structured data extraction (speed)**

### 2.4 Data Schema Extensions

```typescript
// New table: reflections
interface Reflection {
  id: string
  userId: string
  date: string
  rawText: string // User's free-form reflection

  // LLM-extracted structured data
  insights: string[]
  emotionalState: 'regulated' | 'spiked' | 'neutral'
  themes: string[]
  patterns: string[]
  prediction: string
  riskFlags: string[]

  // Meta
  thesisPillarsTouched: ('AI' | 'Markets' | 'Mind')[]
  surprisingInsight: string | null
  actionableNext: string | null

  // LLM metadata
  llmModel: string
  llmConfidence: number
  processingTimestamp: string
}

// New table: pattern_detections
interface PatternDetection {
  id: string
  userId: string
  detectedAt: string
  patternType: 'recurring_theme' | 'correlation' | 'anomaly' | 'risk'

  description: string
  evidence: string[] // References to specific reflections/logs
  confidence: number

  // If correlation
  correlation?: {
    variable1: string
    variable2: string
    strength: number // -1 to 1
    pValue: number
  }

  // If risk
  risk?: {
    component: 'GE' | 'GI' | 'GVC' | 'kappa' | 'theta'
    timeToRuin: number // days
    severity: 'low' | 'medium' | 'high' | 'critical'
  }

  actionTaken: string | null
  dismissed: boolean
}

// New table: predictions
interface Prediction {
  id: string
  userId: string
  createdAt: string
  targetDate: string

  predictionType: 'reward_score' | 'component_value' | 'risk_event' | 'opportunity'
  description: string
  predictedValue: number | null
  confidence: number

  // Outcome (filled after targetDate)
  actualValue: number | null
  accuracy: number | null // How close was prediction?

  // Model calibration
  llmModel: string
  inputFeatures: Record<string, any>
}

// Extended DailyLog
interface DailyLog {
  // ... existing fields ...

  // NEW: Automated data
  automatedData: {
    sleep: {
      hours: number
      hrv: number
      readiness: number
      source: 'oura' | 'whoop' | 'apple_watch'
    }
    training: {
      type: string[]
      duration: number
      vo2Intervals: number[]
      zone2Distance: number
      source: 'strava' | 'garmin'
    }
    bodyComp: {
      weight: number
      bodyFat: number
      leanMass: number
      source: 'withings' | 'tanita'
    }
    timeAllocation: {
      totalFocusHours: number
      byProject: Record<string, number>
      source: 'rescuetime' | 'toggl'
    }
    revenue: {
      armstrong: number
      manifold: number
      source: 'stripe'
    }
    publicActivity: {
      githubCommits: number
      tweets: number
      linkedinPosts: number
      blogPosts: number
    }
    communication: {
      emailsSent: number
      meetingsHeld: number
      deepConversations: number // >30min meetings
    }
  }

  // NEW: Reflection
  reflection: {
    raw: string
    analyzed: Reflection
    llmProcessed: boolean
  }

  // NEW: Risk warnings
  riskWarnings: {
    component: string
    severity: string
    timeToRuin: number
    message: string
  }[]

  // NEW: Predictions for tomorrow
  predictions: {
    rewardScore: { value: number, confidence: number }
    ge: { value: number, confidence: number }
    kappa: { value: number, confidence: number }
    risks: string[]
    opportunities: string[]
  }
}
```

---

## PART 3: IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
**Goal: Automated data collection infrastructure**

**Week 1: API Integrations + Folder Watching**
- [ ] Set up Garmin Connect API integration (sleep, HRV, VO2 Max, training, HR zones)
- [ ] Set up Chess.com API integration (ELO tracking)
- [ ] Set up Google Calendar API (focus hours, meetings, color-coded time tracking)
- [ ] Set up Stripe API (revenue)
- [ ] Set up GitHub API (commits, PRs)
- [ ] Set up Twitter API (building in public tracking)
- [ ] Set up folder watching system (Dropbox/Google Drive webhook or polling)
- [ ] Configure Wave.ai to save transcripts to designated folder

**Week 2: Data Pipeline**
- [ ] Build ETL pipeline: API → Database daily sync (cron job at 6am)
- [ ] Create automated_data table with schema above
- [ ] Build dashboard to visualize automated data
- [ ] Test: Verify data flows correctly for 7 consecutive days
- [ ] Create fallback: If API fails, allow manual override

**Deliverable:** 80% of daily log auto-populated by morning

---

### Phase 2: Voice Input & LLM Processing (Week 3-4)

**Week 3: Wave.ai Integration & File Processing**
- [ ] Build file watcher (monitors folder every 5 min or via webhook)
- [ ] Implement naming convention parser (daily-*.txt vs signal-*.txt vs goal-*.txt)
- [ ] Create LLM prompts for each file type:
  - Daily reflection → extract: nervous system, body felt, shipped, asks, insights
  - Signal capture → extract: problem, pain point, solution, why broken, arbitrage potential
  - Goal update → extract: progress, obstacles, next actions
- [ ] Test: Record in Wave.ai → file appears → system processes → dashboard updates
- [ ] Add manual override (if file processing fails, edit manually)

**Week 4: Daily Reflection System**
- [ ] Add "Daily Reflection" UI component (textarea + voice option)
- [ ] Integrate Claude API for reflection analysis
- [ ] Create reflections table in database
- [ ] Build reflection history view (see past reflections)
- [ ] Test: Reflection generates insights, themes, patterns

**Deliverable:** Daily input reduced to <2 minutes (voice + reflection)

---

### Phase 3: Pattern Recognition Engine (Week 5-6)

**Week 5: Pattern Detection**
- [ ] Build weekly cron job: Analyze 7 days of data + reflections
- [ ] LLM prompt: "Find recurring themes, correlations, anomalies"
- [ ] Store patterns in pattern_detections table
- [ ] Create "Patterns" dashboard tab
- [ ] Show: "You've mentioned [X] 4 times when GE < 0.6"

**Week 6: Correlation & Risk Analysis**
- [ ] Calculate correlation matrix (all components × all components)
- [ ] LLM prompt: "Which correlations are actionable insights?"
- [ ] Build risk dashboard: Time-to-ruin for each component
- [ ] Visual: Traffic light system (🟢 >7 days, 🟡 3-7 days, 🔴 <3 days to ruin)
- [ ] Automatic alerts: If any component <3 days to ruin, trigger warning

**Deliverable:** System automatically surfaces insights you'd miss manually

---

### Phase 4: Prediction Engine (Week 7-8)

**Week 7: Build Predictive Models**
- [ ] Train regression models: Historical data → predict tomorrow's g*
- [ ] LLM-assisted: "Based on 60 days, when X happens, Y follows with Z% probability"
- [ ] Store predictions in predictions table
- [ ] Each morning: Show predicted g* for today + confidence
- [ ] Each evening: Compare predicted vs. actual → calibration score

**Week 8: Outcome Tracking & Model Improvement**
- [ ] Track prediction accuracy over time
- [ ] LLM prompt: "What features improve prediction accuracy?"
- [ ] Iterate on model: Add/remove features based on accuracy
- [ ] Build "Prediction Accuracy" dashboard
- [ ] Goal: 70%+ accuracy on g* prediction within ±1 point

**Deliverable:** System predicts your day before it happens (and gets better over time)

---

### Phase 5: Strategic Advisor (Week 9-10)

**Week 9: Portfolio Rebalancing Advisor**
- [ ] Weekly LLM analysis: "Review time allocation vs. revenue vs. thesis"
- [ ] Generate recommendations: "Kill Manifold" or "Double down on Armstrong"
- [ ] Show compounding chain analysis: "Armstrong → Fund conversion rate: 0%"
- [ ] Create "Strategic Review" page (weekly)
- [ ] User can accept/reject/defer recommendations

**Week 10: Systematic Triggers**
- [ ] Implement 4 Bridgewater triggers:
  1. Project kill switch (auto-flag if revenue < target for 8 weeks)
  2. Fragmentation circuit breaker (lock projects if spine < 50% for 3 days)
  3. Ruin avoidance lockout (force recovery mode if GE critical)
  4. Capture deficit intervention (force ask sprint if κ < 0.3 for 7 days)
- [ ] UI: Trigger alerts with clear CTAs
- [ ] Override option (but requires written justification)

**Deliverable:** System enforces discipline you'd skip manually

---

### Phase 6: New Tracking Dimensions (Week 11-12)

**Week 11: Relationships & Experiences**
- [ ] Add "Relationship Tracker" section
  - Deep conversations (auto: meetings >30min from Calendar)
  - Quality rating (manual: 1-10 scale)
  - Strategic value (manual: Yes/No)
- [ ] Add "Experiences Tracker"
  - New experiences (manual: free text)
  - Type: Travel, Learning, Art, Social
  - Impact rating (manual: 1-10)
- [ ] Add "Attractiveness Tracker"
  - Body comp (auto: smart scale)
  - Strength PRs (auto: Strong app)
  - Style/presentation (manual: weekly selfie + rating)

**Week 12: Skill Progression Dashboard**
- [ ] Define skill taxonomy:
  - Technical: AI/ML, Full-stack, Trading, Neuroscience
  - Execution: Shipping, Asks, Decisions
  - Relational: Boundaries, Requests, Regulation
  - Strategic: Arbitrage, Coherence, Kill decisions
- [ ] Monthly self-assessment (1-10 scale on each skill)
- [ ] Auto-populate where possible:
  - Shipping: GitHub commits
  - Asks: Email sends + revenue asks count
- [ ] Plot skill trajectories (are you improving?)
- [ ] LLM insight: "Your 'Asks' skill jumped from 4 to 7 this quarter—what changed?"

**Deliverable:** Full coverage of stated goals (attractiveness, skills, businesses, resources, intelligence, relationships, experiences, art)

---

## PART 4: THE DAILY EXPERIENCE (V2)

### Morning (6:00 AM)
**System auto-runs before you wake up:**
- ✅ Syncs Oura (sleep, HRV, readiness)
- ✅ Syncs Strava (yesterday's training)
- ✅ Syncs Calendar (today's focus blocks, meetings)
- ✅ Syncs RescueTime (yesterday's time allocation)
- ✅ Syncs Stripe (revenue)
- ✅ Syncs GitHub (commits, PRs)
- ✅ Syncs Withings scale (body comp)

**You open Thesis Engine:**
- Dashboard shows: Yesterday's automated data (already populated)
- LLM shows: Today's predictions
  - "Predicted g*: 7.2 (±0.8)"
  - "Risk: GE might drop if <7hrs sleep tonight"
  - "Opportunity: Last 3 times you felt like this, you shipped well"
- Quick 3-tap input:
  - Nervous system: 🟢 🟡 🔴
  - Body felt: Open / Neutral / Tense
  - Focus today: [Voice: "Armstrong Greeks calculator"]

**Total time: 30 seconds**

### Evening (8:00 PM)
**Daily Reflection:**
- System prompts: "What surprised you today?"
- You speak (or type) for 90 seconds:
  - "I noticed I avoided asking John for money even though I had the opening. Pattern: I default to 'wait until it's perfect' when nervous. Also, shipped the calculator—felt clean. Sleep was good, body feels regulated."
- LLM processes:
  - Extracts: "Asking anxiety", "Perfectionism pattern", "Shipping win", "Regulated state"
  - Cross-references: "You've mentioned 'asking anxiety' 6 times this month—always when GE < 0.7"
  - Predicts: "If you sleep >7hrs tonight, 80% chance your κ jumps tomorrow"
  - Recommends: "Tomorrow: 3 asks before noon (capitalize on regulated state)"

**You confirm → System saves**

**Total time: 2 minutes**

### Weekly (Sunday 7:00 PM)
**Strategic Review:**
- LLM generates weekly report:
  - Patterns detected: "You fragmented 3 days this week (Armstrong dropped to 45%)"
  - Correlation insight: "When you train in AM, your κ is 2.3x higher"
  - Risk warning: "κ has been <0.3 for 7 consecutive days → TRIGGER: Capture Deficit Sprint"
  - Portfolio recommendation: "Manifold: 8 weeks at 0 revenue. Decision point: Kill or pivot?"
  - Compounding chain: "Armstrong customers: 5. Fund interest: 0. Missing: credibility signal."
  - Skill progression: "Your 'Shipping' skill jumped from 6 → 8 this month (GitHub commits 3x)"

**You review, accept/reject/defer**

**Total time: 10 minutes**

---

## PART 5: TECHNICAL ARCHITECTURE

### 5.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                            │
├─────────────────────────────────────────────────────────────────┤
│ Oura Ring │ Strava │ Calendar │ RescueTime │ Stripe │ GitHub    │
│ Withings  │ Strong │ Gmail    │ Twitter    │ LinkedIn          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ETL PIPELINE (Cron)                        │
│  - Runs daily at 6am                                            │
│  - Fetches data from all APIs                                   │
│  - Transforms into unified schema                               │
│  - Loads into automated_data table                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (Supabase)                        │
│  - daily_logs (existing + automated_data field)                 │
│  - reflections (LLM-processed insights)                         │
│  - pattern_detections (correlations, anomalies)                 │
│  - predictions (daily forecasts + accuracy tracking)            │
│  - skill_assessments (monthly self-ratings)                     │
│  - relationship_logs (deep conversations)                       │
│  - experience_logs (new experiences)                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM PROCESSING LAYER                         │
│  Agent 1: Reflection Analyzer (daily, Claude API)              │
│  Agent 2: Pattern Recognizer (weekly, Claude API)              │
│  Agent 3: Prediction Engine (daily, GPT-4 API)                 │
│  Agent 4: Strategy Advisor (weekly, Claude API)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                           │
│  - Dashboard (real-time g*, components, trajectory)             │
│  - Energy Tab (automated sleep, training, body comp)            │
│  - Output Tab (automated commits, revenue, asks)                │
│  - Intelligence Tab (signals, conversations, patterns)          │
│  - Coherence Tab (thesis alignment, fragmentation)              │
│  - Risk Tab (NEW: time-to-ruin, volatility, correlations)      │
│  - Patterns Tab (NEW: LLM-detected insights)                    │
│  - Skills Tab (NEW: progression tracking)                       │
│  - Reflection UI (voice + text input)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Tech Stack

**Backend:**
- **Database:** Supabase (PostgreSQL)
- **Cron Jobs:** Vercel Cron or Supabase Edge Functions
- **APIs:** REST endpoints for each integration

**Data Integrations:**
- **Oura Ring:** `https://api.ouraring.com/v2/`
- **Strava:** `https://www.strava.com/api/v3/`
- **Google Calendar:** `https://www.googleapis.com/calendar/v3/`
- **RescueTime:** `https://www.rescuetime.com/anapi/`
- **Stripe:** `https://api.stripe.com/v1/`
- **GitHub:** `https://api.github.com/`
- **Withings:** `https://wbsapi.withings.net/v2/`
- **Gmail:** `https://www.googleapis.com/gmail/v1/`

**LLM Integrations:**
- **Claude API:** `https://api.anthropic.com/v1/messages` (Reflections, Strategy)
- **OpenAI API:** `https://api.openai.com/v1/chat/completions` (Predictions, Parsing)
- **Whisper API:** `https://api.openai.com/v1/audio/transcriptions` (Voice input)

**Frontend:**
- **Framework:** Next.js 14 (App Router)
- **UI:** TailwindCSS + shadcn/ui
- **Charts:** Recharts
- **Voice:** Web Speech API or Whisper API

### 5.3 Code Example: ETL Pipeline

```typescript
// /app/api/cron/sync-data/route.ts
import { createClient } from '@supabase/supabase-js'
import { fetchOuraData } from '@/lib/integrations/oura'
import { fetchStravaData } from '@/lib/integrations/strava'
import { fetchCalendarData } from '@/lib/integrations/google-calendar'
import { fetchRescueTimeData } from '@/lib/integrations/rescuetime'
import { fetchStripeData } from '@/lib/integrations/stripe'
import { fetchGitHubData } from '@/lib/integrations/github'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]

  try {
    // Fetch all data in parallel
    const [oura, strava, calendar, rescuetime, stripe, github] = await Promise.all([
      fetchOuraData(dateStr),
      fetchStravaData(dateStr),
      fetchCalendarData(dateStr),
      fetchRescueTimeData(dateStr),
      fetchStripeData(dateStr),
      fetchGitHubData(dateStr),
    ])

    // Combine into automatedData object
    const automatedData = {
      sleep: {
        hours: oura.sleep.total / 3600,
        hrv: oura.hrv.average,
        readiness: oura.readiness.score,
        source: 'oura'
      },
      training: {
        type: strava.activities.map(a => a.type),
        duration: strava.activities.reduce((sum, a) => sum + a.moving_time, 0) / 60,
        vo2Intervals: strava.activities
          .filter(a => a.type === 'Run' && a.max_heartrate > 170)
          .map(a => a.moving_time / 60),
        zone2Distance: strava.activities
          .filter(a => a.average_heartrate >= 130 && a.average_heartrate <= 150)
          .reduce((sum, a) => sum + a.distance / 1000, 0),
        source: 'strava'
      },
      timeAllocation: {
        totalFocusHours: rescuetime.productivity.total_hours,
        byProject: {
          'Armstrong': rescuetime.activities.find(a => a.category === 'Development')?.hours || 0,
          'Manifold': rescuetime.activities.find(a => a.category === 'Design')?.hours || 0,
        },
        source: 'rescuetime'
      },
      revenue: {
        armstrong: stripe.charges.filter(c => c.description?.includes('Armstrong')).reduce((sum, c) => sum + c.amount, 0) / 100,
        manifold: stripe.charges.filter(c => c.description?.includes('Manifold')).reduce((sum, c) => sum + c.amount, 0) / 100,
        source: 'stripe'
      },
      publicActivity: {
        githubCommits: github.commits.length,
        tweets: 0, // TODO: Twitter API
        linkedinPosts: 0, // TODO: LinkedIn API
        blogPosts: 0, // TODO: Blog API
      },
      communication: {
        emailsSent: 0, // TODO: Gmail API
        meetingsHeld: calendar.events.length,
        deepConversations: calendar.events.filter(e => e.duration > 30).length,
      }
    }

    // Upsert into daily_logs
    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        date: dateStr,
        user_id: process.env.USER_ID,
        automated_data: automatedData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'date,user_id' })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, date: dateStr }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('ETL Pipeline Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

### 5.4 Code Example: LLM Reflection Analyzer

```typescript
// /lib/llm/analyze-reflection.ts
import Anthropic from '@anthropic-ai/sdk'

interface ReflectionAnalysis {
  insights: string[]
  emotionalState: 'regulated' | 'spiked' | 'neutral'
  themes: string[]
  patterns: string[]
  prediction: string
  riskFlags: string[]
  thesisPillarsTouched: ('AI' | 'Markets' | 'Mind')[]
  actionableNext: string | null
}

export async function analyzeReflection(
  reflectionText: string,
  contextData: {
    todayScore: number
    components: any
    trajectory: any[]
    recentReflections: string[]
  }
): Promise<ReflectionAnalysis> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are analyzing Lori's daily reflection in the context of her Thesis Engine life portfolio system.

CONTEXT:
- Today's reward score (g*): ${contextData.todayScore.toFixed(1)}
- Component breakdown: GE=${contextData.components.ge.toFixed(2)}, κ=${contextData.components.kappa.toFixed(2)}, ĠI=${contextData.components.gi.toFixed(2)}
- 7-day trajectory: ${contextData.trajectory.map(d => d.score).join(', ')}
- Recent reflections (last 3 days):
${contextData.recentReflections.map((r, i) => `  Day ${i+1}: "${r}"`).join('\n')}

USER REFLECTION (today):
"${reflectionText}"

YOUR TASK:
Analyze this reflection and extract structured insights. Be specific, pattern-focused, and actionable.

1. INSIGHTS: What key realizations or learnings did she have? (2-4 bullet points)
2. EMOTIONAL STATE: Is she regulated (calm, clear), spiked (anxious, reactive), or neutral?
3. THEMES: What categories does this touch? (e.g., "asking anxiety", "shipping momentum", "fragmentation", "regulation", "capture deficit")
4. PATTERNS: Cross-reference with recent reflections. Has she mentioned this before? Is this a recurring pattern?
5. PREDICTION: Based on this reflection + today's data, what's likely to happen tomorrow? (Be specific: "If X, then Y")
6. RISK FLAGS: Any warning signs? (e.g., "approaching burnout", "capture deficit", "fragmentation creeping in")
7. THESIS PILLARS: Which of her 3 thesis pillars (AI, Markets, Mind) did she touch today?
8. ACTIONABLE NEXT: One concrete action for tomorrow based on this reflection.

OUTPUT (JSON):
{
  "insights": ["insight 1", "insight 2"],
  "emotionalState": "regulated|spiked|neutral",
  "themes": ["theme1", "theme2"],
  "patterns": ["pattern recognition statement"],
  "prediction": "prediction statement",
  "riskFlags": ["flag1 if any"],
  "thesisPillarsTouched": ["AI", "Markets", "Mind"],
  "actionableNext": "one action for tomorrow"
}`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  // Parse JSON from Claude's response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to extract JSON from response')

  const analysis: ReflectionAnalysis = JSON.parse(jsonMatch[0])
  return analysis
}
```

---

## PART 6: COST ANALYSIS

### 6.1 API Costs (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| **Garmin Watch** | One-time hardware | $0 (you already have) |
| **Garmin Connect** | Free | $0 |
| **Wave.ai** | Subscription | ~$10/month (you're already using) |
| **Chess.com** | Free (Premium optional) | $0 ($5/month for premium, optional) |
| **Google Calendar** | Free tier | $0 |
| **Stripe** | Pay-per-transaction | ~$0 (you're already using) |
| **GitHub** | Free tier | $0 |
| **Twitter API** | Free tier | $0 |
| **Dropbox/Google Drive** | For file watching | $0 (free tier sufficient) |
| **Claude API** | Pay-per-use | ~$15/month (30 reflections × $0.50) |
| **OpenAI API** | Pay-per-use | ~$10/month (30 predictions × $0.30) |
| **Total** | | **$35/month** (Wave.ai + LLM APIs) |

**ROI Calculation:**
- Time saved: 8 min/day → 4 hrs/month → **~$400/month** (at $100/hr opportunity cost)
- Insights gained: Priceless (pattern recognition you'd never see manually)
- **Net value: $354/month**

---

## PART 7: PRIVACY & SECURITY

### 7.1 Data Handling

**Principle: Your data never leaves your control**

- All data stored in YOUR Supabase instance (you own the database)
- LLM APIs (Claude/OpenAI) process reflections, but:
  - No data is used for training (Anthropic/OpenAI enterprise policies)
  - Consider self-hosting LLMs later (Llama 3.1 local instance)
- API keys stored in environment variables (never committed to git)
- All API calls over HTTPS

**Optional: Self-Hosted LLM (Phase 7)**
- Run Llama 3.1 70B locally (requires GPU)
- Zero external API calls
- 100% privacy

---

## PART 8: SUCCESS METRICS

### 8.1 How to Know This Is Working

**Week 4 (After Phase 2):**
- ✅ Daily input time: <2 minutes (from 10 minutes)
- ✅ 80%+ of data auto-populated
- ✅ Reflections generate insights you find valuable

**Week 8 (After Phase 4):**
- ✅ Prediction accuracy: 70%+ on g* within ±1 point
- ✅ Pattern detection: LLM surfaces 2+ actionable patterns per week
- ✅ You make 1+ decision based on LLM insight

**Week 12 (After Phase 6):**
- ✅ Full coverage: All stated goals tracked (attractiveness, skills, businesses, relationships, experiences)
- ✅ Systematic triggers: 1+ trigger activated and followed
- ✅ You trust the system more than your own intuition for portfolio rebalancing

**Year 1:**
- ✅ LLM calibration: Prediction accuracy >80%
- ✅ Behavioral change: You've killed 1+ project based on systematic trigger
- ✅ Compounding proof: Armstrong → Fund conversion rate measurable and improving
- ✅ You've leveled up 3+ skills (tracked progression visible)
- ✅ Relationship depth: 3+ deep conversations weekly (consistent)

---

## FINAL RECOMMENDATION: START HERE

**This week:**
1. ✅ Ensure Garmin watch is syncing (you already have one)
2. ✅ Set up Garmin Connect API access
3. ✅ Set up API keys: Chess.com, Google Calendar, Stripe, GitHub, Twitter/LinkedIn
4. ✅ Configure Wave.ai to save transcripts to a specific folder (e.g., Dropbox/Google Drive)
5. ✅ Set up color-coded Google Calendar system:
   - 🟦 Blue = Armstrong (spine project)
   - 🟩 Green = Manifold
   - 🟪 Purple = Deep Tech Fund
   - 🟨 Yellow = Learning/Research
   - 🟧 Orange = Meetings/Admin
6. ✅ Build ETL pipeline (single cron job, sync all data daily)

**Next week:**
5. ✅ Test: Verify automated data flows correctly for 7 days
6. ✅ Build voice input UI (Whisper API)
7. ✅ Add daily reflection UI (Claude API)

**Then:** Follow roadmap phases 3-6.

**Total implementation time: 12 weeks**
**Total ongoing time commitment: 2 minutes/day**
**Total ongoing cost: $46/month**
**Total value: Bridgewater-level command control of your life portfolio**

---

This is not a productivity app anymore. This is a **life operating system** with AI co-pilot.

Build it.
