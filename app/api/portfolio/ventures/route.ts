import { NextResponse } from 'next/server'

export async function GET() {
  const portfolioUid = process.env.FIREBASE_UID || process.env.PORTFOLIO_UID
  if (!portfolioUid) {
    return NextResponse.json([])
  }

  try {
    const { adminDb } = await import('@/lib/firebase-admin')
    const snap = await adminDb
      .collection('users')
      .doc(portfolioUid)
      .collection('ventures')
      .where('stage', '==', 'deployed')
      .orderBy('updatedAt', 'desc')
      .get()

    const ventures = snap.docs.map(doc => {
      const d = doc.data()
      return {
        id: doc.id,
        name: d.spec?.name || 'Untitled',
        oneLiner: d.spec?.oneLiner || '',
        category: d.spec?.category || 'other',
        revenueModel: d.spec?.revenueModel || '',
        pricingIdea: d.spec?.pricingIdea || '',
        previewUrl: d.build?.previewUrl || null,
        customDomain: d.build?.customDomain || null,
        repoUrl: d.build?.repoUrl || null,
      }
    })

    return NextResponse.json(ventures)
  } catch (error) {
    console.error('Portfolio ventures fetch failed:', error)
    return NextResponse.json([])
  }
}
