import { useState, useEffect, useReducer, useRef } from "react";

const STORAGE_KEY = "cmd-center-v4";

const INITIAL_PROJECTS = [
  { id: "armstrong", name: "Armstrong", sym: "§", cat: "build", color: "#7c2d2d", desc: "LEAP screener + backtest + paper trading.", milestones: [{ t: "Screener — 2yr, 10× benchmark", d: true }, { t: "Backtest framework", d: false }, { t: "Paper trading system", d: false }, { t: "Live deployment", d: false }] },
  { id: "alamo", name: "Alamo Bernal", sym: "¶", cat: "build", color: "#2d5f3f", desc: "First paying client — dividend capture. Validates business.", milestones: [{ t: "Close comp agreement", d: false }, { t: "Strategy implementation", d: false }, { t: "Client delivery", d: false }] },
  { id: "richard", name: "Richard Gee", sym: "†", cat: "explore", color: "#2d4a6f", desc: "Private credit LEAPs, cowork, crypto+finance.", milestones: [{ t: "Private credit LEAPs thesis", d: false }, { t: "Joint strategy", d: false }] },
  { id: "aman-rl", name: "RL w/ Aman", sym: "∑", cat: "study", color: "#8a6d2f", desc: "RL fundamentals. Math advisor. Potential capital.", milestones: [{ t: "RL fundamentals", d: false }, { t: "RL → trading", d: false }, { t: "Capital discussion", d: false }] },
  { id: "ai-eng", name: "AI Eng Group", sym: "λ", cat: "study", color: "#5c5550", desc: "Latest AI/ML research w/ peers.", milestones: [] },
  { id: "ai-investors", name: "AGI Reading", sym: "Φ", cat: "study", color: "#5c5550", desc: "AGI philosophy + investor lens.", milestones: [] },
  { id: "michael-ralph", name: "Complexity · Michael", sym: "∞", cat: "explore", color: "#8a6d2f", desc: "Doyne Farmer path. Digital lab. Making Sense of Chaos.", milestones: [{ t: "Finish book", d: false }, { t: "First experiment", d: false }, { t: "Connect w/ Farmer", d: false }] },
  { id: "thesis-engine", name: "Thesis Engine", sym: "◊", cat: "meta", color: "#7c2d2d", desc: "Journal → beliefs → decisions.", milestones: [{ t: "Ingestion pipeline", d: false }, { t: "Belief tracking", d: false }] },
];

const PRIORITY_TIERS = { critical: { l: "Critical", c: "#7c2d2d" }, important: { l: "Important", c: "#8a6d2f" }, nurture: { l: "Nurture", c: "#2d4a6f" }, backlog: { l: "Backlog", c: "#9a928a" } };

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayStr() { return new Date().toISOString().split("T")[0]; }

const RETRO_PROMPTS = [
  "What moved the critical path?",
  "What surprised me or shifted my thinking?",
  "What do I carry into tomorrow?",
  "Anything I'm avoiding?",
];

function getTimeOfDay() { const h = new Date().getHours(); return h >= 17 ? "evening" : h < 12 ? "morning" : "afternoon"; }

function reducer(state, action) {
  switch (action.type) {
    case "ADD_JOURNAL": {
      const entry = { id: uid(), date: todayStr(), time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), text: action.text, pid: action.pid || null, retro: action.retro || false };
      return { ...state, journal: [entry, ...state.journal] };
    }
    case "TOGGLE_TASK": return { ...state, tasks: state.tasks.map((t) => t.id === action.id ? { ...t, done: !t.done } : t) };
    case "TOGGLE_MS": return { ...state, projects: state.projects.map((p) => p.id === action.pid ? { ...p, milestones: p.milestones.map((m, i) => i === action.idx ? { ...m, d: !m.d } : m) } : p) };
    case "SET_PRIO": return { ...state, prios: { ...state.prios, [action.pid]: action.v } };
    case "SET_FOCUS": return { ...state, focus: action.v };
    case "SET_WEEK": return { ...state, week: action.v };
    case "LOAD": return { ...action.s };
    default: return state;
  }
}

const INIT = {
  projects: INITIAL_PROJECTS, journal: [], tasks: [],
  prios: { armstrong: "critical", alamo: "critical", richard: "important", "aman-rl": "important", "ai-eng": "nurture", "ai-investors": "nurture", "michael-ralph": "nurture", "thesis-engine": "important" },
  focus: "", week: "",
};

const C = {
  cream: "#f5f1ea", paper: "#faf8f4", white: "#ffffff", ink: "#2a2522",
  burg: "#7c2d2d", burgL: "#9c4040",
  inkL: "#5c5550", inkM: "#9a928a", inkF: "#c8c0b8",
  rule: "#d8d0c8", ruleL: "#e8e2da",
  grn: "#2d5f3f", red: "#8c2d2d", amb: "#8a6d2f", blu: "#2d4a6f",
};

export default function CommandCenter() {
  const [s, dispatch] = useReducer(reducer, INIT);
  const [ji, setJi] = useState("");
  const [jp, setJp] = useState("");
  const [retro, setRetro] = useState(false);
  const [expProj, setExpProj] = useState(null);
  const [clock, setClock] = useState(new Date());
  const loaded = useRef(false);

  useEffect(() => { (async () => { try { const r = await window.storage.get(STORAGE_KEY); if (r?.value) dispatch({ type: "LOAD", s: JSON.parse(r.value) }); } catch(e){} loaded.current = true; })(); }, []);
  useEffect(() => { if (!loaded.current) return; try { window.storage.set(STORAGE_KEY, JSON.stringify(s)); } catch(e){} }, [s]);
  useEffect(() => { const i = setInterval(() => setClock(new Date()), 60000); return () => clearInterval(i); }, []);

  const today = s.tasks.filter(t => t.timeframe === "today");
  const week = s.tasks.filter(t => t.timeframe === "week");
  const horizon = s.tasks.filter(t => t.timeframe === "horizon");
  const todayJ = s.journal.filter(j => j.date === todayStr());
  const hasRetro = todayJ.some(j => j.retro);
  const isEve = getTimeOfDay() === "evening";

  const critical = s.projects.filter(p => s.prios[p.id] === "critical");
  const important = s.projects.filter(p => s.prios[p.id] === "important");
  const nurture = s.projects.filter(p => s.prios[p.id] === "nurture" || s.prios[p.id] === "backlog");

  function saveJ() {
    if (!ji.trim()) return;
    dispatch({ type: "ADD_JOURNAL", text: ji, pid: jp || null, retro });
    setJi(""); setJp(""); setRetro(false);
  }

  const mono = "'IBM Plex Mono', monospace";
  const serif = "'Crimson Pro', serif";
  const sans = "'Inter', sans-serif";

  const Badge = ({ id }) => { const p = s.projects.find(x => x.id === id); return p ? <span style={{ fontSize: 9, fontFamily: mono, background: p.color + "11", color: p.color, padding: "1px 6px", borderRadius: 2, border: `1px solid ${p.color}22` }}>{p.sym} {p.name}</span> : null; };

  const Task = ({ t }) => (
    <div style={{ display: "flex", gap: 7, alignItems: "flex-start", padding: "5px 0", borderBottom: `1px solid ${C.ruleL}`, opacity: t.done ? 0.35 : 1 }}>
      <button onClick={() => dispatch({ type: "TOGGLE_TASK", id: t.id })}
        style={{ width: 15, height: 15, borderRadius: 2, border: `1.5px solid ${t.done ? C.grn : C.rule}`, background: t.done ? C.grn : "transparent", cursor: "pointer", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700 }}>
        {t.done ? "✓" : ""}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 12, color: C.ink, textDecoration: t.done ? "line-through" : "none", lineHeight: 1.4 }}>{t.text}</div>
        {t.projectId && <div style={{ marginTop: 2 }}><Badge id={t.projectId} /></div>}
      </div>
    </div>
  );

  const ProjRow = ({ p }) => {
    const pr = s.prios[p.id] || "backlog";
    const exp = expProj === p.id;
    const done = p.milestones.filter(m => m.d).length;
    const total = p.milestones.length;
    return (
      <div onClick={() => setExpProj(exp ? null : p.id)} style={{ background: C.white, border: `1px solid ${exp ? p.color + "44" : C.ruleL}`, borderRadius: 3, padding: "8px 10px", cursor: "pointer", transition: "border-color 0.15s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontFamily: serif, fontSize: 14, color: p.color, fontWeight: 600 }}>{p.sym}</span>
            <span style={{ fontFamily: serif, fontWeight: 600, fontSize: 12.5, color: C.ink }}>{p.name}</span>
            {total > 0 && <span style={{ fontFamily: mono, fontSize: 9.5, color: p.color }}>{done}/{total}</span>}
          </div>
          <select value={pr} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); dispatch({ type: "SET_PRIO", pid: p.id, v: e.target.value }); }}
            style={{ background: PRIORITY_TIERS[pr].c + "11", border: `1px solid ${PRIORITY_TIERS[pr].c}33`, color: PRIORITY_TIERS[pr].c, borderRadius: 2, padding: "1px 6px", fontSize: 9, fontFamily: mono, cursor: "pointer" }}>
            {Object.entries(PRIORITY_TIERS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
          </select>
        </div>
        {exp && (
          <div style={{ marginTop: 8, borderTop: `1px solid ${C.ruleL}`, paddingTop: 8 }}>
            <div style={{ fontFamily: sans, fontSize: 11, color: C.inkL, fontStyle: "italic", lineHeight: 1.4, marginBottom: 6 }}>{p.desc}</div>
            {p.milestones.length > 0 && p.milestones.map((m, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); dispatch({ type: "TOGGLE_MS", pid: p.id, idx: i }); }}
                style={{ display: "flex", gap: 6, alignItems: "center", padding: "2px 0", cursor: "pointer", fontFamily: sans, fontSize: 11, color: m.d ? C.inkM : C.ink, textDecoration: m.d ? "line-through" : "none" }}>
                <span style={{ fontFamily: mono, fontSize: 9, color: m.d ? C.grn : C.inkF }}>{m.d ? "■" : "□"}</span>{m.t}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Sec = ({ text, color }) => (
    <div style={{ fontFamily: serif, fontSize: 9.5, color: color || C.inkM, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 6, height: 1.5, background: color || C.inkM }} />{text}
    </div>
  );

  return (
    <div style={{ background: C.cream, height: "100vh", color: C.ink, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        ::selection{background:${C.burg}22;color:${C.burg}}
        input,textarea,select{outline:none}
        textarea::placeholder,input::placeholder{color:${C.inkF};font-style:italic}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.rule};border-radius:2px}
      `}</style>

      {/* MASTHEAD */}
      <div style={{ borderBottom: `2px solid ${C.burg}`, padding: "10px 24px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", background: C.paper, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, color: C.burg, letterSpacing: "-0.02em" }}>ARMSTRONG</span>
          <span style={{ fontFamily: serif, fontSize: 13, fontWeight: 400, color: C.inkL, fontStyle: "italic" }}>Command Center</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.inkM, letterSpacing: 0.5 }}>
          {clock.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* BODY — 3 columns, no scroll */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.1fr 1fr", gap: 16, padding: "14px 20px 10px", overflow: "hidden", minHeight: 0 }}>

        {/* COL 1: Focus + Tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden", minHeight: 0 }}>
          {/* Focus */}
          <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 3, padding: "10px 12px", flexShrink: 0 }}>
            <div style={{ fontFamily: serif, fontSize: 9, color: C.inkM, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, fontWeight: 600 }}>Daily Focus</div>
            <input value={s.focus} onChange={e => dispatch({ type: "SET_FOCUS", v: e.target.value })} placeholder="The one thing…"
              style={{ width: "100%", background: "transparent", border: "none", color: C.ink, fontFamily: serif, fontSize: 14, fontStyle: "italic", boxSizing: "border-box" }} />
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 3, padding: "10px 12px", flexShrink: 0 }}>
            <div style={{ fontFamily: serif, fontSize: 9, color: C.inkM, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, fontWeight: 600 }}>Weekly Intent</div>
            <input value={s.week} onChange={e => dispatch({ type: "SET_WEEK", v: e.target.value })} placeholder="This week I will…"
              style={{ width: "100%", background: "transparent", border: "none", color: C.ink, fontFamily: serif, fontSize: 14, fontStyle: "italic", boxSizing: "border-box" }} />
          </div>

          {/* Tasks */}
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {today.length === 0 && week.length === 0 && horizon.length === 0 ? (
              <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 3, padding: "20px 14px", textAlign: "center" }}>
                <div style={{ fontFamily: serif, fontSize: 13, color: C.inkL, fontStyle: "italic", marginBottom: 4 }}>No tasks yet</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: C.inkF, lineHeight: 1.5 }}>Share priorities in chat →<br />I'll populate this board.</div>
              </div>
            ) : (
              <>
                {today.length > 0 && <div style={{ marginBottom: 12 }}><Sec text="Today" color={C.burg} />{today.map(t => <Task key={t.id} t={t} />)}</div>}
                {week.length > 0 && <div style={{ marginBottom: 12 }}><Sec text="This Week" color={C.blu} />{week.map(t => <Task key={t.id} t={t} />)}</div>}
                {horizon.length > 0 && <div><Sec text="Horizon" color={C.amb} />{horizon.map(t => <Task key={t.id} t={t} />)}</div>}
              </>
            )}
          </div>
        </div>

        {/* COL 2: Journal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden", minHeight: 0 }}>
          {/* Composer */}
          <div style={{ background: C.white, border: `1px solid ${retro ? C.burg + "33" : C.rule}`, borderRadius: 3, padding: "10px 12px", flexShrink: 0, transition: "border-color 0.2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontFamily: serif, fontSize: 9, color: retro ? C.burg : C.inkM, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }}>
                {retro ? "Retrospective" : "Journal"}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {hasRetro && <span style={{ fontFamily: mono, fontSize: 9, color: C.grn }}>✓ retro</span>}
                {isEve && !hasRetro && (
                  <button onClick={() => setRetro(!retro)}
                    style={{ background: retro ? C.burg + "11" : "transparent", border: `1px solid ${retro ? C.burg + "33" : C.ruleL}`, borderRadius: 2, padding: "2px 8px", fontSize: 9, fontFamily: mono, color: retro ? C.burg : C.inkM, cursor: "pointer" }}>
                    {retro ? "← write" : "retro →"}
                  </button>
                )}
              </div>
            </div>
            {retro && (
              <div style={{ background: C.burg + "06", borderRadius: 2, padding: "6px 8px", marginBottom: 6 }}>
                {RETRO_PROMPTS.map((p, i) => (
                  <div key={i} style={{ fontFamily: sans, fontSize: 11, color: C.inkL, lineHeight: 1.5, display: "flex", gap: 5 }}>
                    <span style={{ fontFamily: mono, fontSize: 9, color: C.inkF }}>{i + 1}.</span>{p}
                  </div>
                ))}
              </div>
            )}
            <textarea value={ji} onChange={e => setJi(e.target.value)} placeholder={retro ? "What moved? What shifted?…" : "What's happening? What did you learn?…"} rows={retro ? 4 : 3}
              style={{ width: "100%", background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 2, padding: "8px 10px", color: C.ink, fontFamily: sans, fontSize: 12.5, resize: "none", lineHeight: 1.5, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "space-between" }}>
              <select value={jp} onChange={e => setJp(e.target.value)} style={{ background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 2, padding: "3px 6px", color: C.inkL, fontSize: 9, fontFamily: mono }}>
                <option value="">General</option>
                {s.projects.map(p => <option key={p.id} value={p.id}>{p.sym} {p.name}</option>)}
              </select>
              <button onClick={saveJ} style={{ background: retro ? C.burg : C.paper, border: retro ? "none" : `1px solid ${C.rule}`, borderRadius: 2, padding: "4px 12px", color: retro ? "#fff" : C.ink, cursor: "pointer", fontSize: 10, fontFamily: serif, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Save
              </button>
            </div>
          </div>

          {/* Recent entries */}
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            <Sec text="Recent Entries" color={C.inkM} />
            {s.journal.length === 0 ? (
              <div style={{ fontFamily: serif, fontSize: 12, color: C.inkF, fontStyle: "italic", padding: "10px 0" }}>No entries yet.</div>
            ) : (
              s.journal.slice(0, 15).map(j => (
                <div key={j.id} style={{ borderLeft: `2px solid ${j.retro ? C.burg : (j.pid ? s.projects.find(p => p.id === j.pid)?.color || C.rule : C.rule)}`, paddingLeft: 10, marginBottom: 10 }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: C.inkM, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {j.date} · {j.time}
                    {j.retro && <span style={{ fontSize: 8, background: C.burg + "11", color: C.burg, padding: "0 5px", borderRadius: 2 }}>retro</span>}
                    {j.pid && <Badge id={j.pid} />}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.inkL, lineHeight: 1.45, marginTop: 3, fontFamily: sans }}>{j.text}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COL 3: Projects */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {[
              { label: "Critical Path", ps: critical, c: C.burg },
              { label: "Important", ps: important, c: C.amb },
              { label: "Nurture", ps: nurture, c: C.blu },
            ].map(tier => (
              <div key={tier.label} style={{ marginBottom: 14 }}>
                <Sec text={tier.label} color={tier.c} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {tier.ps.length === 0 ? <div style={{ fontFamily: serif, fontSize: 11, color: C.inkF, fontStyle: "italic" }}>—</div> : tier.ps.map(p => <ProjRow key={p.id} p={p} />)}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ flexShrink: 0, paddingTop: 8, borderTop: `1px solid ${C.ruleL}` }}>
            <div style={{ fontFamily: mono, fontSize: 8, color: C.inkF, lineHeight: 1.5, textAlign: "center" }}>
              Armstrong · Educational purposes only · Not financial advice · Options involve substantial risk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
