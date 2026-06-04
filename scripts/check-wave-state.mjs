import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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

const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY)
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()
const uid = env.TRANSCRIPT_WEBHOOK_UID || env.FIREBASE_UID

console.log(`UID: ${uid}`)

const fmt = (d) => d?.toDate ? d.toDate().toISOString() : d
const dur = (sec) => sec == null ? '?' : `${Math.round(sec/60)}m`

console.log('\n=== wave_pending_decisions (latest 5) ===')
const pend = await db.collection('wave_pending_decisions').orderBy('createdAt','desc').limit(15).get()
pend.forEach(d => {
  const x = d.data()
  console.log(`  ${d.id}  ${fmt(x.createdAt)}  "${x.sessionTitle}"  ${dur(x.durationSeconds)}  status=${x.status}  msg=${x.prompt_message_id ?? 'none'}`)
})
if (pend.empty) console.log('  (none)')

console.log('\n=== wave_session_decisions (raw scan 15) ===')
const dec = await db.collection('wave_session_decisions').limit(15).get()
dec.forEach(d => {
  const x = d.data()
  console.log(`  ${d.id}  decided_at=${fmt(x.decided_at) ?? fmt(x.decidedAt)}  decision=${x.decision}`)
})
if (dec.empty) console.log('  (none)')

console.log('\n=== relationship_conversations (latest 5) ===')
const rc = await db.collection('users').doc(uid).collection('relationship_conversations')
  .orderBy('createdAt','desc').limit(5).get().catch(e=>({empty:true, _e:e.message}))
if (!rc.empty) rc.forEach(d => {
  const x = d.data()
  console.log(`  ${d.id}  ${fmt(x.createdAt)}  waveSessionId=${x.waveSessionId}  scores=${JSON.stringify(x.scores)}`)
})
if (rc.empty) console.log(`  (none) ${rc._e ?? ''}`)

console.log('\n=== relationship_conversations[0] extraction details ===')
if (!rc.empty) {
  const x = rc.docs[0].data()
  console.log(`  date=${x.date}`)
  console.log(`  durationMinutes=${x.durationMinutes}`)
  console.log(`  domain=${x.extraction?.domain}`)
  console.log(`  triggerTopic=${x.extraction?.triggerTopic}`)
  console.log(`  overallTone=${x.extraction?.overallTone}`)
  console.log(`  keyTakeaways=${JSON.stringify(x.extraction?.keyTakeaways?.slice(0,3))}`)
  console.log(`  valuesExpressed.length=${x.extraction?.valuesExpressed?.length ?? 0}`)
  console.log(`  transcript.length=${x.transcriptText?.length ?? 0}`)
}

console.log('\n=== relationship_themes ===')
const themes = await db.collection('users').doc(uid).collection('relationship_themes').limit(15).get()
themes.forEach(d => {
  const x = d.data()
  console.log(`  ${d.id}  label=${x.label}  conversationIds.length=${x.conversationIds?.length}  updatedAt=${fmt(x.updatedAt)}`)
})

console.log('\n=== relationship_snapshots (latest 5) ===')
const snaps = await db.collection('users').doc(uid).collection('relationship_snapshots').orderBy('date','desc').limit(5).get()
snaps.forEach(d => {
  const x = d.data()
  console.log(`  ${d.id}  composite=${x.composite}  count=${x.conversationCount}  rolling=${JSON.stringify(x.rollingAverage)}`)
})

console.log('\n=== relationship_values (latest 5) ===')
const vals = await db.collection('users').doc(uid).collection('relationship_values').limit(15).get()
vals.forEach(d => {
  const x = d.data()
  console.log(`  ${d.id}  "${x.value}" by=${x.expressedBy} mentions=${x.mentions}`)
})

console.log('\n=== pending_deepops_meetings (stash check) ===')
const stash = await db.collection('users').doc(uid).collection('pending_deepops_meetings').limit(5).get()
stash.forEach(d => {
  const x = d.data()
  console.log(`  ${d.id}  surface=${x.surface}  drained=${x.drained_at}  err=${(x.last_error || '').slice(0,100)}`)
})
if (stash.empty) console.log('  (none stashed — management tap routed cleanly)')

console.log('\n=== transcript_drafts (recent, scan latest 30) ===')
const drafts = await db.collection('users').doc(uid).collection('transcript_drafts')
  .orderBy('receivedAt','desc').limit(30).get().catch(e=>({empty:true, _e:e.message}))
let dshown = 0
if (!drafts.empty) drafts.forEach(d => {
  const x = d.data()
  if (dshown < 10) {
    console.log(`  ${d.id}  ${fmt(x.receivedAt)}  source=${x.source ?? '?'}  status=${x.status ?? '?'}  template=${x.templateType ?? '?'}  title="${x.title ?? x.metadata?.wave_session_title ?? '?'}"`)
    dshown++
  }
})
if (dshown === 0) console.log(`  (none) ${drafts._e ?? ''}`)

console.log('\n=== conversations with waveSessionId (latest 5) ===')
const convs = await db.collection('users').doc(uid).collection('conversations')
  .orderBy('createdAt','desc').limit(20).get().catch(e=>({empty:true, _e:e.message}))
let shown = 0
if (!convs.empty) {
  convs.forEach(d => {
    const x = d.data()
    if (x.metadata?.waveSessionId && shown < 5) {
      console.log(`  ${d.id}  waveId=${x.metadata?.waveSessionId}  created=${fmt(x.createdAt)}  title="${x.title}"`)
      shown++
    }
  })
}
if (shown === 0) console.log('  (none in last 20 conversations)')

console.log('\n=== user telegram settings ===')
const u = await db.collection('users').doc(uid).get()
console.log('  telegramChatId:', u.data()?.settings?.telegramChatId ?? 'MISSING')

process.exit(0)
