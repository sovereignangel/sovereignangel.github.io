import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mastery on Four Fronts · Lori Corpuz',
  description:
    'Elite Operator, Elite Researcher, Gravitas, Athlete — four disciplines, one outcome: alpha and relationships, converted into capital.',
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap');

.mastery-page{
  --parchment:#f3ead7;
  --paper:#faf6ec;
  --navy:#1b2c47;
  --navy-deep:#12203a;
  --navy-soft:#2c416a;
  --cream:#f0e6cd;
  --cream-line:#d8c79c;
  --ink:#2a2722;
  --muted:#6f6757;
  --brass:#9a7b3f;
  --oxblood:#6e2a2a;
  --rule:#cdbf9c;
  --shadow:0 18px 40px -22px rgba(18,32,58,.45);
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(154,123,63,.10), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(27,44,71,.08), transparent 55%),
    var(--parchment);
  color:var(--ink);
  font-family:"Spectral", Georgia, serif;
  font-weight:400;
  line-height:1.62;
  font-size:18px;
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
}
.mastery-page .wrap{max-width:880px;margin:0 auto;padding:0 26px;}
.mastery-page .cover{min-height:72vh;display:flex;flex-direction:column;justify-content:center;padding:90px 0 50px;position:relative;}
.mastery-page .kicker{font-family:"JetBrains Mono",monospace;font-size:11.5px;letter-spacing:.42em;text-transform:uppercase;color:var(--brass);margin-bottom:28px;}
.mastery-page h1{font-family:"Cormorant Garamond",serif;font-weight:600;font-size:clamp(46px,9vw,92px);line-height:.98;letter-spacing:-.5px;color:var(--navy);margin:0 0 8px;}
.mastery-page h1 .thin{font-weight:400;font-style:italic;color:var(--navy-soft);}
.mastery-page .sub{font-family:"Cormorant Garamond",serif;font-style:italic;font-size:clamp(20px,3vw,27px);color:var(--ink);max-width:660px;margin:18px 0 0;line-height:1.35;}
.mastery-page .coverrule{height:1px;background:linear-gradient(90deg,var(--brass),transparent);margin:40px 0;width:55%;}
.mastery-page .meta{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.08em;color:var(--muted);line-height:2;}
.mastery-page .meta strong{color:var(--navy);font-weight:700;}
.mastery-page section{padding:54px 0;border-top:1px solid var(--rule);}
.mastery-page .partlabel{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--brass);margin-bottom:14px;}
.mastery-page h2{font-family:"Cormorant Garamond",serif;font-weight:600;font-size:clamp(30px,5.2vw,44px);line-height:1.04;color:var(--navy);margin:.1em 0 .35em;letter-spacing:-.3px;}
.mastery-page h3{font-family:"Cormorant Garamond",serif;font-weight:600;font-size:25px;color:var(--navy-deep);margin:1.6em 0 .4em;letter-spacing:-.2px;}
.mastery-page p{margin:0 0 1.05em;}
.mastery-page .lead{font-size:20px;line-height:1.55;color:#3a352c;}
.mastery-page em{font-style:italic;}
.mastery-page strong{font-weight:600;color:var(--navy-deep);}
.mastery-page a{color:var(--navy-soft);text-decoration:none;border-bottom:1px solid var(--cream-line);}
.mastery-page a:hover{color:var(--oxblood);}
.mastery-page blockquote{margin:1.2em 0;padding:4px 0 4px 22px;border-left:2px solid var(--brass);font-family:"Cormorant Garamond",serif;font-style:italic;font-size:22px;color:var(--navy-soft);line-height:1.4;}
.mastery-page .modnav{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin:34px 0 6px;}
.mastery-page .modnav a{display:block;background:var(--paper);border:1px solid var(--rule);border-radius:3px;padding:20px 22px;box-shadow:var(--shadow);border-bottom:1px solid var(--rule);}
.mastery-page .modnav a:hover{border-color:var(--brass);color:inherit;}
.mastery-page .modnav .n{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--brass);letter-spacing:.2em;}
.mastery-page .modnav .t{font-family:"Cormorant Garamond",serif;font-size:23px;font-weight:600;color:var(--navy);line-height:1.1;margin:6px 0 4px;}
.mastery-page .modnav .d{font-size:13px;color:var(--muted);font-style:italic;line-height:1.4;}
.mastery-page .money{background:var(--navy);border:1px solid var(--navy-deep);border-left:3px solid var(--brass);border-radius:2px;padding:20px 24px;margin:24px 0;box-shadow:var(--shadow);color:#e9e1cf;}
.mastery-page .money .tag{font-family:"JetBrains Mono",monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--brass);display:block;margin-bottom:8px;}
.mastery-page .money strong{color:#fff;}
.mastery-page .money p:last-child{margin-bottom:0;}
.mastery-page .callout{background:var(--cream);border:1px solid var(--cream-line);border-left:3px solid var(--brass);border-radius:2px;padding:20px 24px;margin:24px 0;box-shadow:var(--shadow);}
.mastery-page .callout .tag{font-family:"JetBrains Mono",monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--brass);display:block;margin-bottom:8px;}
.mastery-page .callout p:last-child{margin-bottom:0;}
.mastery-page .tblwrap{overflow-x:auto;}
.mastery-page table{width:100%;border-collapse:collapse;margin:22px 0;font-size:15px;background:var(--paper);box-shadow:var(--shadow);}
.mastery-page caption{caption-side:top;text-align:left;font-family:"JetBrains Mono",monospace;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--brass);padding-bottom:10px;}
.mastery-page th{background:var(--navy);color:#f1e9d6;font-family:"JetBrains Mono",monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;text-align:left;padding:11px 14px;font-weight:500;}
.mastery-page td{padding:12px 14px;border-bottom:1px solid var(--rule);vertical-align:top;line-height:1.45;}
.mastery-page tr:nth-child(even) td{background:rgba(216,199,156,.13);}
.mastery-page td:first-child{font-weight:600;color:var(--navy-deep);}
.mastery-page .mono{font-family:"JetBrains Mono",monospace;font-size:12.5px;color:var(--oxblood);}
.mastery-page ul{margin:.4em 0 1.2em;padding-left:1.15em;}
.mastery-page li{margin:.42em 0;}
.mastery-page li::marker{color:var(--brass);}
.mastery-page .planlink{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.06em;}
.mastery-page .footer{padding:50px 0 70px;text-align:center;border-top:1px solid var(--rule);color:var(--muted);font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.12em;}
.mastery-page .footer .mark{font-family:"Cormorant Garamond",serif;font-style:italic;font-size:20px;color:var(--navy);letter-spacing:0;margin-bottom:10px;}
@media (max-width:640px){
  .mastery-page{font-size:16.5px;}
  .mastery-page .modnav{grid-template-columns:1fr;}
}
`

export default function MasteryPage() {
  return (
    <div className="mastery-page">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header className="cover wrap">
        <div className="kicker">Lori Corpuz · Mastery on Four Fronts</div>
        <h1>
          Four <span className="thin">Fronts</span>
        </h1>
        <p className="sub">
          Two fronts manufacture and capture alpha. One converts trust into capital. One powers the
          instrument that runs the other three. Every front terminates in the same two currencies —
          alpha and relationships — and those convert into money.
        </p>
        <div className="coverrule" />
        <div className="meta">
          <strong>Operator</strong> captures the edge · <strong>Researcher</strong> manufactures it
          <br />
          <strong>Gravitas</strong> converts it to capital · <strong>Athlete</strong> keeps the whole
          machine solvent
          <br />
          <strong>Deep plan</strong> <a href="/mastery-pyramid.html">The Mastery Pyramid</a> — the
          twelve-month belt progression
        </div>

        <nav className="modnav">
          <a href="#operator">
            <span className="n">01</span>
            <span className="t" style={{ display: 'block' }}>
              Elite Operator
            </span>
            <span className="d">
              Hedge fund — the machine that turns a proven edge into managed capital
            </span>
          </a>
          <a href="#researcher">
            <span className="n">02</span>
            <span className="t" style={{ display: 'block' }}>
              Elite Researcher
            </span>
            <span className="d">
              Complexity economics / hedge fund alpha — new edge, adversarially validated
            </span>
          </a>
          <a href="#gravitas">
            <span className="n">03</span>
            <span className="t" style={{ display: 'block' }}>
              Gravitas
            </span>
            <span className="d">
              Elite relationships — sales, narrative, and presence practiced as a craft
            </span>
          </a>
          <a href="#athlete">
            <span className="n">04</span>
            <span className="t" style={{ display: 'block' }}>
              Athlete
            </span>
            <span className="d">
              Kiteboarder · aesthetics · triathlete — on a base of longevity and sustainability
            </span>
          </a>
        </nav>
      </header>

      {/* ============ 01 OPERATOR ============ */}
      <section className="wrap" id="operator">
        <div className="partlabel">Module 01 · Capture</div>
        <h2>Elite Operator — Hedge Fund</h2>
        <blockquote>
          Mastery is a machine that converts a proven edge into managed capital — and keeps
          compounding through drawdowns, rejections, and regimes it did not expect.
        </blockquote>
        <p>
          The operator runs Armstrong as an institution in miniature. The craft is not the strategy
          code; it is everything that makes outside capital rational to wire: automation that never
          misses a close, a risk envelope written down precisely enough to hand off, an audit trail a
          skeptic can interrogate, and a capital pipeline managed as an operational process rather
          than a hope.
        </p>
        <div className="money">
          <span className="tag">How this becomes money</span>
          <p>
            The operator <strong>captures</strong> alpha. Revenue is fee-bearing AUM times fees and
            performance, plus the compounding of your own book. The relationship currency is LP
            trust — the conversion of a verbal commitment into a wired check. A beautiful machine
            with zero dollars raised is not an elite operation; it is an expensive hobby with good
            logging.
          </p>
        </div>
        <div className="tblwrap">
          <table>
            <caption>Operator KPIs — capture scoreboard</caption>
            <thead>
              <tr>
                <th>KPI</th>
                <th>Target</th>
                <th>Falsifiable artifact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Capital ladder</td>
                <td>$5M closed · $10M verbal (named LP, amount, date) · $60M qualified pipeline</td>
                <td className="mono">wired checks + pipeline log</td>
              </tr>
              <tr>
                <td>Live track record</td>
                <td>13 consecutive weekly tearsheets, no missed close</td>
                <td className="mono">tearsheet archive</td>
              </tr>
              <tr>
                <td>Verbal-to-wired conversion</td>
                <td>Every verbal has a next step and a date; conversion rate reviewed monthly</td>
                <td className="mono">pipeline log</td>
              </tr>
              <tr>
                <td>Risk discipline</td>
                <td>Zero rule violations through any drawdown, real or paper</td>
                <td className="mono">trade log + state notes</td>
              </tr>
              <tr>
                <td>Income resilience</td>
                <td>One non-performance-contingent income stream live</td>
                <td className="mono">signed engagement</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="planlink">
          Deep plan · <a href="/mastery-pyramid.html#d-tooling">Tooling</a> ·{' '}
          <a href="/mastery-pyramid.html#d-risk">Risk &amp; Execution</a> ·{' '}
          <a href="/mastery-pyramid.html#d-capital">Capital Formation</a> ·{' '}
          <a href="/mastery-pyramid.html#year">the belt year</a>
        </p>
      </section>

      {/* ============ 02 RESEARCHER ============ */}
      <section className="wrap" id="researcher">
        <div className="partlabel">Module 02 · Manufacture</div>
        <h2>Elite Researcher — Complexity Economics / Hedge Fund Alpha</h2>
        <blockquote>
          Mastery is manufacturing new edge through the complexity-economics lens — insight
          formalized into falsifiable hypotheses, validated adversarially, deployed as signals.
        </blockquote>
        <p>
          The researcher is where edge comes from. The lens is complexity economics — regimes,
          increasing returns, agent-based mechanism — and the discipline is adversarial honesty:
          every promising result is guilty until it survives every attempt to kill it. The
          researcher&apos;s job ends only when an insight has become a validated, deployable signal
          or a public artifact. Insight that never reaches a tearsheet or a reader is reading, not
          research.
        </p>
        <div className="money">
          <span className="tag">How this becomes money</span>
          <p>
            The researcher <strong>manufactures</strong> alpha, and the money arrives twice. First
            as performance — validated signals deployed on the book. Second as capital — published
            work is the artifact that makes LPs, collaborators, and fee-for-service clients come
            inbound. The relationship currency is reputation: each artifact is simultaneously a
            proof of craft and a magnet for the next room.
          </p>
        </div>
        <div className="tblwrap">
          <table>
            <caption>Researcher KPIs — manufacture scoreboard</caption>
            <thead>
              <tr>
                <th>KPI</th>
                <th>Target</th>
                <th>Falsifiable artifact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Signal pipeline</td>
                <td>3 ABM signals in production, at least 1 with demonstrated live edge</td>
                <td className="mono">production log + live P&amp;L</td>
              </tr>
              <tr>
                <td>Hypothesis kill ratio</td>
                <td>
                  Killed exceeds kept; every hypothesis logged with economic rationale and verdict
                </td>
                <td className="mono">research log</td>
              </tr>
              <tr>
                <td>Validation rigor</td>
                <td>Survivors pass walk-forward + deflated Sharpe before a dollar touches them</td>
                <td className="mono">validation report</td>
              </tr>
              <tr>
                <td>Publishing cadence</td>
                <td>12 weekly posts + 1 piece presented publicly</td>
                <td className="mono">public artifacts</td>
              </tr>
              <tr>
                <td>Inbound per artifact</td>
                <td>Each published piece opens at least one conversation you did not initiate</td>
                <td className="mono">contact log</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="planlink">
          Deep plan · <a href="/mastery-pyramid.html#d-cx">Complexity Economics</a> ·{' '}
          <a href="/mastery-pyramid.html#d-alpha">Alpha Research</a> ·{' '}
          <a href="/mastery-pyramid.html#d-drl">Deep RL</a> ·{' '}
          <a href="/mastery-pyramid.html#flywheel">the artifact flywheel</a>
        </p>
      </section>

      {/* ============ 03 GRAVITAS ============ */}
      <section className="wrap" id="gravitas">
        <div className="partlabel">Module 03 · Convert</div>
        <h2>Gravitas — Elite Relationships</h2>
        <blockquote>
          Mastery is becoming the node that capital, talent, and ideas route through — sales,
          narrative, and presence practiced as a craft, not carried as a personality trait.
        </blockquote>
        <p>
          Gravitas is the conversion layer. The researcher&apos;s artifacts and the operator&apos;s
          track record only become money at the moment a person decides to trust you — and that
          decision is made on presence, narrative, and the calm, repeated ask. The reframe that
          unlocks it: relief comes from making and meaning the ask, not from the other
          person&apos;s yes. De-shame the ask, systematize it, and the reps stop costing you.
        </p>
        <div className="money">
          <span className="tag">How this becomes money</span>
          <p>
            Relationships are where alpha is <strong>priced</strong>. LPs buy a person and a process
            before a number; the track record is permission, the relationship is the decision.
            Gravitas turns the other two fronts&apos; artifacts into wired capital, warm-sourced
            engagements, and rooms that route opportunity to you unprompted.
          </p>
        </div>
        <div className="tblwrap">
          <table>
            <caption>Gravitas KPIs — conversion scoreboard</caption>
            <thead>
              <tr>
                <th>KPI</th>
                <th>Target</th>
                <th>Falsifiable artifact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ask cadence</td>
                <td>Two asks per day, logged, detached from outcome</td>
                <td className="mono">ask log</td>
              </tr>
              <tr>
                <td>Named commitments</td>
                <td>Every verbal commitment has a name, an amount, and a date</td>
                <td className="mono">pipeline log</td>
              </tr>
              <tr>
                <td>Inbound vs outbound</td>
                <td>Inbound opportunities exceed outbound asks by end of the arc</td>
                <td className="mono">contact log</td>
              </tr>
              <tr>
                <td>Warm-sourced revenue</td>
                <td>At least one engagement sourced entirely through a warm room</td>
                <td className="mono">signed engagement</td>
              </tr>
              <tr>
                <td>Rooms</td>
                <td>Standing rooms kept weekly; one room convened by you</td>
                <td className="mono">calendar + attendee list</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="planlink">
          Deep plan · <a href="/mastery-pyramid.html#d-network">Network &amp; Access</a> ·{' '}
          <a href="/mastery-pyramid.html#d-capital">Capital Formation</a>
        </p>
      </section>

      {/* ============ 04 ATHLETE ============ */}
      <section className="wrap" id="athlete">
        <div className="partlabel">Module 04 · Power</div>
        <h2>Athlete — Kiteboarder · Aesthetics · Triathlete</h2>
        <blockquote>
          Mastery is a trained body that holds decision quality through drawdown and rejection —
          kiteboarding first, aesthetics second, triathlon third, all on a base of longevity and
          sustainability.
        </blockquote>
        <p>
          The athlete is Layer 0 — the substrate every decision above it is computed on. The
          priorities are ordered deliberately: kiteboarding is the craft and the joy, aesthetics is
          presence made physical (it feeds Gravitas directly), and triathlon is the engine —
          cardiovascular capacity that literally widens the window in which you stay calm and think
          clearly. Longevity and sustainability are the constraint on all three: training that
          injures or exhausts is a loan against the other fronts.
        </p>
        <div className="money">
          <span className="tag">How this feeds the other three</span>
          <p>
            The athlete front sells nothing — it <strong>finances</strong> the rest. Capacity and
            recovery are what let the operator hold composure through a losing week and a hard LP
            call in the same day; the aesthetic is presence walking into the room before the pitch
            starts. This is the one front whose KPIs are allowed to be non-monetary, because its
            return is paid to every other module at once.
          </p>
        </div>
        <div className="tblwrap">
          <table>
            <caption>Athlete KPIs — in priority order</caption>
            <thead>
              <tr>
                <th>KPI</th>
                <th>Target</th>
                <th>Falsifiable artifact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Kiteboarding (first)</td>
                <td>Sessions per season on plan; one named progression milestone per season</td>
                <td className="mono">session log</td>
              </tr>
              <tr>
                <td>Aesthetics (second)</td>
                <td>Posing mastered, wardrobe refit to figure, recomposition trending as intended</td>
                <td className="mono">photo log + measurements</td>
              </tr>
              <tr>
                <td>Triathlon (third)</td>
                <td>Zone 2 volume and VO2-max (Norwegian 4x4) sessions kept weekly; one race finished</td>
                <td className="mono">training log + race result</td>
              </tr>
              <tr>
                <td>Longevity &amp; sustainability (the base)</td>
                <td>Sleep consistent, true rest day kept, deloads honored, zero training injuries</td>
                <td className="mono">recovery log</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="planlink">
          Deep plan · <a href="/mastery-pyramid.html#d-state">Operating State — Body, Mind &amp; Soul</a>
        </p>
      </section>

      <div className="footer wrap">
        <div className="mark">Lori Corpuz</div>
        Mastery on Four Fronts · Operator · Researcher · Gravitas · Athlete
        <br />
        Alpha &amp; Relationships → Capital
      </div>
    </div>
  )
}
