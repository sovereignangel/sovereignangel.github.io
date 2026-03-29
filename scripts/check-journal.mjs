/**
 * Check if a daily log exists in Firestore for a given date.
 * Usage: node scripts/check-journal.mjs [date]
 */

import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Parse .env.local handling multi-line values (quoted with "")
const envContent = readFileSync('.env.local', 'utf-8')
const env = {}
let currentKey = null
let currentVal = ''
let inMultiline = false

for (const line of envContent.split('\n')) {
  if (inMultiline) {
    currentVal += '\n' + line
    // End of multi-line: line ends with }" or }"" (Vercel CLI format)
    if (/\}""?$/.test(line.trim())) {
      // Strip all trailing quotes after the closing brace
      env[currentKey] = currentVal.replace(/"*$/, '')
      inMultiline = false
    }
  } else {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match) {
      const [, key, val] = match
      // Multi-line JSON: starts with "{ but doesn't close on this line
      if (val.startsWith('"') && !val.endsWith('"')) {
        currentKey = key
        currentVal = val.slice(1) // strip opening quote
        inMultiline = true
      } else {
        env[key] = val.replace(/^"|"$/g, '')
      }
    }
  }
}

const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY)
const app = initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore(app)

const uid = env.FIREBASE_UID
const date = process.argv[2] || '2026-03-28'

console.log(`Checking daily_logs/${date} for uid ${uid}...\n`)

const logRef = db.collection('users').doc(uid).collection('daily_logs').doc(date)
const snap = await logRef.get()

if (!snap.exists) {
  console.log('No daily log found for this date.')
} else {
  const data = snap.data()
  console.log('Journal entry:', data.journalEntry ? `"${data.journalEntry.slice(0, 200)}..."` : '(empty/missing)')
  console.log('Reward score:', data.rewardScore?.score ?? 'none')
  console.log('Sleep hours:', data.sleepHours ?? 'none')
  console.log('Focus hours:', data.focusHoursActual ?? 'none')
  console.log('Fields present:', Object.keys(data).filter(k => data[k] !== undefined && data[k] !== null && data[k] !== '').join(', '))
}

// Also check garmin_metrics
const garminRef = db.collection('users').doc(uid).collection('garmin_metrics').doc(date)
const garminSnap = await garminRef.get()
console.log('\nGarmin metrics:', garminSnap.exists ? 'EXISTS' : 'MISSING')
if (garminSnap.exists) {
  const g = garminSnap.data()
  console.log('  Steps:', g.steps, '| Stress:', g.stressLevel, '| Sleep score:', g.sleepScore)
}

// Check recent daily logs
console.log('\n--- Recent daily logs ---')
const logsRef = db.collection('users').doc(uid).collection('daily_logs')
const recent = await logsRef.orderBy('date', 'desc').limit(10).get()
for (const doc of recent.docs) {
  const d = doc.data()
  const hasJournal = d.journalEntry ? `journal: "${d.journalEntry.slice(0, 60)}..."` : 'no journal'
  const score = d.rewardScore?.score ?? '-'
  console.log(`  ${doc.id}: score=${score} | ${hasJournal}`)
}

// Check journals collection
console.log('\n--- Journals collection (if any) ---')
const journalsRef = db.collection('users').doc(uid).collection('journals')
const journals = await journalsRef.orderBy('date', 'desc').limit(5).get()
if (journals.empty) {
  console.log('  (empty)')
} else {
  for (const doc of journals.docs) {
    console.log(`  ${doc.id}:`, JSON.stringify(doc.data()).slice(0, 120))
  }
}

// Check Telegram-sent journals
console.log('\n--- Checking transcript_drafts ---')
const drafts = await db.collection('users').doc(uid).collection('transcript_drafts').orderBy('createdAt', 'desc').limit(5).get()
if (drafts.empty) {
  console.log('  (empty)')
} else {
  for (const doc of drafts.docs) {
    console.log(`  ${doc.id}:`, JSON.stringify(doc.data()).slice(0, 120))
  }
}

// Search across multiple collections for "Aidas" or March 28 content
const collectionsToSearch = [
  'weekly_synthesis', 'thesis_briefings', 'insights', 'beliefs',
  'decisions', 'hypotheses', 'conversations', 'daily_reports',
]

for (const col of collectionsToSearch) {
  console.log(`\n--- ${col} ---`)
  try {
    const ref = db.collection('users').doc(uid).collection(col)
    const snap = await ref.limit(10).get()
    if (snap.empty) {
      console.log('  (empty)')
      continue
    }
    for (const doc of snap.docs) {
      const text = JSON.stringify(doc.data())
      const hasAidas = text.toLowerCase().includes('aidas')
      const hasMarch28 = text.includes('2026-03-28') || text.includes('03-28')
      if (hasAidas || hasMarch28) {
        console.log(`  ${doc.id}: *** MATCH *** aidas=${hasAidas} march28=${hasMarch28}`)
        // Find and print the Aidas context
        const lower = text.toLowerCase()
        const idx = lower.indexOf('aidas')
        if (idx >= 0) console.log(`    ...${text.slice(Math.max(0, idx - 50), idx + 150)}...`)
      } else {
        console.log(`  ${doc.id}: (no match) ${text.slice(0, 80)}`)
      }
    }
  } catch (e) {
    console.log(`  Error: ${e.message?.slice(0, 80)}`)
  }
}

// Also check the March 26 daily log — user said they wrote it today but maybe wrong date?
console.log('\n--- March 26 daily log journal ---')
const mar26 = await db.collection('users').doc(uid).collection('daily_logs').doc('2026-03-26').get()
if (mar26.exists) {
  const d = mar26.data()
  console.log('  Full journal:', d.journalEntry?.slice(0, 500) || '(none)')
  console.log('  Updated at:', d.updatedAt || d.rewardScore?.computedAt || 'unknown')
}

// --- Move journal from March 26 to March 28 ---
console.log('\n--- Moving journal entry from 2026-03-26 to 2026-03-28 ---')
const mar26Data = mar26.data()
const journalEntry = mar26Data.journalEntry

if (journalEntry) {
  // Create/update March 28 log with the journal entry + any extracted fields
  const mar28Ref = db.collection('users').doc(uid).collection('daily_logs').doc('2026-03-28')
  const mar28Snap = await mar28Ref.get()

  const fieldsToMove = {}
  fieldsToMove.journalEntry = journalEntry
  fieldsToMove.date = '2026-03-28'
  // Also move journal-extracted fields if they exist on Mar 26
  for (const key of ['nervousSystemState', 'journalMood', 'journalThemes', 'journalParsedAt']) {
    if (mar26Data[key] !== undefined) fieldsToMove[key] = mar26Data[key]
  }

  if (mar28Snap.exists) {
    await mar28Ref.update(fieldsToMove)
  } else {
    await mar28Ref.set(fieldsToMove)
  }
  console.log('  Written to 2026-03-28')

  // Clear journal from March 26
  await db.collection('users').doc(uid).collection('daily_logs').doc('2026-03-26').update({
    journalEntry: null,
    journalMood: null,
    journalThemes: null,
    journalParsedAt: null,
  })
  console.log('  Cleared from 2026-03-26')
  console.log('  Done!')
} else {
  console.log('  No journal entry found on March 26')
}

process.exit(0)
