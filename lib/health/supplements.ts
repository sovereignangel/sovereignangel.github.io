/**
 * The stack.
 *
 * Organised the way the bookshelf is: by the job each item is taken to do,
 * not by what it is. Two supplements against the same job are redundant
 * however different the labels read, and a job with nothing against it is the
 * actual gap.
 *
 * Three fields carry the weight and are the reason this file exists rather
 * than a notes app:
 *
 *   evidence   — how much human trial data stands behind the claim, stated
 *                plainly. 'thin' is not an insult; it marks where the money
 *                is being spent on a bet rather than a finding.
 *   observable — whether an effect would show up in data already collected.
 *                A supplement whose effect cannot be seen in Garmin or in a
 *                blood panel is taken on faith, and should be labelled that
 *                way rather than quietly assumed to work.
 *   conflicts  — what it competes with for absorption, or what it blunts.
 *                Absorption conflicts are the most common reason a stack
 *                this size underdelivers: the pills are taken, the minerals
 *                never arrive.
 *
 * Nothing here is a prescription. Doses are deliberately absent — they belong
 * to the bottle and to whoever signed off on them.
 */

export type EvidenceTier = 'strong' | 'moderate' | 'thin'

/** When it should be taken, which is where most of the avoidable loss sits. */
export type TimingBlock = 'am-fasted' | 'am-food' | 'pm-food' | 'pre-sleep' | 'any-food'

export const TIMING_LABEL: Record<TimingBlock, string> = {
  'am-fasted': 'Morning, empty',
  'am-food': 'Morning, with fat',
  'pm-food': 'Evening, with fat',
  'pre-sleep': 'Pre-sleep',
  'any-food': 'Any meal',
}

export const TIMING_ORDER: TimingBlock[] = ['am-fasted', 'am-food', 'any-food', 'pm-food', 'pre-sleep']

/** What would have to move for the item to be working. */
export type ObservableIn = 'garmin' | 'blood' | 'neither'

export const EVIDENCE_LABEL: Record<EvidenceTier, string> = {
  strong: 'Strong',
  moderate: 'Moderate',
  thin: 'Thin',
}

export interface Supplement {
  id: string
  name: string
  /** The job, stated as work rather than as a nutrient category. */
  jobToBeDone: string
  timing: TimingBlock
  evidence: EvidenceTier
  observable: ObservableIn
  /** The specific number that should move, and roughly over what horizon. */
  marker: string
  /** Why it is in the stack, in one line. */
  note: string
  /** Ids of other items in the stack it competes with or duplicates. */
  conflicts?: string[]
  /** Blood markers that should be measured before or alongside it. */
  requiresPanel?: string[]
  /** Set where an item should not continue without a measurement or sign-off. */
  gate?: string
}

export const STACK: Supplement[] = [
  // ── Oxygen carriage ─────────────────────────────────────────────────────
  {
    id: 'iron',
    name: 'Iron',
    jobToBeDone: 'Restore oxygen carriage',
    timing: 'am-fasted',
    evidence: 'strong',
    observable: 'blood',
    marker: 'Ferritin and transferrin saturation over 8–12 weeks; resting HR and VO2max follow if genuinely deficient',
    note:
      'The one item in the stack that is both the most likely to be doing real work and the most capable of doing harm. Endurance training raises hepcidin for hours after a hard session, which shuts absorption down — so the dose lands or does not land almost entirely on timing. Take it away from training, away from calcium, away from coffee, with vitamin C.',
    conflicts: ['calcium', 'ala', 'multivitamin'],
    requiresPanel: ['Ferritin', 'Transferrin saturation', 'Haemoglobin', 'hs-CRP'],
    gate:
      'There is no excretion pathway for excess iron. Supplementing without a measured ferritin, and without hs-CRP alongside it (inflammation inflates ferritin and can hide a deficiency or fake a sufficiency), is the single riskiest line in this stack. Measure, then dose, then re-measure.',
  },

  // ── Foundation ──────────────────────────────────────────────────────────
  {
    id: 'multivitamin',
    name: 'Multivitamin — Thorne Elite AM/PM',
    jobToBeDone: 'Cover the floor',
    timing: 'am-food',
    evidence: 'moderate',
    observable: 'blood',
    marker: 'Nothing on its own — it is insurance against a deficiency, not a performance input',
    note:
      'The anchor of the stack, and the reason four other items below may be redundant. An athlete-formulated multi of this class already carries a full B complex, biotin, vitamin D and the carotenoid pair. Read the label against the four items it duplicates before buying any of them again.',
    conflicts: ['biotin', 'b-complex', 'd3', 'lutein'],
  },
  {
    id: 'd3',
    name: 'Vitamin D3',
    jobToBeDone: 'Hold bone and immune floor',
    timing: 'am-food',
    evidence: 'strong',
    observable: 'blood',
    marker: '25-OH vitamin D, 3 months to plateau. Target the middle of the range, not the top',
    note:
      'Genuinely evidenced, genuinely needed at Baltic latitude between October and March. The question is not whether to take it but whether the multivitamin is already supplying it — stacking two sources without a 25-OH reading is how people end up over-range.',
    conflicts: ['multivitamin'],
    requiresPanel: ['25-OH vitamin D'],
  },
  {
    id: 'b-complex',
    name: 'Vitamin B complex',
    jobToBeDone: 'Cover the floor',
    timing: 'am-food',
    evidence: 'moderate',
    observable: 'blood',
    marker: 'B12 and folate if ever low; otherwise nothing observable',
    note:
      'Water-soluble, so excess is largely excreted — the cost is money rather than risk. Almost certainly duplicated by the multivitamin.',
    conflicts: ['multivitamin', 'biotin'],
  },
  {
    id: 'biotin',
    name: 'Biotin complex',
    jobToBeDone: 'Hair, skin and nails',
    timing: 'am-food',
    evidence: 'thin',
    observable: 'neither',
    marker: 'Subjective only. Biotin deficiency is rare in anyone eating normally',
    note:
      'Worth naming a real hazard rather than an efficacy one: high-dose biotin interferes with immunoassays, and can skew troponin and thyroid results badly enough to cause a misdiagnosis. Stop it 72 hours before any blood draw.',
    conflicts: ['multivitamin', 'b-complex'],
    gate: 'Pause for 72 hours before any blood panel — it distorts troponin and thyroid assays.',
  },
  {
    id: 'calcium',
    name: 'Calcium',
    jobToBeDone: 'Protect bone under load',
    timing: 'pm-food',
    evidence: 'moderate',
    observable: 'blood',
    marker: 'Not serum calcium, which is tightly regulated and tells you nothing. Bone density over years',
    note:
      'Moved to evening on purpose. Calcium is the strongest single inhibitor of non-haem iron absorption in this stack; taken in the same hours as the iron, it quietly cancels it.',
    conflicts: ['iron'],
  },

  // ── Endurance and recovery ──────────────────────────────────────────────
  {
    id: 'epa',
    name: 'Super EPA — fish oil',
    jobToBeDone: 'Lower background inflammation',
    timing: 'am-food',
    evidence: 'strong',
    observable: 'blood',
    marker: 'Triglycerides and omega-3 index; hs-CRP over months',
    note:
      'One of the better-evidenced items here. Mildly antiplatelet, which matters only in combination — see the curcumin line.',
    conflicts: ['curcumin'],
  },
  {
    id: 'glycine',
    name: 'Glycine',
    jobToBeDone: 'Fall asleep faster',
    timing: 'pre-sleep',
    evidence: 'moderate',
    observable: 'garmin',
    marker: 'Sleep score and time-to-sleep within days — the fastest feedback loop in the stack',
    note:
      'Drops core temperature ahead of sleep onset. The cleanest natural experiment available: take it for two weeks, stop for two, and read the sleep score. Almost nothing else here gives an answer that quickly.',
  },
  {
    id: 'glutamine',
    name: 'Glutamine',
    jobToBeDone: 'Hold gut and immunity through heavy load',
    timing: 'any-food',
    evidence: 'thin',
    observable: 'neither',
    marker: 'Subjective — illness frequency in heavy blocks, which is too noisy to read at n=1',
    note:
      'The evidence is better in clinical catabolic states than in trained athletes eating enough protein. Keep it for peak weeks if at all; it is a candidate to drop first.',
  },
  {
    id: 'coq10',
    name: 'CoQ10',
    jobToBeDone: 'Support mitochondrial output',
    timing: 'am-food',
    evidence: 'moderate',
    observable: 'neither',
    marker: 'No practical readout at home. Effects in trials are small and mostly in deficient or statin-treated groups',
    note:
      'Fat-soluble and poorly absorbed — taken without fat it is close to wasted. Ubiquinol absorbs better than ubiquinone if the bottle offers a choice.',
  },
  {
    id: 'alcar',
    name: 'Acetyl-L-carnitine',
    jobToBeDone: 'Support fat oxidation',
    timing: 'am-food',
    evidence: 'thin',
    observable: 'neither',
    marker: 'Muscle carnitine only rises with sustained high-dose plus carbohydrate co-ingestion, over months',
    note:
      'The performance claim rests on raising muscle carnitine, which oral dosing does poorly without insulin present. The cognitive claims are a separate and thinner literature.',
  },
  {
    id: 'rhodiola',
    name: 'Rhodiola rosea',
    jobToBeDone: 'Blunt the stress response',
    timing: 'am-fasted',
    evidence: 'thin',
    observable: 'garmin',
    marker: 'Stress level and body battery drain — weak signal, but a signal',
    note:
      'Adaptogen literature is small and poorly controlled. Morning only: it is mildly stimulating and taken late it costs the sleep score that glycine is buying.',
  },

  // ── Longevity bets ──────────────────────────────────────────────────────
  {
    id: 'nr',
    name: 'Nicotinamide riboside',
    jobToBeDone: 'Raise NAD+',
    timing: 'am-fasted',
    evidence: 'thin',
    observable: 'neither',
    marker: 'Blood NAD+ rises reliably. Whether anything downstream of that changes in healthy humans is unresolved',
    note:
      'The mechanism is real and the biomarker moves; the outcome trials in healthy people have not delivered. The most expensive line in the stack per unit of established benefit.',
  },
  {
    id: 'spermidine',
    name: 'Spermidine',
    jobToBeDone: 'Support autophagy',
    timing: 'am-fasted',
    evidence: 'thin',
    observable: 'neither',
    marker: 'None available outside a lab',
    note:
      'Animal data and epidemiology, almost no controlled human outcome data. Wheat germ supplies it in food at comparable cost.',
  },
  {
    id: 'ala',
    name: 'Alpha-lipoic acid',
    jobToBeDone: 'Antioxidant and glucose handling',
    timing: 'am-fasted',
    evidence: 'thin',
    observable: 'blood',
    marker: 'Fasting glucose and HbA1c, modestly, over months',
    note:
      'Chelates minerals, so it competes directly with the iron and the calcium and needs its own window. Also an antioxidant taken in training hours — see the conflict below.',
    conflicts: ['iron', 'calcium', 'curcumin'],
  },

  // ── Targeted ────────────────────────────────────────────────────────────
  {
    id: 'curcumin',
    name: 'Turmeric curcumin',
    jobToBeDone: 'Damp joint and training inflammation',
    timing: 'pm-food',
    evidence: 'moderate',
    observable: 'blood',
    marker: 'hs-CRP over months; subjective joint soreness sooner',
    note:
      'Moved to evening deliberately. High-dose antioxidants taken around training can blunt the mitochondrial adaptation the training is for — the effect is contested, but the cost of taking it twelve hours away from a session is zero.',
    conflicts: ['epa', 'ala'],
  },
  {
    id: 'sterols',
    name: 'Plant sterols',
    jobToBeDone: 'Lower LDL absorption',
    timing: 'pm-food',
    evidence: 'strong',
    observable: 'blood',
    marker: 'LDL-C, roughly 8–10% within 4–6 weeks. One of the few items here with a fast, legible readout',
    note:
      'Works by blocking cholesterol uptake in the gut — and blocks some fat-soluble carotenoid uptake with it, which is a direct conflict with the lutein taken for the eyes.',
    conflicts: ['lutein'],
    requiresPanel: ['Lipid panel'],
  },
  {
    id: 'lutein',
    name: 'Lutein / zeaxanthin',
    jobToBeDone: 'Protect macular pigment',
    timing: 'pm-food',
    evidence: 'moderate',
    observable: 'neither',
    marker: 'Macular pigment optical density, measurable only at an optometrist',
    note:
      'Sound evidence for macular density. Take it in a different meal from the sterols, which reduce carotenoid absorption, and check whether the multivitamin already carries the pair.',
    conflicts: ['sterols', 'multivitamin'],
  },
]

export const BY_ID: Record<string, Supplement> = Object.fromEntries(STACK.map(s => [s.id, s]))

// ─── Derived analysis ──────────────────────────────────────────────────────

export interface Conflict {
  a: Supplement
  b: Supplement
  kind: 'duplicate' | 'absorption'
  detail: string
}

/**
 * Pairwise conflicts, deduplicated.
 *
 * Two kinds, and they call for opposite responses: a duplicate is money being
 * spent twice and should be resolved by dropping one, while an absorption
 * conflict is resolved by moving one to a different hour — the item is still
 * wanted, just not in that window.
 */
export function conflicts(): Conflict[] {
  const seen = new Set<string>()
  const out: Conflict[] = []
  for (const a of STACK) {
    for (const id of a.conflicts ?? []) {
      const b = BY_ID[id]
      if (!b) continue
      const key = [a.id, b.id].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      const duplicate = a.id === 'multivitamin' || b.id === 'multivitamin'
      out.push({
        a,
        b,
        kind: duplicate ? 'duplicate' : 'absorption',
        detail: duplicate
          ? 'Likely supplied by the multivitamin already. Read the label before rebuying.'
          : a.timing === b.timing
            ? `Both sit in ${TIMING_LABEL[a.timing].toLowerCase()} — they compete in the same window.`
            : `Separated to ${TIMING_LABEL[a.timing].toLowerCase()} and ${TIMING_LABEL[b.timing].toLowerCase()}.`,
      })
    }
  }
  // Unresolved first: same-window absorption clashes are the ones costing you.
  return out.sort((x, y) => Number(resolved(y)) - Number(resolved(x))).reverse()
}

export function resolved(c: Conflict): boolean {
  return c.kind === 'absorption' && c.a.timing !== c.b.timing
}

/** Every blood marker the stack implies, deduplicated, with what asks for it. */
export function panel(): { marker: string; askedBy: string[] }[] {
  const map = new Map<string, string[]>()
  for (const s of STACK) {
    for (const m of s.requiresPanel ?? []) {
      map.set(m, [...(map.get(m) ?? []), s.name])
    }
  }
  return [...map.entries()].map(([marker, askedBy]) => ({ marker, askedBy }))
}

export function byTiming(): { block: TimingBlock; items: Supplement[] }[] {
  return TIMING_ORDER.map(block => ({ block, items: STACK.filter(s => s.timing === block) }))
}
