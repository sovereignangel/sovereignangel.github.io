import { NextResponse } from 'next/server'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const UID = process.env.FIREBASE_UID || ''

export async function POST(request: Request) {
  try {
    const { signals, hypotheses, experiments } = await request.json()
    const results: Record<string, string[]> = { signalIds: [], hypothesisIds: [], experimentIds: [] }

    for (const signal of (signals || [])) {
      const ref = doc(collection(db, 'users', UID, 'signals'))
      await setDoc(ref, { ...signal, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      results.signalIds.push(ref.id)
    }

    for (const hyp of (hypotheses || [])) {
      const ref = doc(collection(db, 'users', UID, 'hypotheses'))
      if (typeof hyp.signalIndex === 'number' && results.signalIds[hyp.signalIndex]) {
        hyp.sourceId = results.signalIds[hyp.signalIndex]
        delete hyp.signalIndex
      }
      await setDoc(ref, { ...hyp, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      results.hypothesisIds.push(ref.id)
    }

    for (const exp of (experiments || [])) {
      const ref = doc(collection(db, 'users', UID, 'alpha_experiments'))
      if (exp.signalIndices) {
        exp.linkedSignalIds = exp.signalIndices.map((i: number) => results.signalIds[i]).filter(Boolean)
        delete exp.signalIndices
      }
      if (exp.hypothesisIndices) {
        exp.linkedHypothesisIds = exp.hypothesisIndices.map((i: number) => results.hypothesisIds[i]).filter(Boolean)
        delete exp.hypothesisIndices
      }
      await setDoc(ref, { ...exp, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      results.experimentIds.push(ref.id)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
