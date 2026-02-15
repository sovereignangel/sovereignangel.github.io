# WAVE.AI INTEGRATION GUIDE
## Voice-First Input via Folder Watching System

**Philosophy:** You speak naturally into Wave.ai anytime, anywhere. The system watches for new transcripts and automatically processes them. No forms, no app switching, no friction.

---

## OVERVIEW

### The Flow

```
You (speaking)
    ↓
Wave.ai (records + transcribes)
    ↓
Saves transcript to folder (Dropbox/Google Drive)
    ↓
System watches folder (every 5 min or webhook)
    ↓
Detects new file based on naming convention
    ↓
LLM processes transcript → extracts structured data
    ↓
Dashboard updates automatically
```

**Your time investment:** 30-90 seconds of speaking (whenever convenient)
**System processing time:** 2-3 minutes (automated)

---

## SETUP

### Step 1: Configure Wave.ai

**In Wave.ai settings:**
1. Enable "Auto-save transcripts"
2. Set save location: `/Dropbox/ThesisEngine/Voice/` (or Google Drive equivalent)
3. Set filename format: `{type}-{date}.txt`
4. Enable auto-sync

**Folder structure:**
```
/Dropbox/ThesisEngine/Voice/
├── daily-2026-03-15.txt
├── signal-2026-03-15-options-greeks.txt
├── goal-chess-2026-03-15.txt
└── processed/
    ├── daily-2026-03-15.txt (moved after processing)
    └── signal-2026-03-15-options-greeks.txt
```

### Step 2: Naming Convention

**The system processes files based on the first word of the filename:**

| Filename Prefix | What It Processes | Example |
|-----------------|-------------------|---------|
| `daily-*.txt` | Daily reflection (all inputs) | `daily-2026-03-15.txt` |
| `signal-*.txt` | Signal capture (arbitrage, problems) | `signal-2026-03-15-options-greeks.txt` |
| `goal-*.txt` | Goal update (progress, obstacles) | `goal-chess-2026-03-15.txt` |
| `ask-*.txt` | Revenue ask log (who, what, outcome) | `ask-2026-03-15-john-contract.txt` |
| `ship-*.txt` | What you shipped (details) | `ship-2026-03-15-greeks-calculator.txt` |

**When you create a recording in Wave.ai:**
- Title it: `daily` or `signal-options-greeks` or `goal-chess`
- Wave.ai will append the date automatically
- Result: `daily-2026-03-15.txt`

### Step 3: System Configuration

**Add to your `.env.local`:**
```bash
# Dropbox
DROPBOX_ACCESS_TOKEN=your_token_here
DROPBOX_FOLDER_PATH=/ThesisEngine/Voice/

# Or Google Drive
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
GOOGLE_DRIVE_SERVICE_ACCOUNT=path_to_credentials.json
```

**Folder watching options:**

**Option A: Polling (simple, works everywhere)**
```typescript
// Cron job runs every 5 minutes
// Check for new files in /Voice/
// Process any unprocessed files
// Move to /Voice/processed/ when done
```

**Option B: Webhook (instant, more complex)**
```typescript
// Dropbox webhook fires when new file added
// Trigger processing immediately
// No polling delay
```

**Recommendation: Start with Option A (polling), upgrade to Option B later**

---

## FILE PROCESSING

### LLM Prompts for Each File Type

#### 1. Daily Reflection (`daily-*.txt`)

**Example Wave.ai transcript:**
```
Today I shipped the Armstrong Greeks calculator. Took about 4 hours.
Made 3 asks - John for a $2k/month contract, Sarah for a pilot,
and Mark just a demo. John seemed interested, Sarah said maybe next month,
Mark wants to think about it.

Body feels good, open. Slept well last night, around 7.5 hours.
Nervous system is regulated, green. Did a VO2 max session this morning,
felt strong. 6 intervals at 90% max HR.

One insight - I noticed I'm way more confident asking for money when
I've just shipped something. Pattern: ship first, ask second.
Should keep doing that.
```

**LLM Processing Prompt:**

```
You are extracting structured data from Lori's daily voice reflection.

TRANSCRIPT:
"{transcript}"

Extract the following fields (if mentioned):

1. SHIPPED: What did she ship today? (brief summary)
2. FOCUS_HOURS: How many hours of deep work? (number, if mentioned)
3. REVENUE_ASKS:
   - Count: how many asks made?
   - List: array of {who, what, response}
4. NERVOUS_SYSTEM:
   - State: regulated|spiked|neutral (infer from language)
   - Mentioned: was it explicitly stated?
5. BODY_FELT:
   - State: open|neutral|tense (infer from language)
6. SLEEP_HOURS: Number (if mentioned)
7. TRAINING:
   - Type: VO2|strength|zone2|rest (if mentioned)
   - Details: any specifics
8. INSIGHTS:
   - Key realizations (array of strings)
   - Patterns noticed (array of strings)
9. EMOTIONAL_STATE: regulated|spiked|neutral (overall tone)
10. TOMORROW_FOCUS: What should she do tomorrow? (if mentioned)

OUTPUT (JSON):
{
  "shipped": "string or null",
  "focusHours": number or null,
  "revenueAsks": {
    "count": number,
    "list": [{who: "John", what: "$2k/mo contract", response: "interested"}]
  },
  "nervousSystemState": "regulated|spiked|neutral",
  "bodyFelt": "open|neutral|tense",
  "sleepHours": number or null,
  "training": {
    "type": "VO2|strength|zone2|rest|none",
    "details": "string or null"
  },
  "insights": ["insight 1", "insight 2"],
  "patterns": ["pattern 1"],
  "emotionalState": "regulated|spiked|neutral",
  "tomorrowFocus": "string or null"
}
```

**Result:**
```json
{
  "shipped": "Armstrong Greeks calculator",
  "focusHours": 4,
  "revenueAsks": {
    "count": 3,
    "list": [
      {"who": "John", "what": "$2k/mo contract", "response": "interested"},
      {"who": "Sarah", "what": "pilot", "response": "maybe next month"},
      {"who": "Mark", "what": "demo", "response": "wants to think"}
    ]
  },
  "nervousSystemState": "regulated",
  "bodyFelt": "open",
  "sleepHours": 7.5,
  "training": {
    "type": "VO2",
    "details": "6 intervals at 90% max HR"
  },
  "insights": [
    "More confident asking for money after shipping",
    "Ship first, ask second pattern works"
  ],
  "patterns": ["Confidence increases post-ship"],
  "emotionalState": "regulated",
  "tomorrowFocus": "Keep shipping then asking"
}
```

---

#### 2. Signal Capture (`signal-*.txt`)

**Example Wave.ai transcript:**
```
Signal - options traders need a way to see Greeks across all their positions
in one view. Right now they're using Excel spreadsheets or checking each
position individually in their broker. It's broken because it's manual,
error-prone, and takes 20-30 minutes every morning just to get a sense
of their portfolio risk.

Pain point is they can't react quickly to market moves if they don't know
their delta exposure. Current solutions are ThinkerSwim's analyze tab which
is slow and clunky, or paying $500/month for professional tools like
OptionVue.

AI angle - could auto-sync with broker APIs, calculate Greeks in real-time,
use ML to predict how Greeks will change as market moves. Also could use
LLMs to explain risk in plain English.

This feels like a 9 out of 10 revenue potential. People are already paying
$500/month for worse tools.
```

**LLM Processing Prompt:**

```
You are extracting a market signal from Lori's voice memo.

TRANSCRIPT:
"{transcript}"

Extract the following:

1. PROBLEM: What's broken? (1-2 sentences)
2. WHO_FEELS_PAIN: Who has this problem? (specific)
3. CURRENT_SOLUTION: How do they solve it today?
4. WHY_BROKEN: Why is the current solution bad?
5. AI_MARKET_ANGLE: How does AI/Markets/Mind intersect here?
6. REVENUE_POTENTIAL: 1-10 scale (if mentioned)
7. ARBITRAGE_GAP: What's the opportunity? (brief)
8. TIMELINE_TO_TEST: Days/weeks to validate (if mentioned)
9. ONE_ACTION: What's the first step to test this?

OUTPUT (JSON):
{
  "problem": "string",
  "whoFeelsPain": "string",
  "currentSolution": "string",
  "whyBroken": "string",
  "aiMarketAngle": "string",
  "revenuePotential": number (1-10),
  "arbitrageGap": "string",
  "timelineToTest": "string or null",
  "oneAction": "string or null",
  "signalType": "arbitrage|problem|research|market"
}
```

**Result:**
```json
{
  "problem": "Options traders need real-time Greeks across all positions in one view",
  "whoFeelsPain": "Active options traders managing 5+ positions",
  "currentSolution": "Excel spreadsheets or checking broker individually",
  "whyBroken": "Manual, error-prone, takes 20-30 min daily, can't react to market moves quickly",
  "aiMarketAngle": "Auto-sync with broker APIs, real-time Greeks calculation, ML prediction of Greeks changes, LLM risk explanation",
  "revenuePotential": 9,
  "arbitrageGap": "Current tools are $500/mo and clunky. Could build better for $50-200/mo",
  "timelineToTest": "2 weeks for MVP",
  "oneAction": "Build single-broker sync + Greeks display",
  "signalType": "arbitrage"
}
```

---

#### 3. Goal Update (`goal-*.txt`)

**Example Wave.ai transcript:**
```
Chess update - I'm at 1,247 ELO now, up from 1,200 last week.
Did tactics every day, about 15 puzzles daily, accuracy around 82%.
Played 8 games, won 5, lost 3.

Two games I lost were because I blundered in the opening - need to study
my opening lines more. The games I won were because my endgame is getting
stronger. I can see patterns now that I couldn't see 2 weeks ago.

For next week - focus on opening study, 30 minutes on weekends. Keep doing
daily tactics. Try to play slower games, I'm rushing too much in 10-minute
games.

Target for end of March is 1,260, so I'm on track. Feels good.
```

**LLM Processing Prompt:**

```
You are extracting a goal progress update from Lori's voice memo.

TRANSCRIPT:
"{transcript}"

Identify which goal this is about:
- Chess ELO (target: 1800 by Dec 2026)
- VO2 Max (target: 55 by Dec 2026)
- Revenue (target: $6k Mar, $8k Apr, $10k May, $12k Jun)
- AI Skills (research-lab ready by Dec 2026)
- Female LevelsIO (3 ships/week continuous)
- Female Aesthetic (sensual dance mastery by Dec 2026)

Extract:
1. GOAL: Which goal? (chess|vo2|revenue|ai|levelsio|aesthetic)
2. CURRENT: Current metric (number)
3. TARGET_THIS_MONTH: Target for this month (number)
4. PROGRESS_SUMMARY: What happened? (brief)
5. WINS: What went well? (array)
6. OBSTACLES: What was hard? (array)
7. INSIGHTS: What did she learn? (array)
8. NEXT_ACTIONS: What to do next? (array)
9. ON_TRACK: Is she on track? (yes|no|maybe)

OUTPUT (JSON):
{
  "goal": "chess|vo2|revenue|ai|levelsio|aesthetic",
  "current": number,
  "targetThisMonth": number,
  "progressSummary": "string",
  "wins": ["string"],
  "obstacles": ["string"],
  "insights": ["string"],
  "nextActions": ["string"],
  "onTrack": "yes|no|maybe"
}
```

**Result:**
```json
{
  "goal": "chess",
  "current": 1247,
  "targetThisMonth": 1260,
  "progressSummary": "Up 47 points in one week, played 8 games (5W-3L), daily tactics at 82% accuracy",
  "wins": [
    "Endgame patterns getting stronger",
    "Consistent daily practice (7/7 days)",
    "Win rate 62.5%"
  ],
  "obstacles": [
    "Blundering in openings (cost 2 games)",
    "Rushing in 10-minute games"
  ],
  "insights": [
    "Endgame study is paying off",
    "Opening prep is the weak link",
    "Need slower time controls to think"
  ],
  "nextActions": [
    "Opening study 30 min on weekends",
    "Continue daily tactics",
    "Play 15-min games instead of 10-min"
  ],
  "onTrack": "yes"
}
```

---

## TECHNICAL IMPLEMENTATION

### File Watcher Service

**Option 1: Cron Job (Simple)**

```typescript
// /app/api/cron/process-voice/route.ts

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { Dropbox } from 'dropbox'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const dropbox = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN })
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

  try {
    // List files in /Voice/ folder
    const response = await dropbox.filesListFolder({
      path: '/ThesisEngine/Voice',
    })

    const unprocessedFiles = response.entries.filter(
      (entry) => entry['.tag'] === 'file' && entry.name.endsWith('.txt')
    )

    for (const file of unprocessedFiles) {
      // Download file content
      const download = await dropbox.filesDownload({ path: file.path_lower! })
      const content = (download.result as any).fileBinary.toString('utf-8')

      // Determine file type from filename
      const fileName = file.name
      const fileType = fileName.split('-')[0] // 'daily', 'signal', 'goal', etc.

      // Process based on type
      let processedData
      switch (fileType) {
        case 'daily':
          processedData = await processDailyReflection(content, anthropic)
          await saveDailyLog(processedData, supabase)
          break
        case 'signal':
          processedData = await processSignal(content, anthropic)
          await saveSignal(processedData, supabase)
          break
        case 'goal':
          processedData = await processGoalUpdate(content, anthropic)
          await saveGoalUpdate(processedData, supabase)
          break
        default:
          console.log(`Unknown file type: ${fileType}`)
      }

      // Move file to processed folder
      await dropbox.filesMoveV2({
        from_path: file.path_lower!,
        to_path: `/ThesisEngine/Voice/processed/${fileName}`,
      })

      console.log(`Processed: ${fileName}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        filesProcessed: unprocessedFiles.length
      }),
      { status: 200 }
    )

  } catch (error) {
    console.error('File processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
}

async function processDailyReflection(transcript: string, anthropic: Anthropic) {
  const prompt = `You are extracting structured data from Lori's daily voice reflection.

TRANSCRIPT:
"${transcript}"

[... rest of prompt from above ...]

OUTPUT (JSON):
{...}`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to extract JSON')

  return JSON.parse(jsonMatch[0])
}

async function saveDailyLog(data: any, supabase: any) {
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('daily_logs')
    .upsert({
      date: today,
      user_id: process.env.USER_ID,
      what_shipped: data.shipped,
      focus_hours_actual: data.focusHours,
      revenue_asks_count: data.revenueAsks.count,
      revenue_asks_list: data.revenueAsks.list,
      nervous_system_state: data.nervousSystemState,
      body_felt: data.bodyFelt,
      sleep_hours: data.sleepHours,
      training_type: data.training.type,
      // ... other fields
      updated_at: new Date().toISOString()
    }, { onConflict: 'date,user_id' })

  if (error) throw error

  // Also save the raw reflection
  await supabase
    .from('reflections')
    .insert({
      user_id: process.env.USER_ID,
      date: today,
      raw_text: data.rawTranscript,
      insights: data.insights,
      patterns: data.patterns,
      emotional_state: data.emotionalState,
      // ... other fields
    })
}

// Similar functions for processSignal, processGoalUpdate, saveSignal, saveGoalUpdate
```

**Vercel Cron Configuration:**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-voice",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## USER EXPERIENCE

### Daily Workflow

**Evening (8:00 PM - anywhere, anytime):**

1. **Open Wave.ai**
2. **Create new recording, title: "daily"**
3. **Speak naturally (90 seconds):**

> "Hey, today was good. Shipped the Greeks calculator for Armstrong, took about 4 hours. Made 3 asks - John for the $2k contract, he seemed interested. Sarah said maybe next month. Mark wants to think about it.
>
> Body feels good, regulated. Slept 7.5 hours last night. Did VO2 max this morning, 6 intervals, felt strong.
>
> One insight - I'm way more confident asking when I've just shipped something. Should keep that pattern - ship first, ask second."

4. **Stop recording**
5. **Wave.ai auto-saves as `daily-2026-03-15.txt` to Dropbox**
6. **Close app, go on with your evening**

**5 minutes later (automated):**
- Cron job runs
- Detects new file
- LLM processes transcript
- Extracts all structured data
- Updates daily log
- Saves reflection
- Moves file to `/processed/`

**Next morning (6:00 AM):**
- You open Thesis Engine
- Everything from yesterday is already populated ✓
- Dashboard shows insights from your reflection
- LLM: "You mentioned ship → ask confidence. This is the 4th time. Pattern confirmed."

**Total time you spent:** 90 seconds speaking into Wave.ai
**Total time system spent:** 2-3 minutes processing (while you slept)

---

### Signal Capture (Anytime)

**You're walking and you notice something:**

1. **Open Wave.ai**
2. **Title: "signal-options-greeks"**
3. **Speak (30 seconds):**

> "Signal - options traders need real-time Greeks across all positions. Right now they use Excel, super manual, takes 20-30 minutes every morning. Pain point is they can't react to market moves quickly. Current solutions are $500/month tools that suck. AI angle - auto-sync broker APIs, calculate in real-time, explain risk with LLMs. Revenue potential 9 out of 10."

4. **Done**

**System processes automatically:**
- Extracts structured signal
- Adds to signal library
- Tags as "arbitrage" (high revenue potential)
- Flags for weekly review

---

## ADVANTAGES OF THIS APPROACH

### 1. No App Switching
- You're already using Wave.ai
- No custom voice UI to build
- Works on phone, desktop, anywhere

### 2. Offline-First
- Record offline (walking, driving, anywhere)
- Syncs when connected
- No "must be online" constraint

### 3. More Natural
- Speak freely, not filling forms
- No structured prompts ("tap here, say this")
- Just talk like you're journaling

### 4. Flexible Length
- 30 seconds for quick signal
- 5 minutes for deep reflection
- System handles both

### 5. Asynchronous
- Record anytime
- System processes in background
- Dashboard updates when ready

### 6. Lower Cost
- No Whisper API ($0/month saved)
- Wave.ai already transcribes ($10/month you're paying anyway)
- Only LLM processing cost (~$15/month)

### 7. Built-In Backup
- All transcripts saved in Dropbox
- Original audio in Wave.ai
- Never lose data

---

## CALENDAR TIME TRACKING SETUP

### Color-Coded Calendar System

**Create calendar categories in Google Calendar:**

| Color | Project | Use |
|-------|---------|-----|
| 🟦 **Blue** | Armstrong | All Armstrong work (coding, calls, research) |
| 🟩 **Green** | Manifold | All Manifold work |
| 🟪 **Purple** | Deep Tech Fund | Fund calls, research, networking |
| 🟨 **Yellow** | Learning | Stanford RL, papers, courses |
| 🟧 **Orange** | Meetings | External meetings, calls |
| ⬜ **White** | Admin | Email, admin, misc |

**How to use:**
1. At start of focus session: Create calendar event
   - Title: "Armstrong - Greeks calculator"
   - Color: Blue
   - Duration: Actual time you'll work
2. If you work longer/shorter: Adjust event end time
3. System syncs daily, calculates time allocation by color

**API extracts:**
```typescript
const calendarEvents = await calendar.events.list({
  calendarId: 'primary',
  timeMin: startOfDay.toISOString(),
  timeMax: endOfDay.toISOString(),
})

const timeByProject = {
  armstrong: 0,
  manifold: 0,
  deepTech: 0,
  learning: 0,
}

calendarEvents.data.items?.forEach(event => {
  const duration = (event.end.dateTime - event.start.dateTime) / (1000 * 60 * 60) // hours

  switch (event.colorId) {
    case '1': // Blue
      timeByProject.armstrong += duration
      break
    case '2': // Green
      timeByProject.manifold += duration
      break
    // ... etc
  }
})

// Result: { armstrong: 4.5, manifold: 1.0, deepTech: 0.5, learning: 2.0 }
```

**Benefits:**
- No separate time tracker needed
- Calendar you already maintain
- Visual overview of your day
- Auto-syncs to Thesis Engine
- Can adjust retroactively if needed

---

## SETUP CHECKLIST

**This week:**
- [ ] Configure Wave.ai to auto-save transcripts to Dropbox folder
- [ ] Create `/ThesisEngine/Voice/` folder in Dropbox
- [ ] Test: Record "daily" memo, verify file appears
- [ ] Set up color-coded Google Calendar
- [ ] Create sample events for each project color
- [ ] Test: Verify calendar API can read events by color

**Next week (implementation):**
- [ ] Build Dropbox file watcher (cron job)
- [ ] Build LLM processing for each file type
- [ ] Test: Record → file → process → dashboard updates
- [ ] Build calendar sync (daily time allocation)

**Week after:**
- [ ] Go live with Wave.ai → system flow
- [ ] Use daily for 7 consecutive days
- [ ] Iterate on LLM prompts (improve extraction accuracy)

---

**You now have a fully voice-first, zero-friction input system.**

**Total daily time: <2 minutes (just speak into Wave.ai)**
**Total setup time: 1 week**
**Result: Automated life portfolio management with natural voice input**

Build it.
