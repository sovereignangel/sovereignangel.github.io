#!/usr/bin/env node
/**
 * iMessage → Thesis Engine warmth sync
 *
 * Reads ~/Library/Messages/chat.db, finds contacts you texted this week,
 * marks them as 'hot' in Firestore, and decays the rest.
 *
 * Run manually:   node scripts/imessage-sync.js
 * Auto-install:   see scripts/imessage-sync.plist (launchd, every 6h)
 *
 * Requirements:
 *   npm install better-sqlite3 firebase-admin
 *   Set FIREBASE_SERVICE_ACCOUNT_PATH and FIREBASE_UID in .env.local or env
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// ── Guard: only run once per week ────────────────────────────────────────────
const LAST_RUN_FILE = path.join(os.tmpdir(), 'thesis-imessage-last-run')
const INTERVAL_DAYS = 7

function daysSince(isoDate) {
  return (Date.now() - new Date(isoDate).getTime()) / 1000 / 86400
}

if (fs.existsSync(LAST_RUN_FILE)) {
  const lastRun = fs.readFileSync(LAST_RUN_FILE, 'utf8').trim()
  if (daysSince(lastRun) < INTERVAL_DAYS) {
    console.log(`[imessage-sync] Last run was ${daysSince(lastRun).toFixed(1)}d ago — skipping`)
    process.exit(0)
  }
}

// ── Load env ──────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .forEach(l => {
      const [k, ...v] = l.split('=')
      process.env[k.trim()] = v.join('=').trim()
    })
}

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
const UID = process.env.FIREBASE_UID

if (!SERVICE_ACCOUNT_PATH || !UID) {
  console.error('[imessage-sync] Missing FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_UID in .env.local')
  process.exit(1)
}

// ── Require deps (must be installed in project root) ─────────────────────────
let Database, admin
try {
  Database = require('better-sqlite3')
  admin = require('firebase-admin')
} catch (e) {
  console.error('[imessage-sync] Missing dependencies. Run: npm install better-sqlite3 firebase-admin')
  process.exit(1)
}

// ── Init Firebase Admin ───────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(path.resolve(SERVICE_ACCOUNT_PATH))),
  })
}
const db = admin.firestore()

// ── Read iMessage chat.db ─────────────────────────────────────────────────────
const CHAT_DB = path.join(os.homedir(), 'Library', 'Messages', 'chat.db')
if (!fs.existsSync(CHAT_DB)) {
  console.error('[imessage-sync] chat.db not found at', CHAT_DB)
  process.exit(1)
}

const chatDb = new Database(CHAT_DB, { readonly: true })

// Messages in the last 7 days (macOS stores dates as seconds since 2001-01-01)
const APPLE_EPOCH_OFFSET = 978307200 // seconds between Unix epoch and Apple epoch
const sevenDaysAgoApple = (Math.floor(Date.now() / 1000) - APPLE_EPOCH_OFFSET - 7 * 86400) * 1e9

const rows = chatDb.prepare(`
  SELECT DISTINCT h.id AS phone
  FROM message m
  JOIN handle h ON m.handle_id = h.rowid
  WHERE m.date > ?
    AND h.id LIKE '+%'
`).all(sevenDaysAgoApple)

chatDb.close()

const contactedPhones = new Set(
  rows.map(r => r.phone.replace(/\D/g, '').slice(-10)) // normalize to last 10 digits
)

console.log(`[imessage-sync] Found ${contactedPhones.size} phone numbers contacted this week`)

// ── Fetch contacts from Firestore ─────────────────────────────────────────────
async function run() {
  const snap = await db.collection('users').doc(UID).collection('unified_contacts').get()
  const today = new Date().toISOString().split('T')[0]

  const batch = db.batch()
  let hotCount = 0
  let decayCount = 0

  const DECAY = { hot: 'warm', warm: 'cool', cool: 'cold' }

  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    const phone = (data.phone || '').replace(/\D/g, '').slice(-10)
    const ref = docSnap.ref

    if (phone && contactedPhones.has(phone)) {
      // Contacted this week → set hot
      batch.update(ref, { warmth: 'hot', warmthUpdatedAt: today, updatedAt: admin.firestore.FieldValue.serverTimestamp() })
      hotCount++
    } else {
      // Not contacted → decay if overdue
      const warmth = data.warmth || 'cold'
      const lastUpdated = data.warmthUpdatedAt || data.lastTouchDate || '2000-01-01'
      if (warmth !== 'cold' && daysSince(lastUpdated) >= INTERVAL_DAYS) {
        batch.update(ref, {
          warmth: DECAY[warmth] || 'cold',
          warmthUpdatedAt: today,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        decayCount++
      }
    }
  }

  await batch.commit()
  console.log(`[imessage-sync] Done — ${hotCount} set to hot, ${decayCount} decayed`)

  // Mark last run
  fs.writeFileSync(LAST_RUN_FILE, new Date().toISOString())
}

run().catch(err => {
  console.error('[imessage-sync] Error:', err)
  process.exit(1)
})
