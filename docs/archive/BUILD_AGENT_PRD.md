# BUILD AGENT: Telegram → PRD → Build → Deploy → Iterate
## Product Requirements Document

**Project:** Autonomous Build Agent for Thesis Engine Ecosystem
**Owner:** Lori
**Status:** Specification
**Date:** February 2026

---

## 1. WHAT THIS IS

A self-managing build agent that turns Telegram conversations into deployed products. You describe what you want, the agent generates a PRD, builds it, deploys it to a subdomain of `loricorpuz.com`, and accepts iterative feedback — all through Telegram.

**The loop:**

```
You (Telegram) ─── "I want an app that does X"
       │
       ▼
Agent ─── Generates PRD ─── Sends to you for review
       │
       ▼
You ─── "Approved" (or "Change Y")
       │
       ▼
Agent ─── Creates repo ─── Builds with Claude Code ─── Deploys
       │
       ▼
Agent ─── Sends live link: project.loricorpuz.com
       │                    Adds to loricorpuz.com/outputs
       ▼
You ─── "Make the header bigger, add dark mode"
       │
       ▼
Agent ─── Iterates ─── Redeploys ─── Sends updated link
```

**What already exists:**
- Telegram bot that receives journal entries → writes to Thesis Engine (Firestore)
- Thesis Engine dashboard (Next.js, Firebase, deployed somewhere)
- `loricorpuz.com` domain on Cloudflare DNS
- Project context files (PRD, philosophy, reward function, etc.)
- **Claude Max 20x plan** ($200/mo, includes Claude Code — no per-token API costs)

**What this adds:**
- PRD generation from natural language
- Autonomous code generation + deployment
- Subdomain provisioning per project
- Portfolio page integration
- Feedback loop for iteration

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│                    TELEGRAM BOT                         │
│  (Extended from existing bot)                           │
│  Commands: /build, /status, /iterate, /list, /journal   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  ORCHESTRATOR                            │
│  (Cloud Function or persistent server)                  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ PRD      │  │ Build    │  │ Deploy   │             │
│  │ Generator│  │ Manager  │  │ Manager  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  State Machine:                                         │
│  IDEA → PRD_DRAFT → PRD_APPROVED → BUILDING →          │
│  DEPLOYING → LIVE → ITERATING                          │
└────────┬──────────────┬──────────────┬─────────────────┘
         │              │              │
         ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Claude   │  │ GitHub   │  │ Cloudflare│
   │ API      │  │ API      │  │ + Vercel  │
   │ (PRD gen)│  │ (repos)  │  │ (deploy)  │
   └──────────┘  └──────────┘  └──────────┘
```

### 2.2 Technology Choices

| Component | Technology | Why |
|-----------|-----------|-----|
| **Telegram Bot** | Node.js + Grammy/Telegraf | Extend existing bot |
| **Orchestrator** | Firebase Cloud Functions (or Railway) | Serverless, integrates with existing Firestore |
| **PRD Generation** | Claude Code (Sonnet) via Max plan | $0 per-token, fast, good at structured output |
| **Code Generation** | Claude Code CLI (Opus) via Max plan | $0 per-token, best at autonomous coding |
| **Repo Management** | GitHub API (Octokit) | Create repos, push code, manage branches |
| **Deployment** | Vercel API | Auto-deploy from GitHub, supports subdomains |
| **DNS** | Cloudflare API | Wildcard subdomain → Vercel |
| **State Store** | Firestore | Already have it, stores project state |
| **Portfolio Page** | loricorpuz.com (existing site) | Auto-update outputs section |

### 2.3 Data Flow (Detailed)

```
STEP 1: IDEA CAPTURE
─────────────────────
User sends: "/build Options calculator that shows Greeks visually"
  → Bot parses intent
  → Creates Firestore doc: /agent_projects/{id}
    {
      status: "IDEA",
      description: "Options calculator that shows Greeks visually",
      created: timestamp,
      telegram_chat_id: "...",
      messages: [{ role: "user", content: "..." }]
    }

STEP 2: PRD GENERATION
─────────────────────
Orchestrator triggers:
  → Loads project context (thesis files, existing PRDs)
  → Calls Claude API with system prompt + user description
  → Generates structured PRD (JSON + markdown)
  → Saves to Firestore: status → "PRD_DRAFT"
  → Sends PRD summary to Telegram
  → Asks: "Approve this PRD? Reply 'approve' or give feedback"

STEP 3: BUILD
─────────────
User approves:
  → GitHub API: Create repo `sovereignangel/[project-name]`
  → GitHub API: Push initial scaffold (Next.js template)
  → Trigger Claude Code (via subprocess or API):
    - Input: PRD + project context
    - Working dir: cloned repo
    - Output: Complete implementation
  → GitHub API: Push built code
  → Firestore: status → "BUILDING" → "BUILT"

STEP 4: DEPLOY
──────────────
Build complete:
  → Vercel API: Import GitHub repo as new project
  → Vercel API: Set custom domain: [project].loricorpuz.com
  → Cloudflare API: Add CNAME record (if not using wildcard)
  → Wait for deployment to complete
  → Firestore: status → "DEPLOYING" → "LIVE"
  → Send Telegram: "🚀 Live at https://[project].loricorpuz.com"

STEP 5: PORTFOLIO UPDATE
─────────────────────────
  → Firestore: Add to /portfolio_projects collection
  → Trigger rebuild of loricorpuz.com outputs page
    (reads from Firestore, renders project cards)

STEP 6: ITERATE
───────────────
User sends: "/iterate [project-name] Make header bigger, add dark mode"
  → Orchestrator loads project context + current codebase
  → Calls Claude Code with iteration instructions
  → Push changes to GitHub
  → Vercel auto-deploys (GitHub integration)
  → Send Telegram: "✅ Updated: https://[project].loricorpuz.com"
```

---

## 3. TELEGRAM BOT COMMANDS

### 3.1 Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `/build <description>` | Start a new project | `/build Options Greeks visualizer with 3D surface plots` |
| `/approve` | Approve current PRD draft | `/approve` |
| `/feedback <text>` | Give feedback on PRD before approving | `/feedback Add a dark mode toggle and make it mobile-first` |
| `/iterate <project> <changes>` | Request changes to live project | `/iterate greeks-viz Add implied vol surface` |
| `/status` | Show all projects and their states | `/status` |
| `/status <project>` | Show specific project details | `/status greeks-viz` |
| `/list` | List all deployed projects with URLs | `/list` |
| `/kill <project>` | Take down a project (archive) | `/kill old-experiment` |
| `/journal <entry>` | Existing: daily journal logging | `/journal Shipped Armstrong feature, 3 asks made` |
| `/log` | Existing: quick daily log entry | `/log` |

### 3.2 Conversational Mode

The bot should also support natural conversation without commands:

```
User: "hey can you build me a landing page for Armstrong"
Bot:  "Got it. Let me draft a PRD for an Armstrong landing page.

      Here's what I'm thinking:
      ─────────────────────────
      PROJECT: armstrong-landing
      TYPE: Marketing landing page
      FEATURES:
      • Hero section with value prop
      • Feature showcase (3-4 key features)
      • Pricing section
      • CTA → signup/waitlist
      • Mobile responsive

      Should I proceed with this? Reply 'approve' or tell me what to change."

User: "add testimonials section and make it dark theme"
Bot:  "Updated PRD:
      • Added testimonials section
      • Dark theme as default
      Approve?"

User: "approve"
Bot:  "🔨 Building armstrong-landing...
       I'll send you the live link when it's ready (usually 3-5 min)"

      [3 minutes later]

Bot:  "🚀 Live: https://armstrong-landing.loricorpuz.com
       Added to your portfolio at loricorpuz.com/outputs

       Want to make any changes? Just tell me."
```

### 3.3 Status Messages

The bot sends status updates at each state transition:

```
📋 PRD drafted for [project-name] — review and approve
🔨 Building [project-name]... (estimated 3-5 min)
📦 Build complete, deploying...
🚀 Live at https://[project].loricorpuz.com
✅ [project] updated with your changes
🗑️ [project] archived and taken offline
```

---

## 4. PRD GENERATOR

### 4.1 How It Works

The PRD Generator is a Claude API call with a carefully constructed system prompt that includes:

1. **Your project context** (loaded from Firestore or project files):
   - Thesis Engine philosophy
   - Brand strategy (Bridgewater × Leonardo × Rubin × Mozart)
   - Design system (Armstrong aesthetic)
   - Existing tech stack info

2. **PRD template structure** (what every PRD should contain):
   - Project name + one-liner
   - Problem statement
   - Feature list (prioritized)
   - Tech stack recommendation
   - Data schema (if applicable)
   - User flows
   - Design notes (Armstrong aesthetic defaults)
   - Success metrics
   - Deployment target

3. **User's description** (from Telegram message)

### 4.2 System Prompt (PRD Generation)

```
You are a product architect for Lori's project ecosystem. 

CONTEXT:
- All projects deploy to [name].loricorpuz.com
- Default stack: Next.js 14 + TailwindCSS + TypeScript
- Default aesthetic: Armstrong design system (muted earth tones, serif 
  headers, mono values, compact cards, data-driven transparency)
- Database: Firebase/Firestore (shared with Thesis Engine)
- Auth: Google OAuth via NextAuth (if needed)
- Charts: Recharts
- Deploy: Vercel

BRAND PRINCIPLES:
- Data speaks. Hide nothing. (Bridgewater)
- Observe more. Ship faster. (Leonardo)  
- Remove, don't add. (Rubin)
- Make the complex feel simple. (Mozart)

Given the user's description, generate a PRD in this JSON structure:
{
  "projectName": "kebab-case-name",
  "title": "Human Readable Title",
  "oneLiner": "One sentence description",
  "problem": "What problem does this solve?",
  "features": [
    { "name": "Feature", "description": "...", "priority": "P0|P1|P2" }
  ],
  "techStack": {
    "framework": "next.js 14",
    "styling": "tailwindcss",
    "database": "firestore|none",
    "auth": "nextauth|none",
    "apis": ["list of external APIs if any"]
  },
  "dataSchema": { ... },
  "userFlows": ["Step 1 → Step 2 → ..."],
  "designNotes": "Armstrong aesthetic, specific notes",
  "successMetrics": ["metric 1", "metric 2"],
  "estimatedBuildTime": "X minutes",
  "subDomain": "project-name.loricorpuz.com"
}

Also generate a human-readable summary (3-5 lines) to send back 
via Telegram for approval.
```

### 4.3 PRD Storage

```typescript
// Firestore: /agent_projects/{projectId}
interface AgentProject {
  id: string;
  projectName: string;           // kebab-case
  title: string;
  status: ProjectStatus;
  
  // PRD
  prd: {
    raw: string;                 // Full PRD JSON
    summary: string;             // Telegram-friendly summary
    version: number;             // Increments with feedback
    approvedAt: Timestamp | null;
  };
  
  // Build
  build: {
    repoUrl: string | null;      // GitHub repo URL
    buildLog: string[];          // Build progress messages
    startedAt: Timestamp | null;
    completedAt: Timestamp | null;
  };
  
  // Deploy
  deploy: {
    vercelProjectId: string | null;
    url: string | null;          // [name].loricorpuz.com
    deployedAt: Timestamp | null;
  };
  
  // Iteration history
  iterations: {
    request: string;
    completedAt: Timestamp;
  }[];
  
  // Meta
  telegramChatId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt: Timestamp | null;
}

type ProjectStatus = 
  | 'IDEA'
  | 'PRD_DRAFT'
  | 'PRD_FEEDBACK' 
  | 'PRD_APPROVED'
  | 'BUILDING'
  | 'BUILD_FAILED'
  | 'DEPLOYING'
  | 'DEPLOY_FAILED'
  | 'LIVE'
  | 'ITERATING'
  | 'ARCHIVED';
```

---

## 5. BUILD MANAGER

### 5.1 How Code Generation Works

This is the most complex part. There are two approaches, and you should start with Option A:

**Option A: Claude Code CLI (Recommended)**

```bash
# The orchestrator:
# 1. Clones the new repo locally (or in a container)
# 2. Writes the PRD as CLAUDE.md in the repo root
# 3. Runs Claude Code with the PRD as instruction

git clone https://github.com/sovereignangel/{project-name}.git
cd {project-name}

# Write PRD + context as instruction file
cat > CLAUDE.md << 'EOF'
# Build Instructions

## PRD
{generated PRD content}

## Design System
{Armstrong design tokens}

## Tech Stack
- Next.js 14, App Router
- TailwindCSS
- TypeScript
- Deploy target: Vercel

## Instructions
Build this project according to the PRD above.
- Use `npx create-next-app@latest . --typescript --tailwind --app`
- Follow Armstrong design aesthetic
- Make it production-ready
- Include README.md
EOF

# Run Claude Code
claude --yes --max-turns 50 "Read CLAUDE.md and build this project completely"

# Push results
git add -A
git commit -m "Initial build from Build Agent"
git push origin main
```

**Option B: Claude API + File Generation (Fallback)**

If Claude Code CLI isn't available in the orchestrator environment, use the Claude API to generate individual files:

```typescript
// Generate file list from PRD
const fileList = await generateFileList(prd);

// For each file, generate content
for (const file of fileList) {
  const content = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    system: `You are building ${prd.title}. Generate the content for ${file.path}.
             Tech stack: ${prd.techStack}. Design: Armstrong aesthetic.`,
    messages: [{ role: "user", content: `Generate ${file.path} for this PRD: ${prd.raw}` }]
  });
  
  await github.createOrUpdateFile(repo, file.path, content);
}
```

### 5.2 Build Environment

**Option A: Local/Server (Simplest)**
- A persistent server (Railway, Render, or your home machine)
- Has Node.js, git, Claude Code CLI installed
- Orchestrator SSHes in or runs directly

**Option B: GitHub Actions (Serverless)**
- Trigger a GitHub Action workflow on repo creation
- Action installs Claude Code, runs it, pushes results
- No persistent server needed

**Option C: Container (Most Isolated)**
- Spin up a Docker container per build
- Pre-loaded with Node.js, Claude Code
- Tear down after build completes

**Recommendation:** Start with Option A (Railway or your home machine). Move to GitHub Actions once proven.

### 5.3 Scaffold Templates

Pre-built templates speed up Claude Code's work:

```
/templates/
  /nextjs-app/          # Standard Next.js 14 app
    package.json
    tsconfig.json
    tailwind.config.ts
    next.config.js
    app/layout.tsx       # Armstrong design tokens pre-loaded
    app/page.tsx
    app/globals.css      # Armstrong color palette
    
  /nextjs-dashboard/    # Dashboard variant (Thesis Engine-style)
    (above +)
    components/Card.tsx
    components/Chart.tsx
    lib/firebase.ts
    
  /landing-page/        # Marketing page
    (minimal Next.js +)
    components/Hero.tsx
    components/Features.tsx
    components/CTA.tsx
    
  /api-only/            # Backend service
    (Express or Next.js API routes)
```

The orchestrator selects a template based on PRD analysis, then Claude Code builds on top of it.

---

## 6. DEPLOY MANAGER

### 6.1 Vercel Deployment

```typescript
// Step 1: Import repo to Vercel
const project = await vercel.createProject({
  name: prd.projectName,
  gitRepository: {
    repo: `sovereignangel/${prd.projectName}`,
    type: "github"
  },
  framework: "nextjs"
});

// Step 2: Set custom domain
await vercel.addDomain(project.id, {
  name: `${prd.projectName}.loricorpuz.com`
});

// Step 3: Trigger deployment
// (Automatic from GitHub push, or manual trigger)
const deployment = await vercel.createDeployment({
  projectId: project.id,
  target: "production"
});

// Step 4: Wait for deployment
await pollDeploymentStatus(deployment.id);
```

### 6.2 Cloudflare DNS Setup

**One-time setup (do this once):**

Option A — Wildcard CNAME:
```
*.loricorpuz.com  CNAME  cname.vercel-dns.com
```
This routes ALL subdomains to Vercel. Vercel then routes to the correct project based on the domain configured in step 6.1.

Option B — Per-project CNAME (if wildcard causes issues):
```typescript
// Cloudflare API: Add CNAME for each new project
await cloudflare.dns.records.create({
  zone_id: ZONE_ID,
  type: "CNAME",
  name: prd.projectName,  // e.g., "greeks-viz"
  content: "cname.vercel-dns.com",
  proxied: true
});
```

**Recommendation:** Use wildcard CNAME. One-time setup, no per-project DNS changes needed.

### 6.3 Portfolio Page Update

When a project goes LIVE, update the outputs page on `loricorpuz.com`:

```typescript
// Firestore: /portfolio_projects/{projectName}
interface PortfolioProject {
  name: string;
  title: string;
  description: string;
  url: string;
  status: 'live' | 'archived';
  createdAt: Timestamp;
  screenshot: string | null;  // Auto-captured after deploy
  tags: string[];             // e.g., ['armstrong', 'tools', 'dashboard']
}

// loricorpuz.com/outputs reads from this collection
// and renders project cards dynamically
```

The outputs page on `loricorpuz.com` should:
1. Read from Firestore `/portfolio_projects`
2. Render cards with: title, description, live link, screenshot, date
3. Sort by most recent
4. Filter by tags (optional)

---

## 7. STATE MACHINE

### 7.1 Project Lifecycle

```
                    ┌──────────────┐
         ┌─────────│     IDEA     │
         │         └──────┬───────┘
         │                │ PRD generated
         │                ▼
         │         ┌──────────────┐
         │    ┌────│  PRD_DRAFT   │◄───┐
         │    │    └──────┬───────┘    │
         │    │           │ approved    │ feedback
         │    │           ▼            │
         │    │    ┌──────────────┐    │
         │    │    │ PRD_APPROVED │────┘
         │    │    └──────┬───────┘
         │    │           │ build started
         │    │           ▼
         │    │    ┌──────────────┐
         │    ├────│   BUILDING   │
         │    │    └──────┬───────┘
         │    │           │ build complete
         │    │           ▼
         │    │    ┌──────────────┐
         │    │    │  DEPLOYING   │
         │    │    └──────┬───────┘
         │    │           │ deploy complete
         │    │           ▼
         │    │    ┌──────────────┐
         │    │    │     LIVE     │◄───┐
         │    │    └──────┬───────┘    │
         │    │           │ iterate     │ redeploy
         │    │           ▼            │
         │    │    ┌──────────────┐    │
         │    │    │  ITERATING   │────┘
         │    │    └──────────────┘
         │    │
         │    │    ┌──────────────┐
         │    ├───►│ BUILD_FAILED │──► retry or archive
         │    │    └──────────────┘
         │    │
         │    │    ┌──────────────┐
         │    └───►│DEPLOY_FAILED │──► retry or archive
         │         └──────────────┘
         │
         │         ┌──────────────┐
         └────────►│   ARCHIVED   │
                   └──────────────┘
```

### 7.2 Error Handling

| Error | Recovery | User Message |
|-------|----------|-------------|
| PRD generation fails | Retry with simpler prompt | "Couldn't generate PRD. Can you describe it differently?" |
| Build fails | Send error log, offer manual fix | "Build failed. Here's what went wrong: [error]. Want me to retry?" |
| Deploy fails | Retry deploy, check DNS | "Deploy failed. Retrying... If this persists, I'll check the config." |
| Iteration fails | Show diff, offer rollback | "Couldn't apply changes. Current version still live. Want to try different wording?" |
| Timeout (>10 min) | Cancel, notify | "Build is taking longer than expected. I'll notify you when done." |

---

## 8. SECURITY & SECRETS

### 8.1 Required API Keys / Tokens

| Secret | Where Used | How to Get |
|--------|-----------|------------|
| `TELEGRAM_BOT_TOKEN` | Bot auth | @BotFather on Telegram |
| `ANTHROPIC_API_KEY` | PRD gen + Claude Code | console.anthropic.com |
| `GITHUB_PAT` | Repo creation, push | GitHub Settings → Developer → PAT |
| `VERCEL_TOKEN` | Project creation, deploy | Vercel Settings → Tokens |
| `CLOUDFLARE_API_TOKEN` | DNS management | Cloudflare dashboard → API Tokens |
| `CLOUDFLARE_ZONE_ID` | DNS zone for loricorpuz.com | Cloudflare dashboard → Overview |
| `FIREBASE_*` | Firestore read/write | Firebase console → Project settings |

### 8.2 Secret Storage

- **Development:** `.env.local` (gitignored)
- **Production:** Firebase environment config / Railway env vars / Vercel env vars
- **Never** commit secrets to git
- **Never** send secrets via Telegram

### 8.3 Access Control

- Only your Telegram user ID can trigger builds
- GitHub repos created under your account
- Vercel projects under your account
- All projects private by default (public only on your command)

```typescript
// Bot middleware: restrict to your user ID
const ALLOWED_USER_IDS = [YOUR_TELEGRAM_USER_ID];

bot.use((ctx, next) => {
  if (!ALLOWED_USER_IDS.includes(ctx.from?.id)) {
    return ctx.reply("Unauthorized.");
  }
  return next();
});
```

---

## 9. INTEGRATION WITH THESIS ENGINE

### 9.1 How Build Agent Fits the Thesis

The Build Agent is itself a thesis-aligned tool:

| Thesis Principle | Build Agent Implementation |
|-----------------|--------------------------|
| **Speed of Embarrassment** | Ship in 5 minutes, not 5 days |
| **Distribution > Product** | Deployed instantly, iterate from feedback |
| **Female LevelsIO** | One-person product factory |
| **Capture Ratio (κ)** | Every project has a revenue potential tag |
| **Fragmentation Tax** | Agent enforces one project at a time in build queue |

### 9.2 Shared Data with Thesis Engine

The Build Agent writes to the same Firestore as Thesis Engine:

```
Firestore:
  /users/{userId}/                    ← Thesis Engine
  /daily_logs/{date}/                 ← Thesis Engine
  /agent_projects/{projectId}/        ← Build Agent
  /portfolio_projects/{projectName}/  ← Build Agent → loricorpuz.com
  /signals/{signalId}/                ← Thesis Engine
```

**Cross-references:**
- When you `/build` from a signal: link `agent_projects.sourceSignalId` → `signals/{id}`
- When a project goes live: auto-log a "ship" event in daily_logs
- Build Agent projects show in Thesis Engine's project portfolio view

### 9.3 Auto-Logging Ships

When a project deploys or iterates:

```typescript
// Auto-create daily log entry for the ship
await firestore.collection('daily_logs').doc(today).set({
  whatShipped: `Deployed ${project.title} to ${project.deploy.url}`,
  publicIteration: true,
  // ... merge with existing log
}, { merge: true });
```

This means your Thesis Engine reward score automatically gets credit for ships triggered through the Build Agent.

---

## 10. BUILD QUEUE & CONCURRENCY

### 10.1 Queue Rules

- **One build at a time** (prevents fragmentation)
- **FIFO queue** for multiple requests
- **Iterations on live projects** skip the queue (fast path)
- **Build timeout:** 10 minutes max
- **Deploy timeout:** 5 minutes max

### 10.2 Queue Implementation

```typescript
// Firestore: /agent_queue
interface QueueItem {
  projectId: string;
  type: 'build' | 'iterate';
  priority: number;         // 0 = highest
  createdAt: Timestamp;
  startedAt: Timestamp | null;
  status: 'queued' | 'running' | 'done' | 'failed';
}

// Queue processor (runs every 30 seconds or on trigger)
async function processQueue() {
  const running = await getRunningJobs();
  if (running.length > 0) return; // One at a time
  
  const next = await getNextQueued();
  if (!next) return;
  
  await startJob(next);
}
```

---

## 11. OUTPUTS PAGE (loricorpuz.com/outputs)

### 11.1 Design

The outputs page on `loricorpuz.com` should display all deployed projects as a portfolio grid:

```
┌─────────────────────────────────────────────────────────┐
│  OUTPUTS                                                │
│  Projects shipped from the Thesis Engine                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ screenshot  │  │ screenshot  │  │ screenshot  │    │
│  │             │  │             │  │             │    │
│  │ Greeks Viz  │  │ Armstrong   │  │ Signal      │    │
│  │ Options     │  │ Landing     │  │ Tracker     │    │
│  │ Greeks in 3D│  │ Page        │  │             │    │
│  │             │  │             │  │             │    │
│  │ Feb 2026    │  │ Feb 2026    │  │ Mar 2026    │    │
│  │ [Visit →]   │  │ [Visit →]   │  │ [Visit →]   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Data Source

```typescript
// loricorpuz.com/outputs/page.tsx
const projects = await firestore
  .collection('portfolio_projects')
  .where('status', '==', 'live')
  .orderBy('createdAt', 'desc')
  .get();

// Render project cards
```

### 11.3 Screenshot Capture

After deployment, auto-capture a screenshot for the portfolio card:

```typescript
// Use Vercel's OG Image or a headless browser
const screenshot = await captureScreenshot(project.deploy.url);
await storage.upload(`screenshots/${project.name}.png`, screenshot);
await firestore.doc(`portfolio_projects/${project.name}`).update({
  screenshot: `screenshots/${project.name}.png`
});
```

---

## 12. IMPLEMENTATION PHASES

### Phase 1: Extend Telegram Bot (Day 1)

**Goal:** Bot can receive `/build` command and generate a PRD

**Tasks:**
- [ ] Add `/build` command handler
- [ ] Add `/approve` and `/feedback` handlers
- [ ] Wire up Claude API for PRD generation
- [ ] Store project state in Firestore
- [ ] Send PRD summary back to Telegram

**Test:** `/build simple calculator` → receive PRD in Telegram → `/approve`

### Phase 2: GitHub + Build (Day 2-3)

**Goal:** Agent can create a repo and build code

**Tasks:**
- [ ] GitHub API: Create repo from template
- [ ] Set up build environment (local or Railway)
- [ ] Write Claude Code orchestration script
- [ ] Handle build success/failure
- [ ] Push built code to GitHub

**Test:** Approved PRD → repo created → code built → pushed to GitHub

### Phase 3: Deploy Pipeline (Day 3-4)

**Goal:** Agent can deploy to Vercel and set up subdomain

**Tasks:**
- [ ] Cloudflare: Set up wildcard CNAME (one-time)
- [ ] Vercel API: Import repo + set custom domain
- [ ] Poll deployment status
- [ ] Send live URL to Telegram

**Test:** Built repo → deployed → accessible at [name].loricorpuz.com

### Phase 4: Iteration Loop (Day 4-5)

**Goal:** Agent can accept feedback and redeploy

**Tasks:**
- [ ] `/iterate` command handler
- [ ] Claude Code iteration (modify existing code)
- [ ] Auto-push + auto-deploy
- [ ] Status updates in Telegram

**Test:** `/iterate greeks-viz add dark mode` → changes deployed → updated link

### Phase 5: Portfolio Integration (Day 5-6)

**Goal:** Deployed projects appear on loricorpuz.com/outputs

**Tasks:**
- [ ] Firestore portfolio_projects collection
- [ ] Outputs page component on loricorpuz.com
- [ ] Screenshot capture after deploy
- [ ] Auto-log ships to Thesis Engine daily_logs

**Test:** Deploy project → appears on loricorpuz.com/outputs with screenshot

### Phase 6: Polish (Day 6-7)

**Goal:** Error handling, edge cases, reliability

**Tasks:**
- [ ] Build queue enforcement
- [ ] Error recovery (retry logic)
- [ ] Timeout handling
- [ ] Status reporting (`/status`)
- [ ] Archive/kill flow (`/kill`)
- [ ] Natural language parsing (not just commands)

---

## 13. COST ANALYSIS

### Claude Code: Included in Max Plan ($0 Extra)

You're on **Max 20x ($200/month)**, which includes Claude Code usage at no additional per-token cost. All Claude Code builds and iterations draw from your plan allowance, not API billing.

**Critical setup — do this once:**
```bash
npm install -g @anthropic-ai/claude-code
claude login              # Choose "Claude.ai account" (NOT API key)
unset ANTHROPIC_API_KEY   # Remove any API key env var — otherwise it bills per-token
/status                   # Verify you're on Max 20x
```

**⚠️ WARNING:** If `ANTHROPIC_API_KEY` is set as an environment variable, Claude Code will silently charge per-token at API rates ($15 in / $75 out per million tokens for Opus) instead of using your Max plan. Always verify with `/status`.

### Max 20x Capacity for Build Agent

| Resource | Limit | Build Agent Usage |
|----------|-------|------------------|
| Messages per 5-hour window | ~900 | ~30-50 per project build |
| Projects per window | — | **~15-20 builds** before limit |
| Weekly active hours | ~240-480 | Far exceeds agent needs |
| Window reset | Every 5 hours | ~4-5 windows per day |

### Per-Project Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| Claude Code (PRD gen) | **$0** | Included in Max 20x |
| Claude Code (build) | **$0** | Included in Max 20x |
| Claude Code (iterate) | **$0** | Included in Max 20x |
| GitHub | Free | Public repos free |
| Vercel | Free | Hobby plan: 100 deploys/day |
| Cloudflare | Free | DNS is free |
| **Total per new project** | **$0** | |
| **Total per iteration** | **$0** | |

### Monthly Cost (Fixed)

| Component | Cost |
|-----------|------|
| Max 20x subscription | $200/month (already paying) |
| GitHub | $0 |
| Vercel (Hobby) | $0 |
| Cloudflare (DNS) | $0 |
| **Total additional cost for Build Agent** | **$0/month** |

The only constraint is usage limits, not dollars. A typical day of building (5-10 projects + iterations) uses ~15-25% of one 5-hour window.

### Cost Optimization Tips

Even though it's $0 per-token, conserving messages = more builds per window:

1. **Heavy templates** — Pre-built scaffolds mean Claude Code writes less code per build (30 turns → 15 turns)
2. **Sonnet for simple builds** — Use Opus for complex projects, Sonnet for landing pages and simple tools (Sonnet messages cost less against your allowance)
3. **Batch iterations** — "Add dark mode, fix the header, and update the footer" in one message instead of three
4. **CLAUDE.md context** — A well-written build instruction file reduces back-and-forth turns
5. **Check usage** — Run `/status` in Claude Code to see remaining capacity before starting a big build

---

## 14. WHAT TO CHECK IN YOUR CURRENT CODEBASE

When you get back to your home machine, run these to understand current state:

```bash
# 1. Check your Telegram bot code
find . -name "*.ts" -o -name "*.js" | xargs grep -l "telegram\|grammy\|telegraf" 2>/dev/null

# 2. Check your Firebase/Firestore setup
find . -name "*.ts" -o -name "*.js" | xargs grep -l "firestore\|firebase" 2>/dev/null

# 3. Check existing project structure
ls -la
cat package.json | head -30

# 4. Check deployed projects
vercel ls  # (if Vercel CLI installed)

# 5. Check current Cloudflare DNS
# Visit: https://dash.cloudflare.com → loricorpuz.com → DNS

# 6. Check existing Firestore collections
# Visit: https://console.firebase.google.com → your project → Firestore

# 7. Run your current Telegram bot locally to see what commands exist
npm run dev  # or however your bot starts
```

### Key Questions to Answer Before Building:

1. **Where is your Telegram bot code?** (repo name, folder structure)
2. **What Firestore collections already exist?** (daily_logs? users? projects?)
3. **Is loricorpuz.com a separate repo from Thesis Engine?**
4. **Do you have Vercel CLI set up?** (`vercel --version`)
5. **Does your Telegram bot run as a webhook or long-polling?**

---

## 15. CODEBASE DISCOVERY SCRIPT

Run this when you're home to generate a full status report:

```bash
#!/bin/bash
# save as: check_build_agent_readiness.sh

echo "=== BUILD AGENT READINESS CHECK ==="
echo ""

echo "--- Node.js ---"
node --version
npm --version

echo ""
echo "--- Git ---"
git --version
git remote -v

echo ""
echo "--- Claude Code ---"
which claude && claude --version || echo "NOT INSTALLED"

echo ""
echo "--- Vercel ---"
which vercel && vercel --version || echo "NOT INSTALLED"

echo ""
echo "--- Project Structure ---"
find . -maxdepth 3 -name "package.json" -exec echo "Found: {}" \;

echo ""
echo "--- Telegram Bot Files ---"
find . -name "*.ts" -o -name "*.js" | xargs grep -l "telegram\|grammy\|telegraf\|bot" 2>/dev/null

echo ""
echo "--- Firebase Config ---"
find . -name "*.ts" -o -name "*.js" | xargs grep -l "initializeApp\|getFirestore" 2>/dev/null

echo ""
echo "--- Environment Variables ---"
find . -name ".env*" -not -path "*/node_modules/*" 2>/dev/null

echo ""
echo "--- Current Vercel Projects ---"
vercel ls 2>/dev/null || echo "Vercel CLI not configured"

echo ""
echo "=== DONE ==="
```

---

## 16. SUCCESS CRITERIA

The Build Agent is working when:

1. ✅ You can text Telegram "build me X" and get a PRD back in <30 seconds
2. ✅ Approving the PRD triggers a build that completes in <5 minutes
3. ✅ The built project is live at [name].loricorpuz.com
4. ✅ The project appears on loricorpuz.com/outputs
5. ✅ You can iterate with "make it darker / add feature Y" and see changes in <3 minutes
6. ✅ Your Thesis Engine daily log auto-records the ship
7. ✅ Total cost per project is **$0** (included in Max 20x plan)

**The meta-success:** You become a product factory. Every signal you capture in the Thesis Engine can become a live prototype within 10 minutes. Your capture ratio (κ) goes up because you can test ideas at zero marginal cost — it's all included in your Max 20x plan.

---

## 17. FUTURE EXTENSIONS (NOT IN V1)

- **Voice notes:** Send voice message → transcribe → build
- **Screenshot iteration:** Send screenshot + "make mine look like this"
- **Analytics:** Auto-add Plausible/PostHog to every deployed project
- **A/B testing:** Deploy two versions, let agent pick winner
- **Revenue tracking:** Integrate Stripe, track revenue per project
- **Multi-agent:** One agent builds frontend, another builds backend
- **Template learning:** Agent learns your preferences over time, needs less PRD detail

---

*Ship this. Then use it to ship everything else.*
