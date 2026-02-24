# THESIS ENGINE: CLAUDE CODE IMPLEMENTATION PLAYBOOK
## Exact Steps to Build Your Dashboard

---

## BEFORE YOU START

### What You Have (3 Files):
1. **THESIS_ENGINE_PRD.md** — Complete product specifications (features, data schema, tech stack)
2. **THESIS_ENGINE_PHILOSOPHY.md** — Why each feature exists, design principles, behavioral encoding
3. **LORI_PERSONAL_CONTEXT.md** — Your personal data, psychology, thesis, targets

### What You Need (To Provide to Claude Code):
- Access to Armstrong codebase (in your repo or VSCode)
- Your Google OAuth credentials (Client ID, Secret from Google Cloud Console)
- Decision on database (Supabase or Firebase)
- Your domain name

---

## STEP 1: PREPARE YOUR INPUTS

### A. Google OAuth Setup (Do This First)
Before building, you need Google OAuth credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Thesis Engine"
3. Enable OAuth 2.0
4. Create OAuth 2.0 credentials (Web Application)
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local dev)
   - `https://thesisengine.yourdomain.com/api/auth/callback/google` (production)
6. Copy Client ID + Client Secret (you'll pass to Claude Code)

### B. Choose Your Database
**Recommended: Supabase** (PostgreSQL + built-in auth, simpler)

1. Go to [Supabase](https://supabase.com/)
2. Create project: "Thesis Engine"
3. Get database URL + API key
4. Pass to Claude Code

**Alternative: Firebase** (NoSQL, good for rapid iteration)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project: "Thesis Engine"
3. Enable Firestore + Authentication
4. Download service account key

### C. Get Armstrong Code Ready
Before Claude Code starts:
- Clone your Armstrong repo (or share access)
- Identify: color palette, typography, component structure, layout patterns
- Have it open in VSCode alongside Thesis Engine build

---

## STEP 2: PREPARE THE CLAUDE CODE PROMPT

Copy this entire prompt and paste into Claude Code Chat:

```
YOU ARE BUILDING: Thesis Engine Dashboard
A personal portfolio management system for AI builder Lori.

REFERENCES:
1. PRD: [Paste THESIS_ENGINE_PRD.md here]
2. Philosophy: [Paste THESIS_ENGINE_PHILOSOPHY.md here]
3. Personal Context: [Paste LORI_PERSONAL_CONTEXT.md here]
4. Design Reference: Armstrong (open in another VSCode window)

TECH STACK:
- Framework: Next.js 14 (App Router)
- UI: React 18 + TailwindCSS
- Auth: NextAuth.js + Google OAuth
- Database: Supabase (PostgreSQL)
- ORM: Prisma
- Charts: Recharts
- Deployment: Vercel

DATABASE CREDENTIALS (for Prisma setup):
- Database URL: [from Supabase]
- Direct URL: [from Supabase]

GOOGLE OAUTH CREDENTIALS:
- Client ID: [from Google Cloud]
- Client Secret: [from Google Cloud]

BUILD ORDER:
1. Project scaffolding (Next.js 14 setup)
2. Database schema (Prisma + Supabase)
3. Authentication (NextAuth.js + Google)
4. API routes (create, read, update daily logs, signals, projects)
5. Core components (daily log form, projects dashboard, signals library)
6. Pages (home, projects, signals, weekly, settings)
7. Styling (TailwindCSS, match Armstrong aesthetic)
8. Charts (Recharts for trends)
9. Mobile responsive
10. Deploy to Vercel

DESIGN PRINCIPLES:
- Match Armstrong's visual aesthetic (cards, buttons, layout, colors)
- No friction (forms save on blur, <5 min to complete daily log)
- Real-time feedback (charts update immediately)
- Mobile-first (works perfectly on phone)
- Professional but warm (not sterile, not casual)

BEHAVIORAL RULES TO ENCODE:
1. Spine Project Lock: Shows prominently, prevents switching mid-day
2. 24-Hour Rule: If nervous_system_state = 'spiked', show banner preventing decisions
3. Shipping Cadence: Weekly must show ≥1 public iteration
4. One Spine: Projects view shows time allocation, emphasizes one primary focus

START WITH MVP (Week 1-2):
- Google Auth working
- Daily log form (all 6 sections)
- Projects overview (read-only, pre-populated)
- Nervous system trends (basic charts)
- Settings page
- Mobile responsive

DON'T BUILD (Scope cutoff):
- Social features
- AI insights / automation
- Mobile app (web responsive enough)
- Complex onboarding
- Integrations with other tools
- Gamification

ARMSTRONG REFERENCE:
While building, reference Armstrong for:
- Component structure (cards, buttons, inputs)
- Color palette + typography
- Chart design patterns
- Interaction patterns (hover states, transitions)
- Mobile layout strategy
- Data table design

START BUILDING. Ask Lori questions if unclear.
```

---

## STEP 3: GIVE THIS TO CLAUDE CODE

1. Open VSCode
2. Activate Claude Code (if available) or use Claude extension
3. Open new chat
4. Paste the prompt above (with all the context files + credentials)
5. You can also open Armstrong codebase in VSCode so Claude Code can reference it

**Claude Code will ask clarifying questions.** Answer them directly. Examples:**
- "What's your color palette from Armstrong?"
- "Should weekly synthesis save as you type or require explicit save?"
- "Acceptable if first version doesn't have charts, just text tracking?"

---

## STEP 4: WHAT CLAUDE CODE WILL BUILD (In Order)

### Phase 1: Foundation (Days 1-2)
```
next-app/
├── package.json (Next.js 14 + dependencies)
├── .env.local (database + oauth credentials)
├── prisma/
│   ├── schema.prisma (complete data schema)
│   └── migrations/ (auto-generated)
├── app/
│   ├── layout.tsx (root layout)
│   ├── page.tsx (home redirect to dashboard)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts (Google OAuth)
│   │   ├── logs/route.ts (create, read daily logs)
│   │   ├── signals/route.ts (create, read signals)
│   │   └── projects/route.ts (read projects)
│   └── dashboard/
│       ├── layout.tsx (dashboard layout)
│       └── page.tsx (home/daily landing)
└── public/
    └── porsche-bikes.jpg (background image)
```

### Phase 2: Core Features (Days 3-5)
```
app/dashboard/
├── page.tsx (Daily landing, execution tracker, nervous system trends)
├── projects/
│   ├── page.tsx (Portfolio overview)
│   └── [projectId]/
│       └── page.tsx (Detailed project card)
├── signals/
│   ├── page.tsx (Signal library, capture form)
│   └── [signalId]/
│       └── page.tsx (Signal detail)
├── weekly/
│   └── page.tsx (Weekly synthesis)
└── settings/
    └── page.tsx (Settings, export, delete)

components/
├── DailyLogForm.tsx (Interactive form with all 6 sections)
├── ExecutionTracker.tsx (Hours, shipping, asks)
├── NervousSystemTrends.tsx (Charts with Recharts)
├── ProjectPortfolio.tsx (Table + ROI visualization)
├── SignalCapture.tsx (Form + library)
├── WeeklySynthesis.tsx (Pre-filled reflection)
└── (other component files...)

lib/
├── prisma.ts (Prisma client setup)
├── auth.ts (NextAuth configuration)
└── utils.ts (Helper functions)
```

### Phase 3: Styling & Polish (Days 6-7)
- TailwindCSS configuration (match Armstrong)
- Responsive breakpoints (desktop/tablet/mobile)
- Dark mode (if preferred)
- Loading states + transitions
- Error handling + validation

### Phase 4: Deployment (Day 8)
- Push to GitHub
- Connect to Vercel
- Configure environment variables
- Custom domain setup
- SSL certificate (auto with Vercel)

---

## STEP 5: DURING BUILDING (Communication)

### What You Should Do:
1. **Watch Claude Code build in real-time** (VSCode splits screen: code + output)
2. **Test features as they appear** (click buttons, fill forms, watch data save)
3. **Give feedback immediately:**
   - "This form is too cluttered, simplify the layout"
   - "I like how that chart looks, apply it to all trends"
   - "Move that button to the right"
   - "The color is too bright, make it match Armstrong"

4. **For major decisions, ask Claude Code:**
   - "Should 'Ship' button auto-save or require confirmation?"
   - "How should we display 24-hour rule warning?"
   - "Is weekly synthesis auto-filling or manual entry?"

### Red Flags (Tell Claude Code to Fix):
- Form takes >5 minutes to complete
- Data doesn't auto-save (friction)
- Charts don't update in real-time
- Mobile layout is broken
- Colors don't match Armstrong
- Text is too clinical (not warm enough)

---

## STEP 6: AFTER MVP IS BUILT (Testing Checklist)

Before deploying, test locally:

```
AUTHENTICATION
[ ] Google sign-in works
[ ] User profile saves correctly
[ ] Sign-out clears session
[ ] Can't access /dashboard without auth

DAILY LOG
[ ] All 6 sections appear
[ ] Can fill each section
[ ] Auto-save on blur works
[ ] Data persists on page reload
[ ] Can view past logs

PROJECTS
[ ] 4 projects pre-populated
[ ] Time allocation shows correctly
[ ] Revenue targets display
[ ] Clicking project shows detail view
[ ] Edit not available (read-only for MVP)

SIGNALS
[ ] Can add new signal
[ ] Signal type selection works
[ ] Signals save and appear in library
[ ] Filter works (all/this week/open/archived)

NERVOUS SYSTEM TRENDS
[ ] Sleep chart displays 7 days
[ ] Emotion states show correctly
[ ] Shipping cadence visible
[ ] Revenue asks bar chart works

SETTINGS
[ ] Can view current settings
[ ] Can't edit (read-only for MVP)

MOBILE
[ ] Responsive on iPhone (375px width)
[ ] All buttons clickable on mobile
[ ] Forms don't overflow
[ ] Charts readable on small screen

PERFORMANCE
[ ] Page loads in <3 seconds
[ ] No console errors
[ ] Images optimized
```

---

## STEP 7: DEPLOYMENT (Production)

Once MVP is tested and working:

### A. Push to GitHub
```bash
git init
git add .
git commit -m "feat: Thesis Engine MVP"
git push origin main
```

### B. Deploy to Vercel
1. Go to [Vercel](https://vercel.com/)
2. Import GitHub repository
3. Set environment variables:
   - `DATABASE_URL` (from Supabase)
   - `GOOGLE_CLIENT_ID` (from Google Cloud)
   - `GOOGLE_CLIENT_SECRET` (from Google Cloud)
   - `NEXTAUTH_SECRET` (generate: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your domain)
4. Deploy
5. Configure custom domain in Vercel

### C. Verify Production
- [ ] Can sign in with Google
- [ ] Dashboard loads
- [ ] Can log daily entry
- [ ] Data saves to database
- [ ] Charts display correctly

---

## STEP 8: PHASE 2 FEATURES (After MVP)

Once MVP works and you're using it daily:

### Phase 2 (Week 3-4):
- Weekly synthesis pre-filling
- Project edit capability
- Export to PDF
- Email reminders
- Advanced charts (ROI over time)

### Phase 3 (Month 2+):
- Slack integration
- AI insights (no AI telling you what to do, just data synthesis)
- Mobile PWA
- Collaboration (share with co-founder)

---

## TROUBLESHOOTING

### "Can't connect to database"
- Check `DATABASE_URL` in `.env.local`
- Verify Supabase project is running
- Test connection: `npx prisma db push`

### "Google sign-in not working"
- Verify Client ID + Secret match Google Cloud Console
- Check redirect URIs are correct
- Clear browser cookies
- Try incognito window

### "Forms not saving"
- Check API route exists
- Verify `fetch()` calls are correct
- Look at browser console for errors
- Check Prisma schema matches data structure

### "Charts not displaying"
- Verify Recharts installed: `npm install recharts`
- Check data is being fetched
- Inspect browser console for chart errors
- Test with hardcoded data first

---

## QUICK REFERENCE: File Structure (After Build)

```
thesis-engine/
├── app/                          # Next.js app directory
│   ├── api/
│   │   └── auth/                 # Google OAuth
│   ├── dashboard/
│   │   ├── page.tsx              # Daily home
│   │   ├── projects/             # Portfolio view
│   │   ├── signals/              # Signal library
│   │   ├── weekly/               # Weekly synthesis
│   │   └── settings/             # User settings
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── DailyLogForm.tsx
│   ├── ProjectPortfolio.tsx
│   ├── SignalCapture.tsx
│   └── ...
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # DB client
│   └── utils.ts
├── prisma/
│   └── schema.prisma             # Data models
├── public/                       # Static assets
│   └── porsche-bikes.jpg
├── styles/                       # TailwindCSS config
├── .env.local                    # Credentials (don't commit)
├── package.json
├── tsconfig.json
└── next.config.js
```

---

## FINAL CHECKLIST

Before declaring "Done":

- [ ] Deployed to production
- [ ] Custom domain working
- [ ] Google Auth functional
- [ ] Daily log <5 min to complete
- [ ] Charts display correctly
- [ ] Mobile responsive tested
- [ ] No broken links
- [ ] No console errors
- [ ] API calls working
- [ ] Data persisting to database

Once all checked: **You have your Thesis Engine dashboard.**

**Next step: Use it daily for 2 weeks. Then you'll know what to iterate.**

