# THESIS ENGINE DASHBOARD
## Product Requirements Document

**Project Owner:** Lori  
**Purpose:** Daily life & business portfolio management dashboard  
**Reference Architecture:** Armstrong (options analytics dashboard)  
**Target:** Sign in daily, manage thesis-aligned projects, track execution  

---

## 1. PRODUCT OVERVIEW

### What Is It?
A personal dashboard that operates as a **portfolio management system** for your life and business. It tracks:
- **4 core projects** (Manifold, Armstrong, Jobs, Deep Tech Fund)
- **Daily execution** (the 5 core muscles from the Thesis Engine)
- **Signal capture** (market signals, problems spotted, research concepts)
- **Nervous system state** (emotional volatility, sleep, movement, relational health)
- **Weekly synthesis** (how projects compound toward your thesis)

### Why?
You need a *single source of truth* that prevents fragmentation. The dashboard makes visible:
- What's actually compounding vs. what's theater
- Whether you're executing on your Female Levelsio thesis
- Real-time ROI of time allocation
- Nervous system trends (are you regulated enough to decide?)

### Design Principle
**Mirror Armstrong's aesthetic + interaction patterns:**
- Clean, data-driven interface
- Card-based layout
- Real-time status indicators
- Quick input/logging (no friction)
- Mobile-responsive
- Professional but not sterile

---

## 2. CORE FEATURES

### 2.1 AUTHENTICATION
- **Google Sign-On** (NextAuth.js + Google OAuth)
- Single account per user
- Persistent session
- Profile picture from Google
- Email-based user identification

### 2.2 DASHBOARD HOME (Daily Landing Page)

**Sections (Top to Bottom):**

#### A. DAILY THESIS CHECK (Top Banner)
```
📌 TODAY'S SPINE: [Armstrong / Manifold] 
   "You have 6 hours of focused build time allocated"
   Progress: ▓▓▓░░░ (3 of 6 hours used)
   [Start Session] [Log Session]
```

**Purpose:** Quick visual confirmation of what matters today

---

#### B. EXECUTION TRACKER (Main Panel - Left 60%)

**Interactive Daily Log:**

```
🎯 EXECUTION (Spine Project: Armstrong)
├─ Focus Hours Today: [____] / 6
├─ What Shipped: [text input]
├─ Revenue Asks Made: [____] (count)
│  └─ Log: [DM to X | Email to Y | Post on Z]
└─ Public Iteration? [Yes/No toggle]

💡 VALUE DETECTION  
├─ Problem 1: [____]
├─ Problem 2: [____]
├─ Problem 3: [____]
└─ Pick One for 48h Test: [____]

📤 DISTRIBUTION CHECK
├─ Days Since Last Public Output: [auto-calculated]
├─ Feedback Loop Closed? [Yes/No]
├─ Revenue Signal Received: $[____]
└─ Speed > Perfection? [Yes/No]

😤 EMOTIONAL VOLATILITY
├─ Nervous System State: 
│  [🟢 Regulated | 🟡 Slightly Spiked | 🔴 Spiked]
├─ If Spiked, Trigger: [dropdown: Ambiguous commitment | Unseen | Stalled momentum | Validation drop | Other]
├─ 24-Hour Rule Applied? [Yes/No]
├─ Clean Request/Release Made: [text input]
└─ No Emotional Texting? [Yes/No]

💰 FINANCIAL SIMPLICITY
├─ Revenue This Session: $[____]
├─ Stream Type: [dropdown: Recurring | One-time | Organic]
└─ Automation Opportunity: [text input or skip]

🧠 NERVOUS SYSTEM FOUNDATION
├─ Sleep Last Night: [____] hours
├─ Training Today: [dropdown: VO2 training | Strength | Rest | None]
├─ Relational Ask/Boundary: [text input or skip]
└─ Body Felt: [🟢 Open | 🟡 Neutral | 🔴 Tense]

[SAVE LOG]
```

**Interaction Pattern:**
- Input fields are lightweight (no friction)
- Dropdowns for known categories
- Toggle buttons for yes/no
- Auto-save on blur
- Visual progress indicators

---

#### C. NERVOUS SYSTEM TRENDS (Right 40% - Mini Dashboard)

```
📊 THIS WEEK'S PATTERNS

Sleep Consistency:
▓▓▓▓▓░░  (5/7 nights 7-8 hours)

Emotional Volatility:
🟢 🟢 🟡 🟢 🟢 🟡 🟢  (Days)

Shipping Cadence:
📤 📤 ✅ 📤 ✅ ✅ ✅  (Did something ship?)

Revenue Asks Made:
Mon(3) Tue(2) Wed(0) Thu(4) Fri(2) Sat(1) Sun(0)
```

**Purpose:** Quick visual check of your state + trends

---

### 2.3 PROJECT PORTFOLIO VIEW

**Tab: "Projects"**

```
┌─────────────────────────────────────────────────────────┐
│ PROJECT PORTFOLIO (Portfolio ROI & Time Allocation)      │
├─────────────────────────────────────────────────────────┤

PROJECT      │ TIME  │ REV (3mo) │ REV (1yr) │ STATUS │ NEXT
─────────────┼───────┼───────────┼───────────┼────────┼──────
Armstrong    │ 60%   │ $2-6k    │ $12-24k   │ 🟢 On  │ Hit $2k/mo
Manifold     │ 15%   │ $0       │ $5-50k    │ 🟡 Pre │ 50 users
Deep Tech    │ 5%    │ $0       │ TBD       │ 🟡 Pre │ 1 GP call
Jobs         │ 1%    │ $0       │ $200k     │ 🟠 Backup
Learning     │ 19%   │ -        │ -         │ 🟢 On  │ Weekly synthesis

TOTAL: 100% | Highest ROI: Armstrong 60% → $24k/yr potential
```

**Interaction:**
- Click each project → see detailed metrics
- Drag to rebalance allocation (if needed)
- Color coding: 🟢 On spine | 🟡 Pre-launch | 🟠 Backup | 🔴 Kill

**Detailed Project Card (on click):**

```
PROJECT: Armstrong

📊 KEY METRICS
├─ Revenue (3mo): $1.5k-6k
├─ Revenue (1yr): $6k-24k + fund launch
├─ Revenue (3yr): $200k/yr (2/20 at $10M AUM)
├─ Time Allocation: 60%
└─ Status: Building → Revenue phase (3 months)

🎯 MILESTONES
├─ Month 1: [Dashboard shipped | Seeking first customers]
├─ Month 2: [Hit $500/mo | Start fund docs]
├─ Month 3: [Hit $1.5-2k/mo | Launch fund]
├─ Month 12: [Fund at $10M AUM | 2/20 fees flowing]
└─ Log Update: [Update button]

📍 THESIS ALIGNMENT
├─ AI/Markets: Options analytics = AI at intersection of markets
├─ Markets: Building for option traders (proven willingness to pay)
├─ Capital: This becomes a fund mgmt platform + GP role
└─ Why This Matters: Compounding leverage (other people's money)

🔗 COMPOUNDING CHAIN
Armstrong → Deep Tech Fund (GP credibility) 
         → Personal brand as capital allocator
         → Better customers for Manifold
         → Thought leadership in AI + markets

💰 FINANCIAL TRACKER
├─ Revenue YTD: $[____]
├─ Customer Count: [____]
├─ Recurring Revenue: $[____]/mo
├─ Churn: [____]%
└─ CAC: $[____]

[EDIT] [LOG SESSION] [ARCHIVE PROJECT]
```

---

### 2.4 SIGNAL CAPTURE (Dedicated Section)

**Tab: "Signals"**

**Input Form:**

```
ADD SIGNAL

Today's Date: [auto-filled]

WHAT'S BROKEN? (Pick Problem #1 to Track)
├─ Problem: [textarea]
├─ Who feels the pain? [single line]
├─ Current solution? [single line]
├─ Why broken? [textarea]
├─ AI/Market angle? [textarea]
└─ Move to "Test This Week"? [Yes/No]

MARKET SIGNALS RECEIVED
├─ Type: [Customer complaint | Competitor move | Tech shift | Price opportunity | Distribution opening]
├─ Signal: [textarea]
├─ Why matters: [textarea]
└─ Relevant to thesis? [Yes/No]

RESEARCH CONCEPTS (Thesis-Aligned)
├─ Concept: [single line]
├─ Connection to (AI|Markets|Mind): [dropdown]
├─ Why changes my edge? [textarea]
└─ 48h test idea? [textarea]

ARBITRAGE OPPORTUNITIES (THE GOLD)
├─ Gap: [What's hard | What could be automated | What people pay for]
├─ Timeline to test: [Days]
├─ Revenue potential (1-10): [slider 1-10]
└─ One action this week: [text]

[SAVE SIGNAL] [ARCHIVE] [DELETE]
```

**Display (Signal Library):**

```
SIGNALS THIS WEEK: 23 captured

Filter: [All | This Week | This Month | Open | Archived]

ARBITRAGE OPPORTUNITIES (Revenue Potential)
├─ [9/10] "Options traders need real-time Greeks dashboard" 
│         → Armstrong feature idea
│         → 3-day test timeline
│         → Status: In progress
│
├─ [7/10] "EEG-based neurofeedback lacks RL integration"
│         → Thesis research (Mind + AI)
│         → 1-week literature review
│         → Status: Research phase
│
└─ [5/10] "Manifold UI for job seekers is clunky"
│         → Manifold feature
│         → 2-day prototype
│         → Status: To Do

PROBLEMS SPOTTED (Waiting for Test)
├─ Problem: Job application bottleneck in screening
├─ Problem: Options traders managing portfolio manually
├─ Problem: EEG preprocessing lacks standardization

RESEARCH CONCEPTS
├─ Concept: Meta-RL for adaptive neural decoders
├─ Concept: Inverse RL to infer cognitive reward functions
├─ Concept: Multi-agent RL for wheelchair navigation

[+ ADD NEW SIGNAL]
```

**Purpose:** 
- Capture market insights in real-time (not later)
- See what's worth testing vs. what's noise
- Build your pattern recognition muscle
- Reference for "what's broken?" daily question

---

### 2.5 WEEKLY SYNTHESIS VIEW

**Tab: "Weekly"** (View/Edit on Sunday or Monday)

```
WEEKLY SYNTHESIS: Week of [date range]

🎯 TOP SIGNALS THIS WEEK
├─ AI Signal: [Your biggest learning about AI/Markets/Mind]
├─ Markets Signal: [Customer feedback, market move, arbitrage spotted]
└─ Mind Signal: [Nervous system insight, clarity moment, pattern noticed]

🧪 ARBITRAGE GAP TESTED
├─ Problem: [____]
├─ Solution Shipped: [____]
├─ Market Response: [____]
├─ Learning: [____]
└─ Did it compound? [Yes/No]

📊 COMPOUNDING CHECK
├─ Did this week build on last week? [Yes/No - explain]
├─ Did I fragment or focus? [____]
├─ Where did Buddhist clarity enable speed? [____]
├─ What should I kill? [____]
└─ What should I double? [____]

🔗 NEXT WEEK'S ONE ACTION (Touches All 3 Pillars)
├─ Spine Project (Armstrong): [____]
├─ Market Validation (Signal): [____]
└─ Intellectual Integration (AI/Mind): [____]

📈 PROJECTS STATUS
├─ Armstrong: [On track | Stalled | Accelerating]
├─ Manifold: [On track | Stalled | Accelerating]
├─ Deep Tech: [On track | Stalled | Accelerating]
└─ Jobs: [On track | Stalled | Accelerating]

💭 REFLECTION
├─ One thing that surprised me: [____]
├─ One pattern I want to break: [____]
├─ One pattern I want to adopt: [____]
└─ Thesis still valid? [Yes | Adjust to ___]

[SAVE] [EXPORT AS PDF] [EMAIL WEEKLY SUMMARY]
```

---

### 2.6 SETTINGS / CONFIG

**Tab: "Settings"**

```
⚙️ THESIS ENGINE SETTINGS

PERSONAL
├─ Full Name: [____]
├─ Email: [auto-filled from Google]
├─ Profile Picture: [auto-filled from Google | Override]
└─ Time Zone: [____]

SPINE PROJECT (Current Primary)
├─ Active Spine: [dropdown: Armstrong | Manifold | Deep Tech | Jobs | Custom]
├─ Daily Allocation: [____] hours
├─ Current Revenue: $[____]/mo
└─ Target Revenue: $[____]/mo

THRESHOLDS & RULES
├─ Hours per focus session: [____]
├─ Max projects (no fragmentation): [2]
├─ Revenue ask quota per day: [____] (count)
├─ Sleep target: [____] hours
└─ 24-hour spike rule active? [Yes/No]

NOTIFICATIONS
├─ Daily reminder time: [____] AM
├─ Weekly synthesis reminder: [Sunday | Monday] at [time]
├─ Missed goal alerts: [On/Off]
├─ Revenue milestone celebrations: [On/Off]
└─ Email digest: [Daily | Weekly | Off]

DATA & EXPORT
├─ Download All Data: [JSON | CSV | PDF]
├─ Export Weekly Summaries: [Last 4 weeks | Last 3 months | All]
└─ Delete All Data: [⚠️ Irreversible]

[SAVE SETTINGS]
```

---

## 3. DATA SCHEMA

### Core Tables (Database)

```sql
-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY,
  google_id STRING UNIQUE,
  email STRING UNIQUE,
  name STRING,
  profile_picture_url STRING,
  timezone STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- DAILY LOGS
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY,
  user_id UUID (FK users),
  date DATE,
  
  -- Execution
  spine_project STRING,
  focus_hours_target DECIMAL,
  focus_hours_actual DECIMAL,
  what_shipped TEXT,
  revenue_asks_count INT,
  revenue_asks_list JSONB,
  public_iteration BOOLEAN,
  
  -- Value Detection
  problems JSONB, -- [{problem, pain_point, solution, broken_why}]
  problem_selected STRING,
  
  -- Distribution
  days_since_last_output INT,
  feedback_loop_closed BOOLEAN,
  revenue_signal DECIMAL,
  speed_over_perfection BOOLEAN,
  
  -- Emotional Volatility
  nervous_system_state ENUM['regulated', 'slightly_spiked', 'spiked'],
  nervous_system_trigger STRING,
  twenty_four_hour_rule_applied BOOLEAN,
  clean_request_release TEXT,
  no_emotional_texting BOOLEAN,
  
  -- Financial
  revenue_this_session DECIMAL,
  revenue_stream_type ENUM['recurring', 'one_time', 'organic'],
  automation_opportunity TEXT,
  
  -- Nervous System
  sleep_hours DECIMAL,
  training_type ENUM['vo2', 'strength', 'rest', 'none'],
  relational_boundary TEXT,
  body_felt ENUM['open', 'neutral', 'tense'],
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- SIGNALS
CREATE TABLE signals (
  id UUID PRIMARY KEY,
  user_id UUID (FK users),
  
  signal_type ENUM['problem', 'market', 'research', 'arbitrage'],
  title STRING,
  description TEXT,
  pain_point TEXT,
  current_solution TEXT,
  why_broken TEXT,
  ai_market_angle TEXT,
  
  market_signal_type ENUM['customer_complaint', 'competitor_move', 'tech_shift', 'price_opportunity', 'distribution'],
  
  research_concept STRING,
  thesis_connection ENUM['ai', 'markets', 'mind'],
  why_changes_edge TEXT,
  test_idea TEXT,
  
  arbitrage_gap TEXT,
  timeline_days INT,
  revenue_potential INT, -- 1-10 scale
  action_this_week TEXT,
  
  relevant_to_thesis BOOLEAN,
  status ENUM['open', 'testing', 'shipped', 'archived'],
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- PROJECTS
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID (FK users),
  
  name STRING,
  description TEXT,
  status ENUM['spine', 'pre_launch', 'backup', 'archived'],
  
  time_allocation_percent INT,
  revenue_target_3mo DECIMAL,
  revenue_target_1yr DECIMAL,
  revenue_target_3yr DECIMAL,
  revenue_actual_ytd DECIMAL,
  
  milestone_1 TEXT,
  milestone_2 TEXT,
  milestone_3 TEXT,
  
  thesis_alignment_ai TEXT,
  thesis_alignment_markets TEXT,
  thesis_alignment_capital TEXT,
  
  compounding_chain TEXT,
  
  customer_count INT,
  recurring_revenue DECIMAL,
  churn_rate DECIMAL,
  cac DECIMAL,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- WEEKLY SYNTHESIS
CREATE TABLE weekly_synthesis (
  id UUID PRIMARY KEY,
  user_id UUID (FK users),
  week_start_date DATE,
  
  ai_signal TEXT,
  markets_signal TEXT,
  mind_signal TEXT,
  
  arbitrage_tested TEXT,
  market_response TEXT,
  learning TEXT,
  did_compound BOOLEAN,
  
  built_on_last_week BOOLEAN,
  fragmented_or_focused TEXT,
  clarity_enabled_speed TEXT,
  should_kill TEXT,
  should_double TEXT,
  
  next_action_spine TEXT,
  next_action_market TEXT,
  next_action_intellectual TEXT,
  
  project_statuses JSONB,
  
  surprising_insight TEXT,
  pattern_to_break TEXT,
  pattern_to_adopt TEXT,
  thesis_still_valid BOOLEAN,
  thesis_adjustment TEXT,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- SESSION LOGS (For tracking focus time)
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY,
  user_id UUID (FK users),
  project_id UUID (FK projects),
  
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_minutes INT,
  notes TEXT,
  
  created_at TIMESTAMP
);
```

---

## 4. USER FLOWS

### Flow 1: Daily Sign-In & Logging

```
1. User visits dashboard.com
2. Not authenticated → Google Sign-In button
3. Click → Google Auth popup
4. Return authenticated → Home view
5. See today's spine project + allocated hours
6. Click [Start Session] or [Log Session]
7. Fill daily log (all 6 sections)
8. Click [SAVE LOG]
9. Dashboard updates with new data
10. See today's execution progress + trends
```

### Flow 2: Capture Signal (Real-Time)

```
1. During day, user notices market signal
2. Click [+ Add Signal] from anywhere on dashboard
3. Modal opens with signal form
4. Select signal type (problem/market/research/arbitrage)
5. Fill details
6. [Save Signal]
7. Signal appears in "Signals" library
8. Weekly, pick 1 arbitrage to test in 48h
```

### Flow 3: Weekly Synthesis (Sunday/Monday)

```
1. User navigates to "Weekly" tab
2. Pre-filled with top signals from the week
3. Reviews project health
4. Writes synthesis answers (AI signal, markets signal, etc.)
5. Identifies one action for next week
6. [Save Synthesis]
7. Option to [Email Summary] or [Export as PDF]
```

### Flow 4: Rebalance Portfolio (As Needed)

```
1. Go to "Projects" tab
2. See current time allocation vs. revenue
3. If imbalanced, review project cards
4. Update % allocation
5. Confirm compounding impact
6. [Save Portfolio]
```

---

## 5. DESIGN SPECIFICATIONS

### Color Palette (Match Armstrong if possible; otherwise):
- **Primary**: Dark slate / Navy (professional)
- **Accent**: Electric blue / Neon green (signal, action)
- **Success**: Emerald green (shipped, revenue)
- **Warning**: Amber (spiked, stalled)
- **Danger**: Coral red (should stop)
- **Neutral**: Warm grays

### Typography:
- **Headers**: Bold, sans-serif (Inter, Helvetica, or similar)
- **Body**: Clean sans-serif, readable at all sizes
- **Monospace**: For data/numbers

### Component Patterns (From Armstrong):
- **Cards**: Rounded corners, subtle shadow, hover state
- **Buttons**: Primary (filled), Secondary (outline), Tertiary (text)
- **Inputs**: Clear focus state, auto-save on blur
- **Progress bars**: Visual fill (e.g., focus hours: ▓▓▓░░░)
- **Status indicators**: 🟢 | 🟡 | 🔴 emoji or colored dots
- **Charts**: Line charts for trends (sleep, shipping, asks), bar charts for revenue

### Layout Grid:
- **Desktop**: 12-column grid, 3-column sidebar possible
- **Tablet**: 8-column grid, stack sections
- **Mobile**: Single column, collapsible sections

### Background:
- **Option 1**: Subtle Porsche + bikes image (low opacity, light blur)
- **Option 2**: Solid dark background + accent color accents
- **Option 3**: Gradient (dark to darker) with accent overlays

---

## 6. AUTHENTICATION FLOW (Technical)

```
Frontend (Next.js)
├─ pages/api/auth/[...nextauth].js
│  └─ GoogleProvider configured
│  └─ Callbacks: onSignIn, onJWT, onSession
│  └─ JWT encode/decode
│
├─ pages/auth/signin.js
│  └─ Google Sign-In button (NextAuth)
│
└─ middleware.ts
   └─ Protect /dashboard/* routes
   └─ Redirect /dashboard → /auth/signin if not authenticated

Database
├─ Store user on first sign-in
├─ Sync Google profile data
└─ Create empty records for projects (pre-populated)

Session Management
├─ JWT token (expires 30 days)
├─ Refresh token logic
└─ Logout clears session
```

---

## 7. TECH STACK RECOMMENDATIONS

```
Frontend:
- Framework: Next.js 14 (App Router)
- UI: React 18 + TailwindCSS
- Auth: NextAuth.js + Google OAuth
- State: Zustand or React Context
- Charts: Recharts
- Forms: React Hook Form + Zod validation
- Icons: Lucide React or Heroicons

Backend:
- API: Next.js API routes (/pages/api)
- Database: Supabase (PostgreSQL) or Firebase
- ORM: Prisma (if Supabase) or Firebase SDK
- Validation: Zod

Deployment:
- Hosting: Vercel (seamless Next.js integration)
- Domain: Your custom domain (e.g., thesisengine.yourdomain.com)
- Database: Supabase (auto-backups) or Firebase

Environment:
- .env.local for secrets (API keys, OAuth credentials)
```

---

## 8. MVP vs. FULL FEATURE SET

### MVP (Week 1-2):
- Google Auth
- Daily log form (all 6 sections)
- Projects overview (read-only, data pre-populated)
- Nervous system trends (basic charting)
- Settings page
- Mobile responsive

### Phase 2 (Week 3-4):
- Signal capture + library
- Weekly synthesis
- Project detail pages (with milestones, financials)
- Export/share functionality
- Email reminders

### Phase 3 (Post-MVP):
- Advanced charts (ROI over time, projection models)
- AI-powered insights ("You're fragmenting again")
- Slack integration (daily reminders, log quick updates)
- Mobile app (PWA or native)
- Collaboration (share projects with co-founders)

---

## 9. SUCCESS METRICS

- **Adoption**: Daily logins (target: 95%+ of days)
- **Engagement**: Time to log daily (target: <5 min)
- **Compliance**: Complete all 6 daily sections (target: 80%+)
- **Signal Quality**: % of captured signals that lead to action (target: >30%)
- **Portfolio Health**: Projects that compound week-over-week (target: >70%)
- **Thesis Alignment**: Weekly synthesis shows integration of AI + Markets + Mind (target: 100%)

---

## 10. INSTRUCTIONS FOR CLAUDE CODE

### You Have:
1. **This PRD** (complete specifications)
2. **Armstrong codebase** (reference architecture for design/interaction patterns)
3. **Lori's Thesis Engine concept** (the philosophy + content)

### Build In This Order:

1. **Data Schema** (Supabase tables + Prisma schema)
2. **Authentication** (NextAuth.js + Google OAuth)
3. **API Routes** (Create, read, update daily logs, signals, projects)
4. **Core Components** (Daily log form, projects dashboard, signals library)
5. **Pages** (Home, Projects, Signals, Weekly, Settings)
6. **Styling** (TailwindCSS, match Armstrong aesthetic)
7. **Charts** (Recharts for trends)
8. **Mobile Responsive** (Test on phone/tablet)
9. **Deploy** (Vercel → custom domain)

### Key Principles:
- **No friction**: Forms should be fast to fill (5 min max)
- **Armstrong vibes**: Professional, data-driven, clean
- **Real-time feedback**: Auto-save, visual progress
- **Mobile-first**: Works perfectly on phone (daily login on the go)
- **Extensible**: Easy to add new sections/projects later

### Reference Armstrong For:
- Component structure (cards, buttons, layouts)
- Color palette + typography
- Chart design
- Interaction patterns (hover states, transitions)
- Mobile responsiveness
- Data table design

---

## 11. POST-LAUNCH CHECKLIST

- [ ] Google Auth works (test sign in / sign out)
- [ ] Daily log submits and saves
- [ ] Data persists across sessions
- [ ] Weekly synthesis pre-fills with signals
- [ ] Projects show current time allocation
- [ ] Charts render correctly
- [ ] Mobile responsive tested
- [ ] Email reminders configured
- [ ] Export to PDF works
- [ ] Performance optimized (Core Web Vitals)
- [ ] Security reviewed (no XSS, CSRF protection)
- [ ] Domain configured + SSL

---

## END PRD

**Ready for Claude Code to build.** Reference Armstrong architecture. Mimic its aesthetic. Build the Thesis Engine dashboard.

