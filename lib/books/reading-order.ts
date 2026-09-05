/**
 * The shelf, in order.
 *
 * Three books arrived together in app/books/. They are not three of the same
 * thing: one is the lane's spine, one is the room's dialect, one is the machine
 * Armstrong actually runs. The order below is by what unblocks what — not by
 * length, not by interest, and deliberately not by professional urgency.
 *
 * Fixed point everything is sequenced against: SFI Reimagining Economics Winter
 * School, Abu Dhabi, January 3–17 2027. The Lane paper and the lightning talk
 * are due on arrival.
 */

export type StintPriority = 'read' | 'skim' | 'skip'

export interface StintChapter {
  label: string
  /** PDF page (not the printed page) — jumps straight to it in the reader. */
  page: number
  priority: StintPriority
  note: string
}

export interface ReadingStint {
  id: string
  slug: string
  order: number
  title: string
  author: string
  /** How much of the volume the plan actually asks for. */
  scope: string
  window: string
  effort: string
  /** Why this book sits at this position, rather than earlier or later. */
  why: string
  /** In the pathway's idiom — the single question held open while reading. */
  questionToCarry: string
  /** The artifact that proves the stint happened. */
  produces: string
  chapters: StintChapter[]
}

/** The argument for the sequence itself. Read before the stints. */
export const ORDER_ARGUMENT: { head: string; body: string }[] = [
  {
    head: 'Mauss first, because he changes how the other two read.',
    body:
      'The Gift is the only one of the three that is a single sustained argument rather than a collection — it breaks if you sample it, and it is the shortest thing on the shelf at roughly 95 pages of body text. It is also the only one that reframes the others: read after Mauss, Grinold’s alpha is visibly a convention about what a security is worth, enforced by an industry that agrees to measure itself that way. Read before Mauss, it is just arithmetic. Sequencing him last would waste him.',
  },
  {
    head: 'Arthur second, because he is the room, not the argument.',
    body:
      'Everyone at the winter school will have read Arthur; he is SFI’s house dialect and the vocabulary the seminar will run on. That makes him a fluency requirement rather than a source of originality — the return on reading him is being able to disagree specifically, in the room’s own terms. He is a collected-papers volume, so he does not reward binge-reading: four framework chapters install the dialect, three mechanism chapters do the market work, the technology sequence is real Arthur but off-lane.',
  },
  {
    head: 'Grinold third, because it is the one you are already inside.',
    body:
      'Armstrong runs this machinery daily, which means this is a precision read, not an orientation read — and precision reading is what you do once the frame is set, not before. It is also 937 pages that must never be read cover to cover: a six-chapter spine carries the fundamental law, and the rest is drawn on by question. The temptation is to rank it first because it is the professional edge. Resist that: Grinold is the book you can already half-fake, and Mauss and Arthur are the ones the room will test.',
  },
  {
    head: 'The asymmetry to protect.',
    body:
      'Mauss and Arthur are the credential for the room. Grinold is the credential nobody else in the room has — almost none of them trade. So Grinold is not the book that gets you in; it is the book that makes the Lane paper unfalsifiable-by-nobody-else, because it states the edge thesis in machinery a practitioner can check. Read the first two to be admitted to the argument, the third to win it.',
  },
]

export const READING_ORDER: ReadingStint[] = [
  // ─── 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 'stint-mauss',
    slug: 'mauss-the-gift',
    order: 1,
    title: 'The Gift',
    author: 'Marcel Mauss',
    scope: 'Whole — p.11 to p.105. Everything after p.106 is endnotes; consult, do not read.',
    window: 'Sep 8 – Sep 25 · Palanga, around the taper',
    effort: '~95 pages · three sittings',
    why:
      'Short enough to finish inside the kite weeks and the Ironman taper, when deep quantitative work is not happening anyway. It is already the spine of the lane in the pathway, and the voc-mauss memo milestone is waiting on it. Finishing it in September means the rest of the autumn reads through it.',
    questionToCarry:
      'What is the gift-logic residue inside modern capital allocation — reciprocity in analyst access, IPO allocations, the flow of information to people who owe you something?',
    produces:
      'The voc-mauss memo: one page on exchange as obligation, written toward the vocabulary synthesis rather than as a book report.',
    chapters: [
      {
        label: 'Foreword — Mary Douglas, "No free gifts"',
        page: 11,
        priority: 'read',
        note: 'Douglas states the thesis more sharply than Mauss does, and names the debate with the utilitarians that Mauss never got to have. Read it as the framing, not as filler.',
      },
      {
        label: 'Introduction — the obligation to return',
        page: 23,
        priority: 'read',
        note: 'The programme, and the Havamal epigraph. The claim that matters: there are no free gifts, only transfers that carry obligation.',
      },
      {
        label: 'Ch. 1 — The Exchange of Gifts and the Obligation to Reciprocate (Polynesia)',
        page: 30,
        priority: 'read',
        note: 'The hau of the taonga: the thing given carries something of the giver and must return. This is the load-bearing mechanism for the lane — a valuation that is enforced socially rather than cleared by price.',
      },
      {
        label: 'Ch. 2 — The Extension of this System: liberality, honour, money',
        page: 41,
        priority: 'read',
        note: 'Potlatch and kula. Read this as the distributive half: exchange as an escalating contest that ranks people. Honour is the return on the transfer.',
      },
      {
        label: 'Ch. 3 — Survivals in Ancient Systems of Law and Economies',
        page: 69,
        priority: 'skim',
        note: 'Roman, Hindu, Germanic law. The philology is heavy and off-lane; take the argument — that contract emerges out of gift, not out of barter — and move on.',
      },
      {
        label: 'Ch. 4 — Conclusion: moral, sociological, political',
        page: 87,
        priority: 'read',
        note: 'The "total social fact" and Mauss’s own policy turn. The most directly usable pages in the book: economic, juridical, religious and aesthetic at once. This is the sentence the Lane paper will quote.',
      },
      {
        label: 'Notes',
        page: 106,
        priority: 'skip',
        note: 'Seventy pages of apparatus. Search them when a claim needs its source; never read forward.',
      },
    ],
  },

  // ─── 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 'stint-arthur',
    slug: 'arthur-complexity-economy',
    order: 2,
    title: 'Complexity and the Economy',
    author: 'W. Brian Arthur',
    scope: 'Seven of twelve chapters. Four for the framework, three for the market machinery. The technology sequence is skimmed.',
    window: 'Sep 28 – Oct 22 · NYC, the clear block before Panama',
    effort: '~120 pages of the 241 · four weeks at a chapter or two a week',
    why:
      'This is the widest clear window before the travel starts on Oct 23, and Arthur is the book that most needs uninterrupted attention early — not because he is hard, but because fluency in the dialect has to be automatic by January, not freshly crammed. It also upgrades what is already in the pathway: the complexecon library currently points at the single SFI framework chapter, and this is the whole volume.',
    questionToCarry:
      'Where does Arthur’s non-equilibrium framing make a claim that Armstrong’s book could falsify — and where is he doing metaphor that a P&L would embarrass?',
    produces:
      'A one-paragraph position on each of the seven chapters — enough to disagree specifically at dinner, which is the stated test.',
    chapters: [
      {
        label: 'Ch. 1 — Complexity Economics: A Different Framework for Economic Thought',
        page: 26,
        priority: 'read',
        note: 'The founding statement. Formation rather than states; the economy as perpetually computing itself. Everything else in the volume is an instance of this chapter.',
      },
      {
        label: 'Ch. 12 — Complexity and the Economy',
        page: 207,
        priority: 'read',
        note: 'Read second, out of order. It is Arthur summarising his own programme with twenty years of hindsight, and it tells you which of the middle chapters he still thinks carried weight.',
      },
      {
        label: 'Ch. 2 — Inductive Reasoning and Bounded Rationality: The El Farol Problem',
        page: 55,
        priority: 'read',
        note: 'The cleanest existing model of a market where the convention is the thing being forecast. This is the direct ancestor of the anchoring thesis: agents forecasting each other’s forecasts, with no equilibrium to settle into.',
      },
      {
        label: 'Ch. 3 — Asset Pricing under Endogenous Expectations in an Artificial Stock Market',
        page: 64,
        priority: 'read',
        note: 'The Santa Fe artificial stock market — Arthur, Holland, LeBaron, Palmer, Tayler. The single most important chapter for GEN-4: prices that emerge from co-evolving expectations rather than from fundamentals, which is exactly the crowding side of the alpha-decay duel.',
      },
      {
        label: 'Ch. 6 — All Systems Will Be Gamed',
        page: 128,
        priority: 'read',
        note: 'Written after 2008. Exploitive behaviour as the generic response to any measurement rule — which is the mechanism behind GEN-5’s endogenous structural breaks. A regime shifts because someone learned to game the last regime.',
      },
      {
        label: 'Ch. 5 — Process and Emergence in the Economy',
        page: 114,
        priority: 'read',
        note: 'Arthur, Durlauf and Lane’s manifesto for the SFI programme. Short, and the most quotable statement of what the room believes it is doing.',
      },
      {
        label: 'Ch. 11 — The End of Certainty in Economics',
        page: 196,
        priority: 'read',
        note: 'Non-equilibrium as the natural state, indeterminacy as structural rather than as noise. The philosophical backing for refusing to treat a mispricing as an error term.',
      },
      {
        label: 'Ch. 4 — Competing Technologies, Increasing Returns, and Lock-In',
        page: 94,
        priority: 'skim',
        note: 'The famous increasing-returns paper. You already hold the argument; skim for the formal statement in case the room wants it cited precisely.',
      },
      {
        label: 'Ch. 7–10 — Technology, evolution, cognition',
        page: 144,
        priority: 'skim',
        note: 'Combinatorial evolution of technology, complexity growth, cognition as the black box. Real Arthur, off-lane. Skim Ch. 10 (p.183) if any of it — cognition is where the anchoring literature would attach.',
      },
    ],
  },

  // ─── 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 'stint-grinold',
    slug: 'grinold-kahn-active-portfolio',
    order: 3,
    title: 'Advances in Active Portfolio Management',
    author: 'Richard C. Grinold & Ronald N. Kahn',
    scope: 'Never cover to cover. A six-chapter spine, then chapters drawn by question. Roughly 200 of 937 pages.',
    window: 'Nov 2 – Dec 20 · Costa Rica and Brazil, the settled weeks',
    effort: 'Spine ~120 pages, then on demand · the long stretch before Abu Dhabi',
    why:
      'Deliberately last, and deliberately after the travel weeks of late October when nothing sustained will happen anyway. This is a reference volume being read for precision: the point is to state the Armstrong edge thesis in machinery that a practitioner can check, which is a writing task more than a reading task. Doing it in November and December puts it adjacent to drafting the Lane paper rather than months upstream of it.',
    questionToCarry:
      'Which term of the fundamental law does the anchoring edge actually live in — is it skill (IC), is it breadth, or is it the transfer coefficient? The answer determines whether the edge decays by overfitting or by crowding, which is the whole of GEN-4.',
    produces:
      'The Lane paper’s machinery section: the edge thesis written as a performativity claim with the fundamental law attached, plus GEN-4 stated precisely enough to be adjudicated in observable markets.',
    chapters: [
      {
        label: 'Ch. 3 — Seven Insights into Active Management',
        page: 29,
        priority: 'read',
        note: 'Start here, not at Ch. 1. The compressed restatement of the whole prior book: residual return, IR determines added value, alphas control for skill and volatility. If only one chapter gets read, this is it.',
      },
      {
        label: 'Ch. 4 — A Retrospective Look at the Fundamental Law',
        page: 75,
        priority: 'read',
        note: 'Thirty years on, with the transfer coefficient now load-bearing. IR ≈ IC × √BR × TC. The transfer coefficient is where constraints and costs eat the edge — and where a "convention" argument has the most purchase.',
      },
      {
        label: 'Ch. 5 — Breadth, Skill, and Time',
        page: 96,
        priority: 'read',
        note: 'What breadth actually counts when signals are correlated and decay at different rates. The chapter that determines whether Armstrong’s breadth claim is honest.',
      },
      {
        label: 'Ch. 7 — Implementation Efficiency',
        page: 184,
        priority: 'read',
        note: 'The gap between the paper portfolio and the traded one. Directly the distributive question in a technical register: who absorbs the difference.',
      },
      {
        label: 'Ch. 8 — Dynamic Portfolio Analysis',
        page: 205,
        priority: 'read',
        note: 'Signals decay; positions have to be traded toward a moving target. The formal apparatus for alpha decay — the thing GEN-4 is arguing about the cause of.',
      },
      {
        label: 'Ch. 9 — Signal Weighting',
        page: 252,
        priority: 'read',
        note: 'Combining forecasts of different horizons and qualities. This is the López de Prado contact point: exactly where overfitting enters, stated by people who were not thinking about overfitting.',
      },
      {
        label: 'Ch. 11 — Nonlinear Trading Rules',
        page: 352,
        priority: 'skim',
        note: 'Draw on this when GEN-4 needs a decay mechanism that is not linear. Not part of the spine.',
      },
      {
        label: 'Ch. 25 — The Asset Manager’s Dilemma',
        page: 643,
        priority: 'read',
        note: 'The most lane-relevant chapter in the book, and the one an anthropologist would recognise. Fees, capacity, and the manager’s incentive to grow past their own edge — valuation conventions doing distributive work inside the industry that sets them.',
      },
      {
        label: 'Ch. 27 — Heat, Light, and Downside Risk',
        page: 664,
        priority: 'skim',
        note: 'Risk measures as conventions with consequences. Short, and directly quotable in the Lane paper.',
      },
      {
        label: 'Ch. 30 — The Dangers of Diversification',
        page: 727,
        priority: 'skim',
        note: 'Read against GEN-7 (species diversification vs HRP). Grinold and Kahn’s objection is the classical one; the point is to see precisely where a hierarchical-risk-parity answer departs from it.',
      },
      {
        label: 'Ch. 33 — Five Myths About Fees',
        page: 811,
        priority: 'read',
        note: 'Fees as the clearest case of a valuation convention that distributes. Twenty pages, and the easiest bridge from the fund to the anthropology.',
      },
      {
        label: 'Ch. 38 — Conclusions',
        page: 868,
        priority: 'read',
        note: 'What the authors themselves think advanced since 2000. Useful for calibrating how much of the field agrees the machinery is settled.',
      },
    ],
  },
]

/** Windows the plan is fitted to, from the travel calendar. */
export const SCHEDULE: { window: string; place: string; work: string; constraint: string }[] = [
  {
    window: 'Sep 5 – Sep 25',
    place: 'Palanga',
    work: 'Mauss, whole. Memo written before leaving.',
    constraint: 'Kite season and the Ironman taper. Short book on purpose.',
  },
  {
    window: 'Sep 26',
    place: 'NYC',
    work: 'None.',
    constraint: '70.3 A-race.',
  },
  {
    window: 'Sep 28 – Oct 22',
    place: 'NYC',
    work: 'Arthur — seven chapters. The widest clear block of the autumn.',
    constraint: 'Last settled stretch before six weeks of movement.',
  },
  {
    window: 'Oct 23 – Nov 2',
    place: 'Panama, then Central America',
    work: 'Nothing scheduled. Search and re-read only.',
    constraint: 'Mom’s 60th, then a new town most nights.',
  },
  {
    window: 'Nov 2 – Dec 20',
    place: 'Costa Rica, then Brazil',
    work: 'Grinold spine, then chapters by question. Lane paper drafted alongside.',
    constraint: 'A monthly rental from Nov 22 — the one long settled stretch left.',
  },
  {
    window: 'Dec 21 – Jan 2',
    place: 'Christmas and NYE forks',
    work: 'Synthesis only. No new chapters.',
    constraint: 'Travel and family. Protect the paper, not the reading.',
  },
  {
    window: 'Jan 3 – Jan 15',
    place: 'Abu Dhabi',
    work: 'Winter school. Paper and lightning talk due on arrival.',
    constraint: 'Fixed.',
  },
]
