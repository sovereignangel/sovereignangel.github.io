'use client'

import { createContext, useContext, useEffect, useState } from 'react'

/* ============================================================
   PLAIN-LANGUAGE DICTIONARY
   One source of truth. Powers both the inline hover/tap
   definitions and the glossary table at the bottom.
   Rule: no sentence longer than a breath. No word that needs
   another word explained first.
   ============================================================ */

type TermDef = { title: string; def: string; es: string }

const TERMS: Record<string, TermDef> = {
  myositis: {
    title: 'Myositis',
    def: 'Muscle inflammation. Your body’s defense system attacks your own muscles by mistake, so they get swollen, sore and weak.',
    es: 'Miositis — inflamación de los músculos',
  },
  atherosclerosis: {
    title: 'Atherosclerosis',
    def: 'Your arteries are the tubes that carry blood. Fatty material builds up on the inside walls, so the tubes get narrow and stiff and less blood gets through.',
    es: 'Aterosclerosis — endurecimiento de las arterias',
  },
  prednisone: {
    title: 'Prednisone',
    def: 'A strong pill that calms inflammation down. It works. But taking it for many years quietly costs you something in your bones, blood sugar, blood pressure, sleep and mood — and those costs are supposed to be measured.',
    es: 'Prednisona — un corticoide',
  },
  tinnitus: {
    title: 'Tinnitus',
    def: 'The ringing, buzzing or hissing you hear when there is no sound outside. It is real. It is made inside the ear or the hearing nerve.',
    es: 'Tinnitus / acúfenos — zumbido en los oídos',
  },
  vertigo: {
    title: 'Vertigo',
    def: 'The feeling that you or the room is spinning. This is not the same as feeling faint or lightheaded, and doctors treat the two completely differently.',
    es: 'Vértigo — sensación de que todo gira',
  },
  bppv: {
    title: 'The crystal kind of vertigo',
    def: 'The most common cause of spinning. Tiny crystals inside the ear come loose and float where they should not. This is the good-news kind: a doctor can often fix it in one visit by moving your head in a set pattern.',
    es: 'VPPB — vértigo posicional paroxístico benigno',
  },
  dixhallpike: {
    title: 'Dix-Hallpike test',
    def: 'A one-minute test in the office. The doctor lays you back quickly with your head turned to one side and watches your eyes. It tells them whether your spinning is the crystal kind.',
    es: 'Prueba de Dix-Hallpike',
  },
  epley: {
    title: 'Epley maneuver',
    def: 'The fix for the crystal kind of spinning. The doctor guides your head through four positions to move the crystals back where they belong. No pills, no surgery, often one visit.',
    es: 'Maniobra de Epley',
  },
  audiogram: {
    title: 'Hearing test (audiogram)',
    def: 'You sit in a quiet booth with headphones and raise your hand each time you hear a beep. Painless, about thirty minutes. It turns “my ear rings” into a measurement on paper.',
    es: 'Audiometría — prueba de audición',
  },
  dexa: {
    title: 'Bone scan (DEXA)',
    def: 'You lie on a table for ten minutes while a low-dose scanner measures how strong your bones are. No needles, no tunnel. It is the standard check after years of prednisone.',
    es: 'Densitometría ósea',
  },
  statin: {
    title: 'Statin',
    def: 'A pill that lowers cholesterol to protect your arteries. Most people do well on it. In some people it causes muscle aching and weakness — which is why it matters here.',
    es: 'Estatina — pastilla para el colesterol',
  },
  taper: {
    title: 'Taper',
    def: 'Lowering a medicine dose slowly and on purpose, in small steps, with a doctor watching. The opposite of just stopping.',
    es: 'Reducción gradual de la dosis',
  },
  sparing: {
    title: 'Steroid-sparing medicine',
    def: 'A second medicine given so the prednisone dose can come down. The whole point is to protect you from the long-term price of prednisone while still controlling the disease.',
    es: 'Medicamento ahorrador de esteroides',
  },
  biopsy: {
    title: 'Muscle biopsy',
    def: 'A doctor takes a very small piece of muscle, usually with a needle, and looks at it under a microscope. It is how myositis gets confirmed rather than assumed.',
    es: 'Biopsia muscular',
  },
  ck: {
    title: 'CK blood test',
    def: 'One ordinary blood draw. When muscle is being damaged right now, this number goes up. It is the cheapest way to ask “is the muscle problem still active today?”',
    es: 'Creatina quinasa (CK) — análisis de sangre',
  },
  pulsatile: {
    title: 'Pulsating ringing',
    def: 'Ringing that beats in time with your heart — whoosh, whoosh, whoosh. It points to blood flow rather than hearing. That means a different doctor and a different test.',
    es: 'Tinnitus pulsátil',
  },
  hba1c: {
    title: 'HbA1c',
    def: 'A blood test that shows your average blood sugar over the last three months. Prednisone pushes this number up, so it should be watched.',
    es: 'Hemoglobina glicosilada (A1c)',
  },
  healthspan: {
    title: 'Healthspan',
    def: 'Not how long you live. How many of those years you spend feeling good and able to do what you want. This whole page is about that number.',
    es: 'Años de vida saludable',
  },
  carotid: {
    title: 'Neck artery scan',
    def: 'A painless scan with warm gel on your neck, about twenty minutes. It looks at the big arteries that feed your brain and your ears.',
    es: 'Ecografía carotídea',
  },
  ent: {
    title: 'ENT doctor',
    def: 'The ear, nose and throat specialist. The right person for ringing, spinning and hearing.',
    es: 'Otorrinolaringólogo',
  },
  rheum: {
    title: 'Rheumatologist',
    def: 'The specialist for muscle and joint conditions like myositis. The doctor who owns your prednisone decision.',
    es: 'Reumatólogo',
  },
  ototoxic: {
    title: 'Ear-harming medicines',
    def: 'Some ordinary, widely used medicines can affect the inner ear and cause ringing or spinning. Nobody is doing anything wrong — it is just a known side effect that has to be checked against your list.',
    es: 'Medicamentos ototóxicos',
  },
  b12: {
    title: 'Vitamin B12',
    def: 'A vitamin your nerves need. When it runs low, balance gets worse and you feel unsteady. A simple blood test, and easy to fix if it is low.',
    es: 'Vitamina B12',
  },
}

/* ============================================================
   TOOLTIP TERM
   Hover on a computer, tap on a phone. On a phone the
   definition comes up as a panel at the bottom of the screen
   so it can never run off the edge.
   ============================================================ */

function T({ k, children }: { k: keyof typeof TERMS; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const t = TERMS[k]

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span className="tip-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="tip-term"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {children}
      </button>
      {open && (
        <span className="tip" role="tooltip" onClick={(e) => e.stopPropagation()}>
          <span className="tip-head">{t.title}</span>
          {t.def}
          <span className="tip-es">En español · {t.es}</span>
        </span>
      )}
    </span>
  )
}

/* ============================================================
   FOLDS
   Everything below the map stays closed until it is asked for.
   Content stays in the DOM so links into it — and printing —
   still work.
   ============================================================ */

type FoldState = {
  open: Record<string, boolean>
  toggle: (id: string) => void
  go: (id: string) => void
}
const FoldCtx = createContext<FoldState>({ open: {}, toggle: () => {}, go: () => {} })

function Fold({
  id,
  num,
  title,
  sub,
  sub2,
  nested,
  children,
}: {
  id: string
  num: string
  title: string
  sub?: string
  sub2?: string
  nested?: boolean
  children: React.ReactNode
}) {
  const { open, toggle } = useContext(FoldCtx)
  const isOpen = !!open[id]
  return (
    <div className={`fold${nested ? ' subfold' : ''}${isOpen ? ' open' : ''}`} id={id}>
      <button type="button" className="fold-head" aria-expanded={isOpen} onClick={() => toggle(id)}>
        <span className="fold-num">{num}</span>
        <span className="fold-title">
          {title}
          {(sub || sub2) && (
            <span className="fold-sub">
              {isOpen ? sub2 || sub : sub}
            </span>
          )}
        </span>
        <span className="fold-sign" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div className="fold-body">{children}</div>
    </div>
  )
}

function BackToMap() {
  const { go } = useContext(FoldCtx)
  return (
    <button type="button" className="totop" onClick={() => go('map')}>
      ↑ Back to the map
    </button>
  )
}

/* ============================================================
   HOW COMPLETE THE RECORD IS
   Honest numbers. The emptiness is the argument.
   ============================================================ */

const RECORD_SECTIONS: { label: string; pct: number; note: string }[] = [
  { label: 'Conditions named', pct: 40, note: 'Two named. Neither one dated.' },
  { label: 'Symptoms named', pct: 35, note: 'Three named. None dated, none measured.' },
  { label: 'Medicine list', pct: 8, note: 'One name out of an unknown number.' },
  { label: 'Dose history', pct: 0, note: 'No doses, no start dates, no changes.' },
  { label: 'Test results', pct: 0, note: 'Nothing. Not one number.' },
  { label: 'Doctors & hospitals', pct: 0, note: 'No names, no cities, no years.' },
  { label: 'Symptom dates', pct: 0, note: 'We know what. We do not know when.' },
  { label: 'Family history', pct: 0, note: 'Nothing recorded.' },
  { label: 'Day-to-day numbers', pct: 0, note: 'No blood pressure, sleep or weight.' },
]

const RECORD_PCT = Math.round(
  RECORD_SECTIONS.reduce((s, r) => s + r.pct, 0) / RECORD_SECTIONS.length
)

/* ============================================================
   THE QUESTION LEDGER
   Every question has a permanent number so it can be referred
   to in a text message: "answered Q1 and Q4".
   ============================================================ */

type Q = { id: string; q: string; why: string; pri: 'now' | 'next' | 'later' }

const Q_RINGING: Q[] = [
  {
    id: 'q1',
    q: 'Does the ringing beat in time with your heart? Put two fingers on your wrist, feel your pulse, and listen.',
    why: 'This is the single highest-value answer on the page. If it beats with your pulse, the ringing is about blood flow — and you already have a blood-vessel condition. That is a different doctor and a different test. If it does not, it is about hearing.',
    pri: 'now',
  },
  {
    id: 'q2',
    q: 'Is it in one ear, or both?',
    why: 'One ear only gets taken more seriously and usually gets scanned. Both ears points somewhere else.',
    pri: 'now',
  },
  {
    id: 'q3',
    q: 'Roughly what year did it start? What else changed around then — especially a new pill?',
    why: 'Several common medicines can start a ringing. If yours began within a few months of a new prescription, that is the very first thing to check.',
    pri: 'now',
  },
  {
    id: 'q4',
    q: 'Has anyone ever tested your hearing with headphones in a quiet booth?',
    why: 'If not, then nobody has ever actually measured the thing that has been bothering you every day.',
    pri: 'now',
  },
  {
    id: 'q5',
    q: 'Is it worse at certain times of day, or after certain things — salty food, coffee, stress, a bad night of sleep?',
    why: 'A pattern is a clue. No pattern is also a clue.',
    pri: 'next',
  },
  {
    id: 'q6',
    q: 'Does your hearing feel muffled or worse in the ringing ear?',
    why: 'Ringing plus changed hearing plus spinning is a specific picture that has its own name and its own treatment.',
    pri: 'next',
  },
]

const Q_DIZZY: Q[] = [
  {
    id: 'q7',
    q: 'When it hits, does the room spin — or do you feel faint, like you might pass out?',
    why: 'Spinning points to the ear. Faint points to the heart or blood pressure. Two different departments, and you have reasons to consider both.',
    pri: 'now',
  },
  {
    id: 'q8',
    q: 'Does it start when you roll over in bed, lie down, or tip your head back?',
    why: 'If yes, it is probably the most common and most fixable kind — often solved in a single visit.',
    pri: 'now',
  },
  {
    id: 'q9',
    q: 'How long does one episode last — seconds, minutes, or hours?',
    why: 'Seconds points one way. Twenty minutes to a few hours points another. All day points to a third. The clock is the diagnosis.',
    pri: 'now',
  },
  {
    id: 'q10',
    q: 'Have you ever fallen, or nearly fallen, because of it?',
    why: 'A fall changes the urgency of everything on this page. It is also the fastest way to lose independent years.',
    pri: 'now',
  },
  {
    id: 'q11',
    q: 'Does it come with nausea, headache, or changes in your vision?',
    why: 'It separates an ear problem from a migraine problem, which is more common than people expect.',
    pri: 'next',
  },
]

const Q_PILLS: Q[] = [
  {
    id: 'q12',
    q: 'What is every pill you take right now — the name, the dose, and how many times a day?',
    why: 'Nothing else on this page can move forward without this. Photograph every bottle, front label and pharmacy sticker.',
    pri: 'now',
  },
  {
    id: 'q13',
    q: 'What year did you start prednisone? “Around when we moved” is a good enough answer.',
    why: 'The number of years on prednisone decides which checks you are owed. Right now nobody knows the number.',
    pri: 'now',
  },
  {
    id: 'q14',
    q: 'What dose are you on today? Has it ever been lowered? What happened when it was?',
    why: 'Lowered and held is one story. Lowered and put straight back up is a completely different one, and it changes the next conversation.',
    pri: 'now',
  },
  {
    id: 'q15',
    q: 'Which pharmacy do you use, and have you used it for years?',
    why: 'A pharmacy can print your entire fill history in one visit. That single printout could fill most of the empty bars in section 01.',
    pri: 'now',
  },
  {
    id: 'q16',
    q: 'Were you ever given a second medicine so the prednisone could come down?',
    why: 'If the answer is no after all these years, that is a fair and specific question to put to your specialist.',
    pri: 'next',
  },
  {
    id: 'q17',
    q: 'Is there any pill you stopped taking? Which one, and why?',
    why: 'What was stopped, and what happened after, is often more informative than what you are still on.',
    pri: 'next',
  },
]

const Q_HISTORY: Q[] = [
  {
    id: 'q18',
    q: 'What year were you told you had myositis? Which doctor, which city?',
    why: 'Everything you have taken since then rests on that one appointment.',
    pri: 'now',
  },
  {
    id: 'q19',
    q: 'Was a small piece of muscle ever taken and looked at under a microscope? What year?',
    why: 'It is the difference between a confirmed diagnosis and one that was assumed and then carried forward for decades.',
    pri: 'now',
  },
  {
    id: 'q20',
    q: 'Do you have a login to any patient portal or online health account?',
    why: 'Most systems let you download years of results in one click. This is the single fastest way to fill this page.',
    pri: 'now',
  },
  {
    id: 'q21',
    q: 'What year were you told about your arteries, and what were you told to do about it?',
    why: 'It dates the second condition and tells us which medicines should have started around then.',
    pri: 'next',
  },
  {
    id: 'q22',
    q: 'Which hospitals and clinics have you been to, roughly which years — in Panama, in Arkansas, and since?',
    why: 'Records still exist in those buildings. They can be requested, but only if we know where to write.',
    pri: 'next',
  },
  {
    id: 'q23',
    q: 'Your parents and your brothers and sisters — heart trouble, muscle trouble, hearing loss, diabetes? At what ages?',
    why: 'It is free information that changes how seriously a doctor treats a borderline number.',
    pri: 'later',
  },
]

const Q_TOTAL = Q_RINGING.length + Q_DIZZY.length + Q_PILLS.length + Q_HISTORY.length

function QTable({ rows }: { rows: Q[] }) {
  const chip = { now: 'Start here', next: 'Next', later: 'When you can' }
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th className="mono">No.</th>
            <th>The question</th>
            <th>Why we are asking</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} id={r.id}>
              <td>
                <a className="refid" href={`#${r.id}`}>
                  {r.id.toUpperCase()}
                </a>
                <br />
                <span className={`chip ${r.pri}`}>{chip[r.pri]}</span>
              </td>
              <td className="q">{r.q}</td>
              <td className="why">{r.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ============================================================
   THE HYPOTHESIS LEDGER
   Seven honest guesses. Each one ends in something small and
   specific to ask a real doctor. None of them is a conclusion.
   ============================================================ */

const HYPOTHESES: { id: string; letter: string; title: string; body: JSX.Element; test: JSX.Element }[] = [
  {
    id: 'h-a',
    letter: 'Idea A',
    title: 'The ringing and the spinning may be one problem, not two',
    body: (
      <p>
        The inner ear does two jobs: it hears, and it keeps you balanced. When something goes wrong
        in there, you often get both symptoms — which is exactly what you have. They have been
        treated as two separate complaints, on two separate visits, by people who never compared
        notes.
      </p>
    ),
    test: (
      <p className="test">
        <b>How to check:</b> one visit to an <T k="ent">ear specialist</T> for an{' '}
        <T k="audiogram">audiogram</T> and a balance exam — and say both symptoms out loud in the
        same sentence, not one at a time.
      </p>
    ),
  },
  {
    id: 'h-b',
    letter: 'Idea B',
    title: 'The ringing may be a side effect, not age',
    body: (
      <p>
        You have taken a lot of pills for a long time. A number of very common ones are{' '}
        <T k="ototoxic">known to affect the inner ear</T>. If the ringing started within a few
        months of a new prescription, that timing is the clue — and nobody can see the timing
        because nobody has the list.
      </p>
    ),
    test: (
      <p className="test">
        <b>How to check:</b> your full medicine list with start dates, lined up against the year the
        ringing began. That is a chart we can draw the same day you send the photographs.
      </p>
    ),
  },
  {
    id: 'h-c',
    letter: 'Idea C',
    title: 'The spinning may be the easiest kind to fix',
    body: (
      <p>
        If your dizziness hits when you roll over in bed or tip your head back, and lasts less than
        a minute, it is very likely <T k="bppv">the crystal kind</T> — the most common cause of
        vertigo there is. It is also the one that is frequently fixed in a single office visit, with
        no medication at all. It has apparently never been tested for.
      </p>
    ),
    test: (
      <p className="test">
        <b>How to check:</b> ask for a <T k="dixhallpike">Dix-Hallpike test</T>. If it is positive,
        ask for the <T k="epley">Epley maneuver</T> right then. Both words are worth writing on a
        card and handing over.
      </p>
    ),
  },
  {
    id: 'h-d',
    letter: 'Idea D',
    title: 'If the ringing pulses, it may be about your arteries',
    body: (
      <p>
        You already have <T k="atherosclerosis">atherosclerosis</T>. If the ringing beats in time
        with your heartbeat, that is called <T k="pulsatile">pulsating ringing</T>, and it belongs
        to blood flow rather than hearing. It is a completely different investigation — and it is
        only ever started because a patient says the word.
      </p>
    ),
    test: (
      <p className="test">
        <b>How to check:</b> answer <a className="ref-inline" href="#q1">Q1</a>. If yes, say
        “pulsatile” to the doctor and ask whether a <T k="carotid">neck artery scan</T> is worth
        doing.
      </p>
    ),
  },
  {
    id: 'h-e',
    letter: 'Idea E',
    title: 'The original diagnosis deserves one honest re-check',
    body: (
      <p>
        This one is delicate, and it is not an accusation of anybody. If you are treated for your
        arteries you are likely on a <T k="statin">statin</T>, and statins can cause muscle aching
        and weakness that looks a lot like <T k="myositis">myositis</T>. If both have been running
        for years, it is possible nobody has ever separated the two. It is also possible the
        original diagnosis is exactly right — but after this many years on{' '}
        <T k="prednisone">prednisone</T>, it is a fair thing to confirm rather than assume.
      </p>
    ),
    test: (
      <p className="test">
        <b>How to check:</b> a <T k="ck">CK blood test</T>, and one direct question to the{' '}
        <T k="rheum">rheumatologist</T>: “has this diagnosis ever been formally revisited since the
        first <T k="biopsy">biopsy</T>?”
      </p>
    ),
  },
  {
    id: 'h-f',
    letter: 'Idea F',
    title: 'Decades of prednisone have a bill, and nobody has opened it',
    body: (
      <p>
        Prednisone is a good drug that saves function and sometimes lives. It also has a known
        long-term price: bones, blood sugar, blood pressure, eyes, mood, sleep. The standard of care
        is to measure those things regularly. As far as we know, none of them have been measured.
        That is not a reason to stop the medicine — it is a reason to check the bill.
      </p>
    ),
    test: (
      <p className="test">
        <b>How to check:</b> ask for a <T k="dexa">bone scan</T>, an <T k="hba1c">HbA1c</T>, a{' '}
        <T k="b12">vitamin B12</T> level, an eye exam, and two weeks of blood pressure readings. All
        routine. All cheap. None of them done yet.
      </p>
    ),
  },
  {
    id: 'h-g',
    letter: 'Idea G',
    title: 'The irritability has three possible sources, treated three different ways',
    body: (
      <p>
        Being irritable every day is not a character flaw and it is not just how you are. It has
        candidates: prednisone itself is well known for it; sleep destroyed nightly by a ringing ear
        will do it to anyone; and decades of being unwell wears down mood on its own. Those three
        are treated completely differently, so guessing is expensive.
      </p>
    ),
    test: (
      <p className="test">
        <b>How to check:</b> two weeks of a very simple notebook — how you slept, how loud the
        ringing was, how you felt. Three lines a day. That notebook separates the three candidates
        better than any test.
      </p>
    ),
  },
]

/* ============================================================
   THE MAP
   ============================================================ */

const MAP: { id: string; nav: string; num: string; title: string; desc: string; you: string; time: string }[] = [
  {
    id: 's01',
    nav: 'Know',
    num: '01',
    title: 'What we know',
    desc: 'Everything we know about your health today. Six facts — and not one of them has a date.',
    you: 'You: just read it.',
    time: '3 minutes',
  },
  {
    id: 's02',
    nav: 'Questions',
    num: '02',
    title: 'The questions',
    desc: `${Q_TOTAL} questions that only you can answer. Each one is numbered so we can talk about them.`,
    you: 'You: answer a few at a time.',
    time: '20 minutes at a time',
  },
  {
    id: 's03',
    nav: 'Ideas',
    num: '03',
    title: 'What we suspect',
    desc: 'Seven honest guesses about what might be going on, each with one thing to ask a doctor.',
    you: 'You: read, then bring them.',
    time: '10 minutes',
  },
  {
    id: 's04',
    nav: 'Send',
    num: '04',
    title: 'What to send me',
    desc: 'Eight things to gather. None of them medical. This is the part that actually builds the page.',
    you: 'You: this is the real work.',
    time: 'a few weeks',
  },
  {
    id: 's05',
    nav: 'Example',
    num: '05',
    title: 'The example',
    desc: 'What a finished record looks like, using a made-up person. This is where we are going.',
    you: 'You: just look at it.',
    time: '3 minutes',
  },
  {
    id: 's06',
    nav: 'Words',
    num: '06',
    title: 'The words',
    desc: 'Every medical word on this page, explained in plain language, with the Spanish term.',
    you: 'You: look things up.',
    time: 'whenever you need it',
  },
]

const SECTION_IDS = MAP.map((m) => m.id)
const SUB_IDS = [
  'q-ringing',
  'q-dizzy',
  'q-pills',
  'q-history',
  ...HYPOTHESES.map((h) => h.id),
  'ex-timeline',
  'ex-dose',
  'ex-tests',
]
const ALL_IDS = [...SECTION_IDS, ...SUB_IDS]

/* ============================================================
   PAGE
   ============================================================ */

export default function MomPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [pending, setPending] = useState<string | null>(null)
  const [daysToBirthday, setDaysToBirthday] = useState<number | null>(null)

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }))
  const go = (id: string) => {
    setOpen((o) => ({ ...o, [id]: true }))
    setPending(id)
  }

  const allOpen = SECTION_IDS.every((id) => open[id])
  const setAll = (v: boolean) =>
    setOpen(v ? Object.fromEntries(ALL_IDS.map((id) => [id, true])) : {})

  useEffect(() => {
    const now = new Date()
    const bday = new Date(2026, 9, 24) // October 24, 2026
    const ms = bday.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    setDaysToBirthday(Math.max(0, Math.round(ms / 86400000)))
  }, [])

  // A link straight to a question or an idea opens whatever it is buried in.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (!hash) return
    const el = document.getElementById(hash)
    if (!el) return
    const ids: string[] = []
    let node: HTMLElement | null = el
    while (node) {
      if (node.id && node.classList && node.classList.contains('fold')) ids.push(node.id)
      node = node.parentElement
    }
    if (ids.length) setOpen((o) => ({ ...o, ...Object.fromEntries(ids.map((i) => [i, true])) }))
    setPending(hash)
  }, [])

  useEffect(() => {
    if (!pending) return
    document.getElementById(pending)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setPending(null)
  }, [pending])

  return (
    <FoldCtx.Provider value={{ open, toggle, go }}>
      <div className="mom-root">
        <div className="banner">
          A working page · Built for Mom · Everything here is a question, <b>not a diagnosis</b>
        </div>

        {/* ============ STICKY NAV ============ */}
        <nav className="navbar">
          <div className="navbar-inner">
            <button type="button" className="navlink" onClick={() => go('map')}>
              The map
            </button>
            {MAP.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`navlink${open[m.id] ? ' is-open' : ''}`}
                onClick={() => go(m.id)}
              >
                {m.num} {m.nav}
              </button>
            ))}
            <button type="button" className="navlink all" onClick={() => setAll(!allOpen)}>
              {allOpen ? 'Close all' : 'Open all'}
            </button>
          </div>
        </nav>

        <div className="sheet">
          {/* ============ MASTHEAD ============ */}
          <header className="mast">
            <div className="eyebrow">For Mom · Started August 2026</div>
            <h1>
              We are going to write your health down, <em>in one place</em>
            </h1>
            <p className="standfirst">
              Nothing on this page is urgent and nothing on it is bad news. Read the short version
              below, then open only the part you want.
            </p>
            <p className="hint">
              Any word with a dotted underline — like <T k="healthspan">healthspan</T> — has a plain
              explanation. Hover over it, or tap it on your phone.
            </p>
          </header>

          {/* ============ THE SHORT VERSION ============ */}
          <div className="summary" id="summary">
            <div className="kicker">The short version</div>
            <p>
              Your health history is written down in about nine different places — hospitals in two
              countries, a few clinics, a drawer of printouts, a pharmacy computer, and your memory.
              No single doctor has ever seen all of it at once.
            </p>
            <p>
              So every appointment starts from zero. You get about twelve minutes, you spend eight
              of them explaining, and then a decision gets made on a small piece of the picture.
            </p>
            <p>
              We are going to put all of it on one page. Not to worry you — to get you better
              answers in less time, and to give you more good years. <b>Right now that page is{' '}
              {RECORD_PCT}% built,</b> and the rest of it is waiting on you. None of what we need is
              medical. It is photographs, printouts, and remembering.
            </p>
          </div>

          <div className="onething">
            <div className="t">If you do only one thing today</div>
            <p className="big">
              Put two fingers on your wrist and find your pulse. Now listen to the ringing in your
              ear. Does the ringing beat in time with your heart?
            </p>
            <p>
              Yes or no — that is the whole answer, and it changes which doctor you should see. Text
              it to me. It is <a className="ref-inline" href="#q1">Q1</a> on the list.
            </p>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="n">{RECORD_PCT}%</div>
              <div className="l">of your record built</div>
            </div>
            <div className="stat">
              <div className="n">{Q_TOTAL}</div>
              <div className="l">questions waiting on you</div>
            </div>
            <div className="stat">
              <div className="n">{HYPOTHESES.length}</div>
              <div className="l">ideas still untested</div>
            </div>
            <div className="stat">
              <div className="n">{daysToBirthday ?? '—'}</div>
              <div className="l">days until you turn 60</div>
            </div>
          </div>

          {/* ============ THE MAP ============ */}
          <section id="map">
            <div className="sec-head">
              <span className="sec-num">MAP</span>
              <h2>Where everything is</h2>
            </div>
            <p className="lede">
              The page has six parts. They are all closed until you open them, so nothing is in your
              way. Click any card to open that part.
            </p>
            <div className="map">
              {MAP.map((m) => (
                <button key={m.id} type="button" className="map-card" onClick={() => go(m.id)}>
                  <span className="n">{m.num}</span>
                  <span className="t">{m.title}</span>
                  <span className="d">{m.desc}</span>
                  <span className="m">
                    {m.you} · {m.time}
                    <span className="go">Open →</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="fig-cap" style={{ borderTop: 0, paddingTop: 0 }}>
              Every question is numbered Q1 to Q{Q_TOTAL} and every idea is lettered A to G. Those
              numbers never change, so we can talk about them on the phone — “I answered Q1 and
              Q8.”
            </p>
          </section>

          <div style={{ paddingTop: '44px' }}>
            {/* ============ 01 WHAT WE KNOW ============ */}
            <Fold
              id="s01"
              num="01"
              title="What we know"
              sub={`Six facts · none of them dated · record ${RECORD_PCT}% built`}
            >
              <p className="lede">
                This is the honest starting point. Six facts, and not one of them has a date
                attached. Read it and you will see the problem immediately.
              </p>

              <div className="facts">
                <div className="fact">
                  <div className="k">Condition</div>
                  <div className="v">
                    <T k="myositis">Myositis</T>
                  </div>
                  <div className="n">Year unknown · Confirmed how? Unknown</div>
                </div>
                <div className="fact">
                  <div className="k">Condition</div>
                  <div className="v">
                    <T k="atherosclerosis">Atherosclerosis</T>
                  </div>
                  <div className="n">Year unknown · Treated with what? Unknown</div>
                </div>
                <div className="fact">
                  <div className="k">Medicine</div>
                  <div className="v">
                    <T k="prednisone">Prednisone</T>
                  </div>
                  <div className="n">Many years · Start date unknown · Dose unknown</div>
                </div>
                <div className="fact unknown">
                  <div className="k">Symptom</div>
                  <div className="v">Ringing in the ear</div>
                  <div className="n">Constant · Start date unknown · Never measured</div>
                </div>
                <div className="fact unknown">
                  <div className="k">Symptom</div>
                  <div className="v">
                    <T k="vertigo">Vertigo</T>
                  </div>
                  <div className="n">Ongoing · Pattern unknown · Never tested</div>
                </div>
                <div className="fact unknown">
                  <div className="k">Symptom</div>
                  <div className="v">Irritable all day</div>
                  <div className="n">Daily · Cause unknown · Three candidates</div>
                </div>
              </div>

              <p>
                You also turn <b>60 on October 24, 2026</b>
                {daysToBirthday !== null && <> — {daysToBirthday} days from today</>}. That is the
                one date on this entire page we are sure about. Sixty is exactly the age when the
                tests nobody has done yet start to matter most.
              </p>

              <div className="sub">Your timeline, drawn honestly</div>
              <div className="figure">
                <p className="swipe">← Swipe to see all the years →</p>
                <div className="scroller">
                  <svg
                    viewBox="0 0 900 400"
                    role="img"
                    aria-label="A timeline from 1966 to 2026 in which every one of the six known facts is an undated question mark, with only the 60th birthday placed on the calendar"
                  >
                    <g stroke="#D2DACD" strokeWidth="1">
                      <line x1="170" y1="60" x2="170" y2="320" />
                      <line x1="286" y1="60" x2="286" y2="320" />
                      <line x1="403" y1="60" x2="403" y2="320" />
                      <line x1="520" y1="60" x2="520" y2="320" />
                      <line x1="636" y1="60" x2="636" y2="320" />
                      <line x1="753" y1="60" x2="753" y2="320" />
                      <line x1="870" y1="60" x2="870" y2="320" />
                    </g>
                    <g
                      fontFamily="IBM Plex Mono, monospace"
                      fontSize="12"
                      fill="#4A5A63"
                      textAnchor="middle"
                    >
                      <text x="170" y="48">1966</text>
                      <text x="286" y="48">1976</text>
                      <text x="403" y="48">1986</text>
                      <text x="520" y="48">1996</text>
                      <text x="636" y="48">2006</text>
                      <text x="753" y="48">2016</text>
                      <text x="870" y="48">2026</text>
                    </g>
                    <text
                      x="170"
                      y="34"
                      fontFamily="IBM Plex Mono, monospace"
                      fontSize="11"
                      fill="#2D5C8F"
                      textAnchor="middle"
                    >
                      born
                    </text>

                    <g
                      fontFamily="IBM Plex Mono, monospace"
                      fontSize="12.5"
                      fill="#1B2A36"
                      textAnchor="end"
                    >
                      <text x="158" y="94">Myositis</text>
                      <text x="158" y="134">Atherosclerosis</text>
                      <text x="158" y="174">Prednisone</text>
                      <text x="158" y="214">All other pills</text>
                      <text x="158" y="254">Ringing in ear</text>
                      <text x="158" y="294">Vertigo</text>
                    </g>

                    <g fill="none" stroke="#B7C2B0" strokeWidth="1" strokeDasharray="5 5">
                      <rect x="170" y="78" width="700" height="22" />
                      <rect x="170" y="118" width="700" height="22" />
                      <rect x="170" y="158" width="700" height="22" />
                      <rect x="170" y="198" width="700" height="22" />
                      <rect x="170" y="238" width="700" height="22" />
                      <rect x="170" y="278" width="700" height="22" />
                    </g>

                    <g
                      fontFamily="IBM Plex Mono, monospace"
                      fontSize="12"
                      fill="#A8611A"
                      textAnchor="middle"
                    >
                      <text x="520" y="94">?   started when — nobody knows</text>
                      <text x="520" y="134">?   started when — nobody knows</text>
                      <text x="520" y="174">?   started when, at what dose</text>
                      <text x="520" y="214">?   we do not even have the names</text>
                      <text x="520" y="254">?   started when — nobody knows</text>
                      <text x="520" y="294">?   started when — nobody knows</text>
                    </g>

                    <line x1="170" y1="320" x2="870" y2="320" stroke="#1B2A36" strokeWidth="1.5" />
                    <text
                      x="170"
                      y="344"
                      fontFamily="IBM Plex Mono, monospace"
                      fontSize="11"
                      fill="#4A5A63"
                      letterSpacing="1.5"
                    >
                      WHAT WE CAN ACTUALLY PLACE ON THE CALENDAR
                    </text>
                    <circle cx="870" cy="372" r="5" fill="#2D5C8F" />
                    <text
                      x="856"
                      y="377"
                      fontFamily="Source Serif 4, serif"
                      fontSize="15"
                      fill="#2D5C8F"
                      fontWeight="600"
                      textAnchor="end"
                    >
                      October 24, 2026 — you turn 60
                    </text>
                  </svg>
                </div>
                <p className="fig-cap">
                  <b>What this shows:</b> one dot. Sixty years of your life, six real medical facts,
                  and exactly one of them can be placed on a calendar. Every question mark above is
                  one conversation, one photograph, or one phone call away from becoming a date.
                  That is the whole job.
                </p>
              </div>

              <div className="sub">How much of your record exists</div>
              <div className="meter">
                <div className="meter-top">
                  <div className="meter-big">{RECORD_PCT}%</div>
                  <div className="meter-cap">
                    built so far. Not a judgment — nobody ever asked you for this. It is just the
                    starting line, and it only moves in one direction from here.
                  </div>
                </div>
                {RECORD_SECTIONS.map((r) => (
                  <div className={`bar-row${r.pct >= 80 ? ' done' : ''}`} key={r.label}>
                    <div className="lbl">
                      {r.label}
                      <br />
                      <span style={{ color: '#4A5A63' }}>{r.note}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${r.pct}%` }} />
                    </div>
                    <div className="pct">{r.pct}%</div>
                  </div>
                ))}
              </div>
              <p>
                Two things would move almost every bar at once: the photographs of your pill
                bottles, and one printout from your pharmacy. Neither one is medical. Both are an
                afternoon.
              </p>
              <BackToMap />
            </Fold>

            {/* ============ 02 QUESTIONS ============ */}
            <Fold
              id="s02"
              num="02"
              title="The questions"
              sub={`${Q_TOTAL} questions · numbered Q1 to Q${Q_TOTAL} · four groups`}
            >
              <p className="lede">
                A running list, and it will keep growing as answers come in. None of these need a
                doctor. They need you, and about twenty minutes at a time. Start with the ones
                marked “start here” — they are the ones that change what happens next. Open one
                group at a time.
              </p>

              <Fold id="q-ringing" num="Q1–Q6" title="About the ringing" sub="6 questions" nested>
                <QTable rows={Q_RINGING} />
              </Fold>
              <Fold id="q-dizzy" num="Q7–Q11" title="About the dizziness" sub="5 questions" nested>
                <QTable rows={Q_DIZZY} />
              </Fold>
              <Fold id="q-pills" num="Q12–Q17" title="About the pills" sub="6 questions" nested>
                <QTable rows={Q_PILLS} />
              </Fold>
              <Fold id="q-history" num="Q18–Q23" title="About the history" sub="6 questions" nested>
                <QTable rows={Q_HISTORY} />
              </Fold>
              <div style={{ marginTop: '20px' }}>
                <BackToMap />
              </div>
            </Fold>

            {/* ============ 03 HYPOTHESES ============ */}
            <Fold
              id="s03"
              num="03"
              title="What we suspect"
              sub={`${HYPOTHESES.length} ideas · all untested · A to G`}
            >
              <p className="lede">
                These are not answers. They are honest guesses written down so they can be tested
                and then crossed off — or confirmed. Every one ends with something small and
                specific to ask a real doctor. Nothing here replaces your doctors; it gives them a
                better starting page.
              </p>

              {HYPOTHESES.map((h) => (
                <Fold key={h.id} id={h.id} num={h.letter} title={h.title} sub="Untested" nested>
                  {h.body}
                  {h.test}
                  <p style={{ marginTop: '12px', marginBottom: 0 }}>
                    <a className="refid" href={`#${h.id}`}>
                      {h.letter.toUpperCase()}
                    </a>
                  </p>
                </Fold>
              ))}

              <div className="sub">Also worth asking about, in time</div>
              <p>
                Whether a <T k="sparing">steroid-sparing medicine</T> has ever been tried so the
                prednisone dose could come down. Whether a <T k="taper">taper</T> was ever
                attempted, and what happened. Whether your muscle condition is still active today,
                or quiet and being treated out of habit. These are long-game questions — they need
                the record built first, which is why they are here at the bottom rather than the
                top.
              </p>
              <BackToMap />
            </Fold>

            {/* ============ 04 WHAT WE NEED ============ */}
            <Fold
              id="s04"
              num="04"
              title="What to send me"
              sub="8 things · none of them medical · this is the real work"
            >
              <p className="lede">
                Nothing medical. Nothing difficult. Paper, photographs, and a little remembering. Do
                one item a week and this page is full before your birthday.
              </p>

              <ol className="check">
                <li id="send-1">
                  <b>Photograph every pill bottle in the house.</b> The front label and the pharmacy
                  sticker. Do not sort them or decide which ones matter — send all of them,
                  including the ones you stopped taking.
                  <span className="aside">Moves three bars at once. Do this one first.</span>
                </li>
                <li id="send-2">
                  <b>Ask your pharmacy to print your fill history.</b> Walk in and say: “Can I have
                  a printout of everything I have filled here?” They do this all day long.
                  <span className="aside">One piece of paper. Possibly years of dose history.</span>
                </li>
                <li id="send-3">
                  <b>Any printout, letter or discharge note</b> in a drawer, a folder, a box, or a
                  bag. Even old ones. Especially old ones.
                  <span className="aside">
                    Old paper is the only thing that can date the early years.
                  </span>
                </li>
                <li id="send-4">
                  <b>The names of doctors and hospitals</b> you have been to, roughly when, and what
                  they told you. Panama, Arkansas, and everywhere since.
                  <span className="aside">
                    Records still exist. We just need to know where to write.
                  </span>
                </li>
                <li id="send-5">
                  <b>Your online health portal logins.</b> Most systems let you download years of
                  results in one click. We can sit down and do this together on a call.
                  <span className="aside">The single fastest way to fill this page.</span>
                </li>
                <li id="send-6">
                  <b>Your memory of when things started.</b> Not exact dates. “The summer we moved”
                  or “after my mother died” is enough to place it on the timeline.
                  <span className="aside">Your memory is a real data source. Treat it like one.</span>
                </li>
                <li id="send-7">
                  <b>Two weeks of three-line notes:</b> how you slept, how loud the ringing was,
                  whether the room spun. A cheap notebook by the bed is enough.
                  <span className="aside">
                    This is the one thing no doctor and no record can give us.
                  </span>
                </li>
                <li id="send-8">
                  <b>One answer, today:</b> does the ringing beat in time with your heartbeat? Feel
                  your pulse and listen.
                  <span className="aside">
                    That single answer changes which specialist you should see.
                  </span>
                </li>
              </ol>

              <div className="urgent">
                <div className="t">Do not wait for any of this if —</div>
                <ul>
                  <li>Your hearing drops suddenly in one ear. That is measured in hours, not weeks.</li>
                  <li>
                    Dizziness comes with double vision, slurred speech, weakness on one side, or the
                    worst headache of your life.
                  </li>
                  <li>You have chest pain, or you fall and hit your head.</li>
                </ul>
                <p style={{ fontSize: '16px', color: '#4A5A63' }}>
                  Those are emergency-room situations, not build-the-record situations. Everything
                  else on this page can be done calmly, one week at a time.
                </p>
              </div>
              <BackToMap />
            </Fold>

            {/* ============ 05 THE EXAMPLE ============ */}
            <Fold
              id="s05"
              num="05"
              title="The example"
              sub="Invented data · a picture of the format, not of you"
            >
              <div className="stamp">
                Example only · Every name, date, dose and number below is invented — this is a
                picture of the format, not of you
              </div>
              <p className="lede">
                This is a made-up record for a made-up person, built to show what yours could look
                like — and what a doctor would be able to see in it that nobody can see today.
              </p>

              <Fold
                id="ex-timeline"
                num="Fig. 1"
                title="Every prescription on one line"
                sub="Shows a symptom appearing right after a new pill"
                nested
              >
                <div className="figure">
                  <p className="swipe">← Swipe to see all the years →</p>
                  <div className="scroller">
                    <svg
                      viewBox="-25 0 925 470"
                      role="img"
                      aria-label="Example timeline showing six medications from 1990 to 2026 with symptom onset markers below"
                    >
                      <g stroke="#D2DACD" strokeWidth="1">
                        <line x1="90" y1="60" x2="90" y2="360" />
                        <line x1="197" y1="60" x2="197" y2="360" />
                        <line x1="304" y1="60" x2="304" y2="360" />
                        <line x1="411" y1="60" x2="411" y2="360" />
                        <line x1="518" y1="60" x2="518" y2="360" />
                        <line x1="625" y1="60" x2="625" y2="360" />
                        <line x1="732" y1="60" x2="732" y2="360" />
                        <line x1="860" y1="60" x2="860" y2="360" />
                      </g>
                      <g
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize="12"
                        fill="#4A5A63"
                        textAnchor="middle"
                      >
                        <text x="90" y="48">1990</text>
                        <text x="197" y="48">1995</text>
                        <text x="304" y="48">2000</text>
                        <text x="411" y="48">2005</text>
                        <text x="518" y="48">2010</text>
                        <text x="625" y="48">2015</text>
                        <text x="732" y="48">2020</text>
                        <text x="860" y="48">2026</text>
                      </g>

                      <g
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize="12.5"
                        fill="#1B2A36"
                        textAnchor="end"
                      >
                        <text x="80" y="90">Prednisone</text>
                        <text x="80" y="130">Methotrexate</text>
                        <text x="80" y="170">Atorvastatin</text>
                        <text x="80" y="210">Amlodipine</text>
                        <text x="80" y="250" fill="#A8611A" fontWeight="600">
                          Furosemide
                        </text>
                        <text x="80" y="290">Aspirin 300mg</text>
                      </g>

                      <rect x="90" y="76" width="770" height="20" fill="#2D5C8F" opacity=".85" />
                      <text
                        x="470"
                        y="91"
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize="11"
                        fill="#F3F6EF"
                        textAnchor="middle"
                      >
                        continuous — 36 years
                      </text>

                      <rect x="304" y="116" width="150" height="20" fill="#2D5C8F" opacity=".5" />
                      <rect x="561" y="116" width="120" height="20" fill="#2D5C8F" opacity=".5" />
                      <rect x="475" y="156" width="385" height="20" fill="#2D5C8F" opacity=".5" />
                      <rect x="561" y="196" width="299" height="20" fill="#2D5C8F" opacity=".5" />
                      <rect x="710" y="236" width="150" height="20" fill="#A8611A" />
                      <rect x="646" y="276" width="214" height="20" fill="#A8611A" opacity=".55" />

                      <line
                        x1="710"
                        y1="256"
                        x2="710"
                        y2="392"
                        stroke="#A8611A"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      <line
                        x1="753"
                        y1="216"
                        x2="753"
                        y2="418"
                        stroke="#4A5A63"
                        strokeWidth="1"
                        strokeDasharray="3 5"
                      />

                      <line x1="90" y1="360" x2="860" y2="360" stroke="#1B2A36" strokeWidth="1.5" />
                      <text
                        x="90"
                        y="382"
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize="11"
                        fill="#4A5A63"
                        letterSpacing="1.5"
                      >
                        SYMPTOMS REPORTED
                      </text>

                      <circle cx="710" cy="392" r="5" fill="#A8611A" />
                      <text
                        x="698"
                        y="397"
                        fontFamily="Source Serif 4, serif"
                        fontSize="14.5"
                        fill="#A8611A"
                        fontWeight="600"
                        textAnchor="end"
                      >
                        Ringing in ear begins
                      </text>
                      <text
                        x="698"
                        y="413"
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize="11"
                        fill="#A8611A"
                        textAnchor="end"
                      >
                        6 weeks after a new water pill
                      </text>

                      <circle cx="753" cy="436" r="5" fill="#1B2A36" />
                      <text
                        x="741"
                        y="441"
                        fontFamily="Source Serif 4, serif"
                        fontSize="14.5"
                        fill="#1B2A36"
                        textAnchor="end"
                      >
                        First vertigo episode
                      </text>

                      <circle cx="817" cy="460" r="5" fill="#1B2A36" />
                      <text
                        x="805"
                        y="465"
                        fontFamily="Source Serif 4, serif"
                        fontSize="14.5"
                        fill="#1B2A36"
                        textAnchor="end"
                      >
                        Sleep disrupted nightly
                      </text>
                    </svg>
                  </div>
                  <p className="fig-cap">
                    <b>What this reveals:</b> the ringing did not come from nowhere. It began weeks
                    after a new water pill was added — a kind of medicine known to affect the inner
                    ear. Nobody spotted it, because the doctor who prescribed it and the doctor who
                    heard the complaint have never seen each other’s notes.
                  </p>
                </div>
              </Fold>

              <Fold
                id="ex-dose"
                num="Fig. 2"
                title="The dose story, in one curve"
                sub="Shows two attempts to lower a dose, both reversed"
                nested
              >
                <div className="figure">
                  <p className="swipe">← Swipe to see all the years →</p>
                  <div className="scroller">
                    <svg
                      viewBox="0 0 900 340"
                      role="img"
                      aria-label="Example line chart of daily prednisone dose from 1990 to 2026 with two failed attempts to lower it"
                    >
                      <g stroke="#D2DACD" strokeWidth="1">
                        <line x1="90" y1="60" x2="860" y2="60" />
                        <line x1="90" y1="120" x2="860" y2="120" />
                        <line x1="90" y1="180" x2="860" y2="180" />
                        <line x1="90" y1="240" x2="860" y2="240" />
                      </g>
                      <line x1="90" y1="280" x2="860" y2="280" stroke="#1B2A36" strokeWidth="1.5" />
                      <g
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize="11.5"
                        fill="#4A5A63"
                        textAnchor="end"
                      >
                        <text x="80" y="64">40mg</text>
                        <text x="80" y="124">30mg</text>
                        <text x="80" y="184">20mg</text>
                        <text x="80" y="244">10mg</text>
                        <text x="80" y="284">0</text>
                      </g>
                      <g
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize="12"
                        fill="#4A5A63"
                        textAnchor="middle"
                      >
                        <text x="90" y="304">1990</text>
                        <text x="304" y="304">2000</text>
                        <text x="518" y="304">2010</text>
                        <text x="732" y="304">2020</text>
                        <text x="860" y="304">2026</text>
                      </g>

                      <polyline
                        fill="none"
                        stroke="#2D5C8F"
                        strokeWidth="2.5"
                        points="90,60 133,72 197,150 261,168 304,162 368,175 411,150 454,228 496,240 518,150 561,168 625,180 668,192 710,240 753,252 796,204 838,216 860,216"
                      />

                      <circle
                        cx="454"
                        cy="228"
                        r="5.5"
                        fill="#F3F6EF"
                        stroke="#A8611A"
                        strokeWidth="2.5"
                      />
                      <text
                        x="454"
                        y="256"
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize="11"
                        fill="#A8611A"
                        textAnchor="middle"
                      >
                        first try at lowering it
                      </text>
                      <circle
                        cx="753"
                        cy="252"
                        r="5.5"
                        fill="#F3F6EF"
                        stroke="#A8611A"
                        strokeWidth="2.5"
                      />
                      <text
                        x="753"
                        y="278"
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize="11"
                        fill="#A8611A"
                        textAnchor="middle"
                      >
                        second try
                      </text>

                      <text
                        x="490"
                        y="140"
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize="11"
                        fill="#4A5A63"
                      >
                        both went back up within 4 months
                      </text>
                    </svg>
                  </div>
                  <p className="fig-cap">
                    <b>What this reveals:</b> the dose was lowered twice and went straight back up
                    both times. That is a specific question — was a second medicine ever tried
                    alongside, or was the dose simply raised again? Two very different answers, and
                    the picture is what makes anybody ask.
                  </p>
                </div>
              </Fold>

              <Fold
                id="ex-tests"
                num="Fig. 3"
                title="Tests done — and the ones never done"
                sub="The blank rows are the appointment list"
                nested
              >
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Test</th>
                        <th className="mono">Last done</th>
                        <th>Result</th>
                        <th>Why it matters</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Muscle biopsy</td>
                        <td className="mono">1990</td>
                        <td>Inflammation seen</td>
                        <td className="flag">36 years old. The whole diagnosis rests on it.</td>
                      </tr>
                      <tr>
                        <td>Bone scan</td>
                        <td className="mono">—</td>
                        <td className="flag">Never done</td>
                        <td className="flag">Standard after years of prednisone</td>
                      </tr>
                      <tr>
                        <td>Hearing test</td>
                        <td className="mono">—</td>
                        <td className="flag">Never done</td>
                        <td className="flag">Five years of ringing, never measured</td>
                      </tr>
                      <tr>
                        <td>Neck artery scan</td>
                        <td className="mono">—</td>
                        <td className="flag">Never done</td>
                        <td className="flag">Matters if the ringing pulses</td>
                      </tr>
                      <tr>
                        <td>Vitamin B12</td>
                        <td className="mono">2017</td>
                        <td>Low-normal</td>
                        <td>Affects balance. Not rechecked in 9 years.</td>
                      </tr>
                      <tr>
                        <td>Blood sugar (HbA1c)</td>
                        <td className="mono">2023</td>
                        <td>Borderline</td>
                        <td>Prednisone pushes this up. Worth watching.</td>
                      </tr>
                      <tr>
                        <td>Cholesterol</td>
                        <td className="mono">2025</td>
                        <td className="ok">Improved on treatment</td>
                        <td className="ok">Working. Keep going.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  Four blanks. Each blank is a cheap, quick, painless test that could explain
                  something she has lived with for years. <b>The empty rows are the point.</b> When
                  your page is built, the empty rows become your appointment list.
                </p>
              </Fold>
              <div style={{ marginTop: '20px' }}>
                <BackToMap />
              </div>
            </Fold>

            {/* ============ 06 GLOSSARY ============ */}
            <Fold
              id="s06"
              num="06"
              title="The words"
              sub={`${Object.keys(TERMS).length} medical words · plain language · with Spanish`}
            >
              <p className="lede">
                Nothing here is worth knowing if it is not understandable. If a doctor uses a word
                that is not on this list, write it down and we will add it.
              </p>
              <div className="tbl-wrap">
                <table className="gloss">
                  <thead>
                    <tr>
                      <th>Word</th>
                      <th>What it actually means</th>
                      <th>En español</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(TERMS).map(([key, t]) => (
                      <tr key={key}>
                        <td>{t.title}</td>
                        <td>{t.def}</td>
                        <td>{t.es}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <BackToMap />
            </Fold>
          </div>

          {/* ============ CLOSING ============ */}
          <div className="closing">
            <p>
              None of this replaces your doctors. It makes the twelve minutes you get with them
              count — so you walk in with a page instead of a story, and they spend the time
              deciding instead of reconstructing.
            </p>
            <p>
              The goal is not to live longer. The goal is more good years — walking, travelling,
              hearing quiet, sleeping through the night, and not being irritable at people you love
              because of a sound nobody has ever measured.
            </p>
            <p style={{ fontFamily: '"Petrona", Georgia, serif', fontSize: '24px', fontWeight: 600 }}>
              Let’s have this page full by October 24.
            </p>
            <p className="signoff">
              A preparation sheet, not medical advice · Sections 01–04 are real · Section 05 is an
              invented example · Last updated 24 August 2026
            </p>
          </div>
        </div>
      </div>
    </FoldCtx.Provider>
  )
}
