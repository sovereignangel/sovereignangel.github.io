import { useState, useEffect } from "react";

// ─── DATA ────────────────────────────────────────────────────────────
const WEEK = "Feb 23 – Mar 1, 2026";
const REVENUE_TARGET = "$2,000+";

const goals = [
  {
    id: "kappa",
    label: "REVENUE (κ)",
    title: "Close $2k+ in revenue",
    weight: 35,
    accent: "#2d5f3f",
    pillar: "Markets",
    items: [
      { task: "Send Manifold pitch to Uzo with clear pricing", day: "Mon", outcome: "Meeting booked" },
      { task: "Send Manifold pitch to Gillian with specific use case", day: "Mon", outcome: "Trial started" },
      { task: "Build & send Sean's tech stack proposal with pricing", day: "Tue–Wed", outcome: "$500-1k proposal sent" },
      { task: "Identify 5 prospects who need custom AI tech stacks", day: "Wed–Thu", outcome: "5 names sourced" },
      { task: "Cold outreach to 5 new prospects", day: "Thu–Fri", outcome: "2 responses" },
      { task: "Follow up on ALL outstanding asks", day: "Fri", outcome: "Every thread touched" },
    ],
    askTarget: "21 asks minimum (3/day)",
    ruin: "κ = 0 → log(0) = −∞. Brilliant builder, zero capture.",
  },
  {
    id: "ship",
    label: "SHIPPING (ΔΦᵥ)",
    title: "5 public ships from Agent Factory",
    weight: 30,
    accent: "#7c2d2d",
    pillar: "AI",
    items: [
      { task: "Ship Agent Factory v0 — core orchestration deployed", day: "Mon–Tue", outcome: "Shareable URL live" },
      { task: "Ship Marketing Bot (use case #1)", day: "Wed", outcome: "Demo video posted" },
      { task: "Ship Geneticist-in-Pocket (use case #2)", day: "Thu", outcome: "Prototype posted" },
      { task: "Ship Sean's clickable tech stack demo", day: "Fri", outcome: "Demo sent to Sean" },
      { task: "Ship 1 embarrassment — ugly but real", day: "Any", outcome: "Ego survived" },
    ],
    ruin: "Nothing public = nothing compounds. ΔΦᵥ → −∞.",
  },
  {
    id: "narrative",
    label: "PUBLIC NARRATIVE",
    title: "7 posts building the Agent Factory story",
    weight: 20,
    accent: "#2d4a6f",
    pillar: "AI + Markets",
    items: [
      { task: "'Why I'm building a factory that builds AI businesses'", day: "Mon", outcome: "Thread posted" },
      { task: "Build-in-public: Marketing Bot demo", day: "Wed", outcome: "Video posted" },
      { task: "Agent Factory use case — Geneticist in Pocket", day: "Thu", outcome: "Thread posted" },
      { task: "Revenue update (transparent, even if $0)", day: "Fri", outcome: "Posted publicly" },
      { task: "Long-form: AI + Markets thesis content", day: "Sat", outcome: "Essay published" },
      { task: "2× engagement replies to people above your level", day: "Daily", outcome: "Thoughtful, not spam" },
    ],
    ruin: "No audience = no inbound. Invisible = irrelevant.",
  },
  {
    id: "strategy",
    label: "STRATEGY",
    title: "Repeatable tech stack sales playbook",
    weight: 10,
    accent: "#8a6d2f",
    pillar: "Markets + Mind",
    items: [
      { task: "Document: What exactly are you selling Sean?", day: "Mon", outcome: "1-page offer doc" },
      { task: "Generalize Sean's deal → repeatable template", day: "Wed", outcome: "Template created" },
      { task: "ICP research: Who buys custom AI tech stacks?", day: "Thu", outcome: "ICP doc written" },
      { task: "Price anchoring: What do consultants charge?", day: "Fri", outcome: "3 comps found" },
    ],
    ruin: "One deal to Sean, can't repeat. No compounding.",
  },
  {
    id: "ge",
    label: "ENERGY (GE)",
    title: "Protect the biological machine",
    weight: 5,
    accent: "#6b5b4f",
    pillar: "Mind",
    items: [
      { task: "7+ hours sleep every night", day: "Daily", outcome: "Garmin verified" },
      { task: "2× VO2 interval sessions (4×4min @ 90% HR)", day: "Tue + Thu", outcome: "Completed" },
      { task: "1× strength session", day: "Sat", outcome: "Completed" },
      { task: "24-hour rule if spiked", day: "As needed", outcome: "Rule honored" },
    ],
    ruin: "GE → 0. Multiplicative ruin. Everything collapses.",
  },
];

const dailyPlan = [
  {
    day: "Monday", date: "Feb 23", theme: "Launch — Revenue + Narrative",
    prime: "Agent Factory = engine. Products = revenue. Send the asks first.",
    blocks: [
      { t: "8–9a", task: "Pitch Uzo (with pricing)", cat: "κ", c: "#2d5f3f" },
      { t: "9–9:30a", task: "Pitch Gillian", cat: "κ", c: "#2d5f3f" },
      { t: "9:30–10a", task: "Document Sean offer", cat: "Strategy", c: "#8a6d2f" },
      { t: "10a–1p", task: "Agent Factory core — 3hr deep work", cat: "Ship", c: "#7c2d2d" },
      { t: "1–2p", task: "Thread: 'Why Agent Factory'", cat: "Narrative", c: "#2d4a6f" },
      { t: "2–5p", task: "Agent Factory continued → deployable", cat: "Ship", c: "#7c2d2d" },
      { t: "5–5:30p", task: "1 cold outreach + follow-ups", cat: "κ", c: "#2d5f3f" },
    ],
    score: { asks: 3, ships: 0, posts: 1 },
  },
  {
    day: "Tuesday", date: "Feb 24", theme: "Build + Sell — AF v0 + Sean Proposal",
    prime: "Did Uzo/Gillian respond? Follow up if not.",
    blocks: [
      { t: "7–8a", task: "VO2 intervals #1", cat: "GE", c: "#6b5b4f" },
      { t: "9a–12p", task: "Ship Agent Factory v0 → live URL", cat: "Ship", c: "#7c2d2d" },
      { t: "12–1p", task: "Build Sean proposal (deliverables + price)", cat: "κ", c: "#2d5f3f" },
      { t: "1–2p", task: "2× engagement replies", cat: "Narrative", c: "#2d4a6f" },
      { t: "2–5p", task: "Build Marketing Bot on AF infra", cat: "Ship", c: "#7c2d2d" },
      { t: "5–5:30p", task: "2 cold outreach emails", cat: "κ", c: "#2d5f3f" },
    ],
    score: { asks: 3, ships: 1, posts: 0 },
  },
  {
    day: "Wednesday", date: "Feb 25", theme: "Ship Marketing Bot + Generalize Offer",
    prime: "Pipeline check: who responded? Who needs 2nd touch?",
    blocks: [
      { t: "9a–12p", task: "Ship Marketing Bot — demo + video", cat: "Ship", c: "#7c2d2d" },
      { t: "12–1p", task: "Post build-in-public: Bot demo", cat: "Narrative", c: "#2d4a6f" },
      { t: "1–2p", task: "Generalize Sean → repeatable template", cat: "Strategy", c: "#8a6d2f" },
      { t: "2–4p", task: "Send Sean proposal with demo attached", cat: "κ", c: "#2d5f3f" },
      { t: "4–5p", task: "2 more cold outreach", cat: "κ", c: "#2d5f3f" },
      { t: "5–5:30p", task: "Follow up Uzo/Gillian (2nd touch)", cat: "κ", c: "#2d5f3f" },
    ],
    score: { asks: 4, ships: 1, posts: 1 },
  },
  {
    day: "Thursday", date: "Feb 26", theme: "Geneticist Use Case + ICP Research",
    prime: "NS check. If spiked: skip strategy, just ship.",
    blocks: [
      { t: "7–8a", task: "VO2 intervals #2", cat: "GE", c: "#6b5b4f" },
      { t: "9a–12p", task: "Build Geneticist-in-Pocket on AF", cat: "Ship", c: "#7c2d2d" },
      { t: "12–1p", task: "Thread: Geneticist + AF vision", cat: "Narrative", c: "#2d4a6f" },
      { t: "1–2p", task: "ICP: Who buys AI tech stacks?", cat: "Strategy", c: "#8a6d2f" },
      { t: "2–4p", task: "Polish Geneticist → post publicly", cat: "Ship", c: "#7c2d2d" },
      { t: "4–5p", task: "3 revenue asks", cat: "κ", c: "#2d5f3f" },
    ],
    score: { asks: 3, ships: 1, posts: 1 },
  },
  {
    day: "Friday", date: "Feb 27", theme: "Close Week — Revenue Push",
    prime: "Revenue audit: Where are you vs. $2k?",
    blocks: [
      { t: "9–11a", task: "Ship Sean's clickable demo", cat: "Ship", c: "#7c2d2d" },
      { t: "11a–12p", task: "Price research: 3 consultant comps", cat: "Strategy", c: "#8a6d2f" },
      { t: "12–1p", task: "Post revenue/progress update", cat: "Narrative", c: "#2d4a6f" },
      { t: "1–3p", task: "Follow up EVERY open ask", cat: "κ", c: "#2d5f3f" },
      { t: "3–4p", task: "5 cold outreach for next week", cat: "κ", c: "#2d5f3f" },
      { t: "4–5p", task: "Ship 1 embarrassment — imperfect, public", cat: "Ship", c: "#7c2d2d" },
    ],
    score: { asks: 5, ships: 2, posts: 1 },
  },
  {
    day: "Saturday", date: "Feb 28", theme: "Compound — Thesis + Strength",
    prime: "No asks. Create long-form content that compounds.",
    blocks: [
      { t: "9–10a", task: "Strength training", cat: "GE", c: "#6b5b4f" },
      { t: "10a–12p", task: "Write AI + Markets thesis essay", cat: "Narrative", c: "#2d4a6f" },
      { t: "12–1p", task: "Week review: shipped? converted? kill?", cat: "Strategy", c: "#8a6d2f" },
    ],
    score: { asks: 0, ships: 0, posts: 1 },
  },
  {
    day: "Sunday", date: "Mar 1", theme: "Rest + Plan",
    prime: "Synthesis. Did AI + Markets + Mind integrate?",
    blocks: [
      { t: "10–11a", task: "Weekly synthesis", cat: "Mind", c: "#6b5b4f" },
      { t: "11a–12p", task: "Plan next week", cat: "Strategy", c: "#8a6d2f" },
    ],
    score: { asks: 0, ships: 0, posts: 0 },
  },
];

const scorecard = [
  { label: "Revenue Asks", target: "21" },
  { label: "Public Ships", target: "5" },
  { label: "Posts", target: "7" },
  { label: "Revenue", target: "$2k" },
  { label: "VO2 Sessions", target: "2" },
  { label: "Sleep 7+hrs", target: "7/7" },
];

const projects = [
  { name: "Agent Factory", role: "SPINE", desc: "The machine that builds AI businesses", color: "#7c2d2d" },
  { name: "Armstrong", role: "Channel", desc: "Options analytics · AI × Markets", color: "#2d5f3f" },
  { name: "Manifold", role: "Channel", desc: "AI career matching", color: "#2d4a6f" },
  { name: "Tech Stack Sales", role: "Channel", desc: "Custom AI stacks for founders", color: "#8a6d2f" },
];

function Badge({ color, children }) {
  return (
    <span style={{
      background: color + "14", color,
      padding: "2px 8px", borderRadius: "3px",
      fontSize: "10px", fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase",
      lineHeight: "18px", display: "inline-block",
    }}>
      {children}
    </span>
  );
}

function GoalCard({ goal, isOpen, toggle }) {
  return (
    <div style={{
      border: "1px solid #e8e4df", borderLeft: `3px solid ${goal.accent}`,
      borderRadius: "4px", background: "#faf8f5", marginBottom: "8px",
    }}>
      <div onClick={toggle} style={{
        padding: "14px 16px", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Badge color={goal.accent}>{goal.label}</Badge>
          <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "15px", fontWeight: 600, color: "#2c2824" }}>
            {goal.title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#9a928a" }}>{goal.weight}%</span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#b8b0a4",
            padding: "2px 6px", border: "1px solid #e8e4df", borderRadius: "2px",
          }}>{goal.pillar}</span>
          <span style={{ fontSize: "10px", color: "#b8b0a4", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #e8e4df" }}>
          <div style={{ marginTop: "12px" }}>
            {goal.items.map((item, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "20px 1fr 80px 150px",
                gap: "8px", alignItems: "start", padding: "7px 0",
                borderBottom: i < goal.items.length - 1 ? "1px solid #f0ece6" : "none",
              }}>
                <span style={{ fontSize: "11px", color: "#b8b0a4" }}>☐</span>
                <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "12.5px", color: "#2c2824", lineHeight: 1.45 }}>{item.task}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: goal.accent, fontWeight: 600 }}>{item.day}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#9a928a" }}>→ {item.outcome}</span>
              </div>
            ))}
          </div>
          {goal.askTarget && (
            <div style={{ marginTop: "10px", padding: "8px 10px", background: goal.accent + "0a", borderRadius: "3px" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: goal.accent, fontWeight: 600 }}>
                TARGET: {goal.askTarget}
              </span>
            </div>
          )}
          <div style={{ marginTop: "8px", padding: "8px 10px", background: "#8c2d2d08", borderLeft: "2px solid #8c2d2d40", borderRadius: "0 3px 3px 0" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#8c2d2d" }}>
              <span style={{ fontWeight: 600 }}>RUIN: </span>{goal.ruin}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function DayCard({ day, isOpen, toggle }) {
  const { asks, ships, posts } = day.score;
  return (
    <div style={{ borderBottom: "1px solid #e8e4df", background: isOpen ? "#faf8f5" : "transparent", transition: "background 0.15s" }}>
      <div onClick={toggle} style={{
        padding: "12px 4px", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "14px", fontWeight: 700, color: "#2c2824", minWidth: "80px" }}>{day.day}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#b8b0a4" }}>{day.date}</span>
          <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "12.5px", color: "#7c2d2d", fontStyle: "italic" }}>{day.theme}</span>
        </div>
        <div style={{ display: "flex", gap: "12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", flexShrink: 0 }}>
          {asks > 0 && <span style={{ color: "#2d5f3f" }}>κ:{asks}</span>}
          {ships > 0 && <span style={{ color: "#7c2d2d" }}>⬆{ships}</span>}
          {posts > 0 && <span style={{ color: "#2d4a6f" }}>✎{posts}</span>}
          <span style={{ color: "#b8b0a4", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: "0 4px 14px" }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#6b5b4f",
            padding: "8px 10px", background: "#f5f1ec", borderRadius: "3px", marginBottom: "10px", letterSpacing: "0.3px",
          }}>
            MORNING PRIME: {day.prime}
          </div>
          {day.blocks.map((b, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "85px 1fr auto",
              gap: "10px", alignItems: "center", padding: "6px 0",
              borderBottom: i < day.blocks.length - 1 ? "1px solid #f0ece6" : "none",
            }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#9a928a" }}>{b.t}</span>
              <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "12.5px", color: "#2c2824", lineHeight: 1.4 }}>{b.task}</span>
              <Badge color={b.c}>{b.cat}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LoriCorpuz() {
  const [view, setView] = useState("goals");
  const [openGoals, setOpenGoals] = useState(new Set([0]));
  const [openDays, setOpenDays] = useState(new Set([0]));

  const toggle = (setter, i) => {
    setter((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  };

  return (
    <div style={{ background: "#fffdf9", minHeight: "100vh", fontFamily: "'Crimson Pro', Georgia, serif", color: "#2c2824" }}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "0 24px 40px" }}>

        {/* ── HEADER ── */}
        <header style={{ padding: "28px 0 20px", borderBottom: "2px solid #7c2d2d" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "3px", color: "#9a928a", marginBottom: "6px", textTransform: "uppercase" }}>
                Weekly Allocation
              </div>
              <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "28px", fontWeight: 700, color: "#2c2824", letterSpacing: "-0.3px", lineHeight: 1, margin: 0 }}>
                Lori Corpuz
              </h1>
              <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: "14px", color: "#7c2d2d", marginTop: "6px", fontStyle: "italic" }}>
                Building the machine that builds AI businesses
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#9a928a" }}>{WEEK}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#b8b0a4", marginTop: "2px" }}>loricorpuz.com</div>
            </div>
          </div>
        </header>

        {/* ── SPINE BANNER ── */}
        <div style={{ margin: "20px 0", padding: "18px 20px", background: "#7c2d2d08", border: "1px solid #7c2d2d18", borderLeft: "3px solid #7c2d2d", borderRadius: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ maxWidth: "560px" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "2px", color: "#7c2d2d", fontWeight: 600, marginBottom: "8px" }}>
                SPINE RESOLUTION
              </div>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#2c2824", lineHeight: 1.4, marginBottom: "8px" }}>
                Agent Factory is the spine. Everything else is a revenue channel.
              </p>
              <p style={{ fontSize: "12px", color: "#6b5b4f", lineHeight: 1.6 }}>
                Infrastructure &gt; any single product. Revenue comes from use cases —
                Sean's tech stack, Manifold to Uzo &amp; Gillian, cold outreach to founders.
                You sell cars, not engines.
              </p>
            </div>
            <div style={{ textAlign: "center", padding: "12px 20px", background: "#fffdf9", border: "1px solid #e8e4df", borderRadius: "4px" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "22px", fontWeight: 700, color: "#2d5f3f" }}>{REVENUE_TARGET}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#9a928a", letterSpacing: "1px", marginTop: "2px" }}>WEEKLY TARGET</div>
            </div>
          </div>
        </div>

        {/* ── PROJECT BAR ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "24px" }}>
          {projects.map((p) => (
            <div key={p.name} style={{ padding: "12px 14px", background: "#faf8f5", border: "1px solid #e8e4df", borderTop: `2px solid ${p.color}`, borderRadius: "4px" }}>
              <Badge color={p.color}>{p.role}</Badge>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#2c2824", marginTop: "6px" }}>{p.name}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#9a928a", marginTop: "3px" }}>{p.desc}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #e8e4df", marginBottom: "18px" }}>
          {["goals", "daily"].map((id) => (
            <button key={id} onClick={() => setView(id)} style={{
              padding: "10px 22px", fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600,
              background: "transparent", border: "none",
              borderBottom: view === id ? "2px solid #7c2d2d" : "2px solid transparent",
              color: view === id ? "#7c2d2d" : "#9a928a",
              cursor: "pointer", transition: "color 0.15s, border-color 0.15s", marginBottom: "-1px",
            }}>
              {id === "goals" ? "Strategic Goals" : "Daily Allocation"}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div style={{ minHeight: "420px" }}>
          {view === "goals" && goals.map((g, i) => (
            <GoalCard key={g.id} goal={g} isOpen={openGoals.has(i)} toggle={() => toggle(setOpenGoals, i)} />
          ))}
          {view === "daily" && dailyPlan.map((d, i) => (
            <DayCard key={i} day={d} isOpen={openDays.has(i)} toggle={() => toggle(setOpenDays, i)} />
          ))}
        </div>

        {/* ── SCORECARD ── */}
        <div style={{ marginTop: "28px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "2px", color: "#7c2d2d", fontWeight: 600, marginBottom: "12px" }}>
            WEEKLY SCORECARD — RUIN CONDITIONS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
            {scorecard.map((s, i) => (
              <div key={i} style={{ padding: "14px 10px", background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: "4px", textAlign: "center" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "20px", fontWeight: 700, color: "#2c2824" }}>{s.target}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "8px", letterSpacing: "0.5px", color: "#9a928a", marginTop: "4px", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "6px", padding: "10px", background: "#7c2d2d08", borderRadius: "3px", textAlign: "center" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#7c2d2d", fontWeight: 600, letterSpacing: "0.5px" }}>
              ANY METRIC AT ZERO = MULTIPLICATIVE RUIN · g* COLLAPSES · NO EXCEPTIONS
            </span>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ marginTop: "32px", padding: "20px 0", borderTop: "2px solid #7c2d2d", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "#7c2d2d", fontStyle: "italic" }}>
            You're not building products. You're building the machine that builds products.
          </p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#9a928a", marginTop: "10px", letterSpacing: "0.5px" }}>
            g* = 𝔼[ log GE + log ΔGI + log ΔGV + log κ + log 𝒪 ] − fragmentation + coherence
          </p>
          <p style={{ fontSize: "13px", color: "#6b5b4f", marginTop: "12px", fontWeight: 600, letterSpacing: "1px" }}>
            Ship. Ask. Own.
          </p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#b8b0a4", marginTop: "14px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Lori Corpuz · Agent Factory · AI × Markets × Mind
          </p>
        </div>
      </div>
    </div>
  );
}
