import { NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

function getDb() {
  // Try to init firebase admin
  if (getApps().length === 0) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || ''
      const parsed = JSON.parse(raw)
      initializeApp({ credential: cert(parsed) })
    } catch {
      // Fall back to application default or project ID only
      initializeApp({ projectId })
    }
  }
  return getFirestore()
}

const UID = process.env.FIREBASE_UID || ''

export async function POST(request: Request) {
  try {
    const db = getDb()
    const { signals, hypotheses, experiments } = await request.json()
    const results: Record<string, string[]> = { signalIds: [], hypothesisIds: [], experimentIds: [] }

    for (const signal of (signals || [])) {
      const ref = db.collection('users').doc(UID).collection('signals').doc()
      await ref.set({ ...signal, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
      results.signalIds.push(ref.id)
    }

    for (const hyp of (hypotheses || [])) {
      const ref = db.collection('users').doc(UID).collection('hypotheses').doc()
      if (typeof hyp.signalIndex === 'number' && results.signalIds[hyp.signalIndex]) {
        hyp.sourceId = results.signalIds[hyp.signalIndex]
        delete hyp.signalIndex
      }
      await ref.set({ ...hyp, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
      results.hypothesisIds.push(ref.id)
    }

    for (const exp of (experiments || [])) {
      const ref = db.collection('users').doc(UID).collection('alpha_experiments').doc()
      if (exp.signalIndices) {
        exp.linkedSignalIds = exp.signalIndices.map((i: number) => results.signalIds[i]).filter(Boolean)
        delete exp.signalIndices
      }
      if (exp.hypothesisIndices) {
        exp.linkedHypothesisIds = exp.hypothesisIndices.map((i: number) => results.hypothesisIds[i]).filter(Boolean)
        delete exp.hypothesisIndices
      }
      await ref.set({ ...exp, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
      results.experimentIds.push(ref.id)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
