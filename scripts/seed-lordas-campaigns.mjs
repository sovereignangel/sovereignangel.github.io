/**
 * Seed the September and October 2026 campaigns on the Lordas goals board.
 *
 * Idempotent by title: a milestone whose title already exists for that owner
 * in that campaign is updated in place rather than duplicated, so the script
 * can be re-run after editing the list below. Nothing is ever deleted —
 * anything added through the dashboard survives a re-run.
 *
 *   node scripts/seed-lordas-campaigns.mjs           # write
 *   node scripts/seed-lordas-campaigns.mjs --dry     # print what would change
 */

import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const DRY = process.argv.includes('--dry')

// --- env ------------------------------------------------------------------
const envContent = readFileSync('.env.local', 'utf-8')
const env = {}
let currentKey = null
let currentVal = ''
let inMultiline = false
for (const line of envContent.split('\n')) {
  if (inMultiline) {
    currentVal += '\n' + line
    if (/\}""?$/.test(line.trim())) {
      env[currentKey] = currentVal.replace(/"*$/, '')
      inMultiline = false
    }
  } else {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match) {
      const [, key, val] = match
      if (val.startsWith('"') && !val.endsWith('"')) {
        currentKey = key
        currentVal = val.slice(1)
        inMultiline = true
      } else {
        env[key] = val.replace(/^"|"$/g, '')
      }
    }
  }
}

// The key is stored single-quoted in .env.local; the parser above only
// strips double quotes.
const rawKey = (env.FIREBASE_SERVICE_ACCOUNT_KEY || '').replace(/^'|'$/g, '')
const serviceAccount = JSON.parse(rawKey)
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()
const uid = env.TRANSCRIPT_WEBHOOK_UID || env.FIREBASE_UID
if (!uid) throw new Error('No UID in .env.local')

// --- the goals ------------------------------------------------------------
// Status vocabulary: on-track | at-risk | done | dropped.
// `current` and `target` are free text — they print as "current / target".

const SEED = [
  {
    id: 'september-2026',
    name: 'September',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    charters: {
      lori: {
        statement: 'Race both 70.3s, then turn the month over to getting Armstrong ready to raise on October 1.',
        doneLooksLike: 'Belgrade and NYC finished, and narrative, tech and sales plan all in a state you would send.',
      },
    },
    milestones: [
      {
        person: 'lori',
        title: '20 hours on the water at Svencelė',
        metric: 'hours',
        current: '4',
        target: '20',
        category: 'beauty-fitness',
        status: 'at-risk',
      },
      {
        person: 'lori',
        title: 'Race Ironman 70.3 Belgrade',
        metric: 'race',
        current: 'raced 09-13',
        target: 'finish',
        category: 'beauty-fitness',
        status: 'done',
      },
      {
        person: 'lori',
        title: 'Race Ironman 70.3 New York',
        metric: 'race',
        // The plan has NYC on 26 September, three days after this was seeded.
        // Left on-track rather than done: the board is the record, and a
        // record that marks a race finished before it is raced is not one.
        current: 'race day 09-26',
        target: 'finish',
        category: 'beauty-fitness',
        status: 'on-track',
      },
      {
        person: 'lori',
        title: 'Read Brief Answers to the Big Questions and Clear Clarity',
        metric: 'books',
        current: '',
        target: '2',
        category: 'mind',
        status: 'on-track',
      },
      {
        person: 'lori',
        title: 'Give Sean his feedback',
        metric: 'delivered',
        current: '',
        target: 'sent',
        category: 'network',
        status: 'on-track',
      },
      {
        person: 'lori',
        title: 'Armstrong ready to start fundraising on October 1',
        metric: 'narrative · tech · sales plan',
        current: '',
        target: 'all three',
        category: 'work',
        status: 'on-track',
      },
      {
        person: 'lori',
        title: 'Three complexity-economics topics to review with Michael',
        metric: 'topics',
        current: '',
        target: '3',
        category: 'mind',
        status: 'on-track',
      },
    ],
  },
  {
    id: 'october-2026',
    name: 'October',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    charters: {
      lori: {
        statement: 'Turn the fundraise into a weekly cadence, and rebuild the body and the rooms around it now the racing is done.',
        doneLooksLike: '10 fundraising conversations a week held, and the Sunday block kept every week of the month.',
      },
    },
    milestones: [
      {
        person: 'lori',
        title: 'Invest in the relationships worth having — OxBridge, WPI',
        metric: 'rooms entered',
        current: '',
        target: 'both',
        category: 'network',
        status: 'on-track',
      },
      {
        person: 'lori',
        title: 'Join and start riding with BKTC and All Ways Cycling',
        metric: 'joined · riding',
        current: '',
        target: 'both, riding weekly',
        category: 'beauty-fitness',
        status: 'on-track',
      },
      {
        person: 'lori',
        title: 'Armstrong fundraising cadence — advisors, peers, investors',
        metric: 'meetings/week',
        current: '',
        target: '10',
        category: 'work',
        status: 'on-track',
      },
      {
        person: 'lori',
        title: 'Sundays: flexibility, yoga and mobility',
        metric: 'Sundays kept',
        current: '',
        target: 'every week',
        category: 'beauty-fitness',
        status: 'on-track',
      },
      {
        person: 'lori',
        title: 'Strength 3x a week — glutes and tri-specific',
        metric: 'sessions/week',
        current: '',
        target: '3',
        category: 'beauty-fitness',
        status: 'on-track',
      },
      {
        person: 'lori',
        title: 'Mahamudra in person',
        metric: 'sits attended',
        current: '',
        target: 'weekly',
        category: 'mind',
        status: 'on-track',
      },
    ],
  },
]

// --- write ----------------------------------------------------------------
const now = Date.now()
const userRef = db.collection('users').doc(uid)

for (const seed of SEED) {
  const ref = userRef.collection('lordas_goals').doc(`campaign_${seed.id}`)
  const snap = await ref.get()
  const existing = snap.exists ? snap.data() : null

  const milestones = existing?.milestones ? [...existing.milestones] : []
  const charters = { ...(existing?.charters || {}) }
  let added = 0
  let updated = 0

  for (const [owner, charter] of Object.entries(seed.charters || {})) {
    if (charters[owner]) continue // never overwrite a charter someone wrote
    charters[owner] = { owner, ...charter, updatedAt: now, updatedBy: 'lori' }
  }

  for (const m of seed.milestones) {
    const idx = milestones.findIndex(
      (x) => x.person === m.person && x.title.toLowerCase() === m.title.toLowerCase()
    )
    if (idx === -1) {
      milestones.push({
        id: db.collection('dummy').doc().id,
        metric: '',
        current: '',
        target: '',
        ...m,
        sortOrder: milestones.filter((x) => x.person === m.person).length,
        createdAt: now,
        updatedAt: now,
      })
      added++
    } else {
      milestones[idx] = { ...milestones[idx], ...m, updatedAt: now }
      updated++
    }
  }

  const doc = {
    id: seed.id,
    name: seed.name,
    startDate: seed.startDate,
    endDate: seed.endDate,
    charters,
    milestones,
    ...(existing?.retro ? { retro: existing.retro } : {}),
    updatedAt: now,
  }

  console.log(`${seed.name}: ${added} added, ${updated} updated, ${milestones.length} total`)
  if (!DRY) await ref.set(doc)
}

console.log(DRY ? '\nDry run — nothing written.' : '\nWritten.')
process.exit(0)
