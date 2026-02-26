/**
 * POST /api/ventures/claude-build
 *
 * Triggers a Claude-powered venture build. Replaces the GitHub Actions
 * dispatch workflow with inline code generation via Anthropic API.
 *
 * Flow:
 * 1. Validate venture has a PRD
 * 2. Load attached skills (or defaults)
 * 3. Build via Claude API → generate files → push to GitHub → deploy
 * 4. Update venture document with results
 *
 * Body: { ventureId: string, skills?: string[], iterate?: boolean, changes?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes — code generation can take time

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  const uid = auth.uid

  try {
    const { ventureId, skillNames, iterate, changes } = await req.json()

    if (!ventureId) {
      return NextResponse.json({ error: 'Missing ventureId' }, { status: 400 })
    }

    // Load venture from Firestore
    const { adminDb } = await import('@/lib/firebase-admin')
    const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc(ventureId)
    const snap = await ventureRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Venture not found' }, { status: 404 })
    }

    const venture = snap.data()

    // Validate stage
    if (iterate) {
      if (venture?.stage !== 'deployed') {
        return NextResponse.json({ error: 'Venture must be deployed to iterate' }, { status: 400 })
      }
      if (!changes?.trim()) {
        return NextResponse.json({ error: 'Missing changes description' }, { status: 400 })
      }
    } else {
      const canBuild = venture?.stage === 'prd_draft' ||
        (venture?.stage === 'building' && venture?.build?.status === 'failed')
      if (!canBuild) {
        return NextResponse.json({ error: 'Venture must be in prd_draft stage or failed build' }, { status: 400 })
      }
    }

    if (!venture?.prd) {
      return NextResponse.json({ error: 'Venture has no PRD — generate one first' }, { status: 400 })
    }

    // Mark as building
    if (iterate) {
      const iterations = venture.iterations || []
      iterations.push({ request: changes.trim(), completedAt: null })
      await ventureRef.update({
        stage: 'building',
        iterations,
        'build.status': 'generating',
        'build.startedAt': new Date(),
        'build.errorMessage': null,
        'build.buildLog': ['Build started (Claude)'],
        updatedAt: new Date(),
      })
    } else {
      await ventureRef.update({
        stage: 'building',
        'build.status': 'generating',
        'build.startedAt': new Date(),
        'build.errorMessage': null,
        'build.buildLog': ['Build started (Claude)'],
        updatedAt: new Date(),
      })
    }

    // Load skills
    const { buildVenture } = await import('@/lib/claude-builder')
    const { DEFAULT_SKILLS, getDefaultSkillsByNames } = await import('@/lib/claude-builder/default-skills')
    type BuilderSkillLike = typeof DEFAULT_SKILLS[number] & { id?: string; createdAt: unknown; updatedAt: unknown }

    let skills: BuilderSkillLike[] = []

    if (skillNames && Array.isArray(skillNames) && skillNames.length > 0) {
      // Load user's custom skills from Firestore
      const skillsSnap = await adminDb.collection('users').doc(uid).collection('builder_skills').get()
      const userSkills = skillsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BuilderSkillLike[]

      // Match by name
      const matched = userSkills.filter(s => skillNames.includes(s.name))

      // Also add any default skills requested but not found in user collection
      const userSkillNames = new Set(matched.map(s => s.name))
      const defaultMatches = getDefaultSkillsByNames(
        skillNames.filter((n: string) => !userSkillNames.has(n))
      ).map(s => ({ ...s, createdAt: new Date(), updatedAt: new Date() }))

      skills = [...matched, ...defaultMatches] as BuilderSkillLike[]
    }

    // If no skills specified, use defaults (auto-attach)
    if (skills.length === 0) {
      // Check user's default skills first
      const defaultSnap = await adminDb.collection('users').doc(uid).collection('builder_skills')
        .where('isDefault', '==', true).get()

      if (!defaultSnap.empty) {
        skills = defaultSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BuilderSkillLike[]
      } else {
        // Use hardcoded defaults
        skills = DEFAULT_SKILLS
          .filter(s => s.isDefault)
          .map(s => ({ ...s, createdAt: new Date(), updatedAt: new Date() })) as BuilderSkillLike[]
      }
    }

    // Build with Claude
    const result = await buildVenture({
      ventureId,
      uid,
      spec: venture.spec,
      prd: venture.prd,
      skills: skills as import('@/lib/types').BuilderSkill[],
      iterate: iterate ? {
        repoName: venture.build?.repoName || venture.prd.projectName,
        changes: changes.trim(),
        existingFiles: [],
      } : undefined,
    })

    // Update venture with results
    if (result.success) {
      await ventureRef.update({
        stage: 'deployed',
        'build.status': 'live',
        'build.repoUrl': result.repoUrl,
        'build.previewUrl': result.previewUrl,
        'build.customDomain': result.customDomain,
        'build.repoName': result.repoName,
        'build.filesGenerated': result.filesGenerated,
        'build.completedAt': new Date(),
        'build.buildLog': result.buildLog,
        updatedAt: new Date(),
      })

      // Auto-log the ship to today's daily_log
      try {
        const now = new Date()
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
        await logRef.set({
          whatShipped: `Deployed ${venture.spec?.name || 'venture'} to ${result.previewUrl || result.repoUrl || 'live'} (Claude build)`,
          publicIteration: true,
          updatedAt: new Date(),
        }, { merge: true })
      } catch (logErr) {
        console.error('Auto-ship log failed:', logErr)
      }

      return NextResponse.json({
        success: true,
        repoUrl: result.repoUrl,
        previewUrl: result.previewUrl,
        customDomain: result.customDomain,
        filesGenerated: result.filesGenerated,
      })
    } else {
      await ventureRef.update({
        'build.status': 'failed',
        'build.errorMessage': result.errorMessage,
        'build.completedAt': new Date(),
        'build.buildLog': result.buildLog,
        ...(iterate ? { stage: 'deployed' } : {}),
        updatedAt: new Date(),
      })

      return NextResponse.json({
        success: false,
        error: result.errorMessage,
        buildLog: result.buildLog,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Claude build error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
