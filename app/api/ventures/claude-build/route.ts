/**
 * POST /api/ventures/claude-build
 *
 * Triggers a Claude-powered venture build.
 *
 * Supports two auth modes:
 * 1. Firebase ID token (from dashboard)
 * 2. INTERNAL_API_SECRET (from Telegram webhook dispatch)
 *
 * Body: { ventureId, uid?, skillNames?, iterate?, changes?, chatId? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes — code generation can take time

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const internalSecret = process.env.INTERNAL_API_SECRET

  let uid: string
  let body: Record<string, unknown>

  if (internalSecret && authHeader === `Bearer ${internalSecret}`) {
    // Internal auth (from Telegram webhook) — uid comes from body
    body = await req.json()
    if (!body.uid || typeof body.uid !== 'string') {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
    }
    uid = body.uid
  } else {
    // Firebase auth (from dashboard)
    const auth = await verifyAuth(req)
    if (auth instanceof NextResponse) return auth
    uid = auth.uid
    body = await req.json()
  }

  const { ventureId, skillNames, iterate, changes, chatId } = body as {
    ventureId?: string
    skillNames?: string[]
    iterate?: boolean
    changes?: string
    chatId?: string
  }

  if (!ventureId) {
    return NextResponse.json({ error: 'Missing ventureId' }, { status: 400 })
  }

  try {
    // Load venture from Firestore
    const { adminDb } = await import('@/lib/firebase-admin')
    const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc(ventureId)
    const snap = await ventureRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Venture not found' }, { status: 404 })
    }

    const venture = snap.data()

    // Validate stage — for Telegram dispatches the webhook already set stage to 'building',
    // so accept 'building' as well
    if (iterate) {
      const canIterate = venture?.stage === 'deployed' || venture?.stage === 'building'
      if (!canIterate) {
        return NextResponse.json({ error: 'Venture must be deployed to iterate' }, { status: 400 })
      }
      if (!changes?.trim()) {
        return NextResponse.json({ error: 'Missing changes description' }, { status: 400 })
      }
    } else {
      const canBuild = venture?.stage === 'prd_draft' || venture?.stage === 'building' ||
        (venture?.stage === 'building' && venture?.build?.status === 'failed')
      if (!canBuild) {
        return NextResponse.json({ error: 'Venture must be in prd_draft or building stage' }, { status: 400 })
      }
    }

    if (!venture?.prd) {
      return NextResponse.json({ error: 'Venture has no PRD — generate one first' }, { status: 400 })
    }

    // Mark as building (may already be set by Telegram handler, but ensure it's set for dashboard calls)
    if (iterate) {
      const iterations = venture.iterations || []
      // Only add iteration entry if not already added by Telegram handler
      if (venture.stage !== 'building') {
        iterations.push({ request: changes!.trim(), completedAt: null })
      }
      await ventureRef.update({
        stage: 'building',
        iterations,
        'build.status': 'generating',
        'build.startedAt': new Date(),
        'build.errorMessage': null,
        'build.buildLog': ['Build started (Claude)'],
        updatedAt: new Date(),
      })
    } else if (venture.stage !== 'building') {
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
      const skillsSnap = await adminDb.collection('users').doc(uid).collection('builder_skills').get()
      const userSkills = skillsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BuilderSkillLike[]
      const matched = userSkills.filter(s => skillNames.includes(s.name))
      const userSkillNames = new Set(matched.map(s => s.name))
      const defaultMatches = getDefaultSkillsByNames(
        skillNames.filter((n: string) => !userSkillNames.has(n))
      ).map(s => ({ ...s, createdAt: new Date(), updatedAt: new Date() }))
      skills = [...matched, ...defaultMatches] as BuilderSkillLike[]
    }

    if (skills.length === 0) {
      const defaultSnap = await adminDb.collection('users').doc(uid).collection('builder_skills')
        .where('isDefault', '==', true).get()
      if (!defaultSnap.empty) {
        skills = defaultSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BuilderSkillLike[]
      } else {
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
        changes: changes!.trim(),
        existingFiles: [],
      } : undefined,
    })

    // Resolve Telegram chatId for notifications
    let resolvedChatId = chatId
    if (!resolvedChatId) {
      try {
        const userDoc = await adminDb.collection('users').doc(uid).get()
        resolvedChatId = userDoc.data()?.settings?.telegramChatId
      } catch { /* no chat ID available */ }
    }

    const ventureName = venture.spec?.name || 'venture'
    const vNum = venture.ventureNumber ? `#${venture.ventureNumber} ` : ''

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

      // Auto-log the ship
      try {
        const now = new Date()
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
        await logRef.set({
          whatShipped: `Deployed ${ventureName} to ${result.previewUrl || result.repoUrl || 'live'} (Claude build)`,
          publicIteration: true,
          updatedAt: new Date(),
        }, { merge: true })
      } catch (logErr) {
        console.error('Auto-ship log failed:', logErr)
      }

      // Notify via Telegram
      if (resolvedChatId) {
        const liveUrl = result.customDomain ? `https://${result.customDomain}` : result.previewUrl || result.repoUrl
        await sendTelegramMessage(resolvedChatId, [
          `${vNum}${ventureName} is LIVE`,
          '',
          liveUrl || '',
          result.repoUrl ? `Repo: ${result.repoUrl}` : '',
          result.filesGenerated ? `${result.filesGenerated} files generated` : '',
          '',
          'Use /iterate to modify, /memo to generate investment memo',
        ].filter(Boolean).join('\n'))
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
        // Revert stage: if iterating revert to deployed, if fresh build revert to prd_draft
        stage: iterate ? 'deployed' : 'prd_draft',
        updatedAt: new Date(),
      })

      // Notify via Telegram
      if (resolvedChatId) {
        await sendTelegramMessage(resolvedChatId, [
          `${vNum}${ventureName} build FAILED`,
          '',
          result.errorMessage || 'Unknown error',
          '',
          iterate ? 'Use /iterate to retry' : 'Use /build to retry or /feedback to adjust the PRD',
        ].join('\n'))
      }

      return NextResponse.json({
        success: false,
        error: result.errorMessage,
        buildLog: result.buildLog,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Claude build error:', error)

    // Try to notify via Telegram on unexpected errors
    try {
      const { adminDb } = await import('@/lib/firebase-admin')
      // Revert venture stage
      if (ventureId) {
        const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc(ventureId)
        await ventureRef.update({
          'build.status': 'failed',
          'build.errorMessage': error instanceof Error ? error.message : 'Unknown error',
          'build.completedAt': new Date(),
          stage: iterate ? 'deployed' : 'prd_draft',
          updatedAt: new Date(),
        })
      }

      let resolvedChatId = chatId
      if (!resolvedChatId) {
        const userDoc = await adminDb.collection('users').doc(uid).get()
        resolvedChatId = userDoc.data()?.settings?.telegramChatId
      }
      if (resolvedChatId) {
        await sendTelegramMessage(resolvedChatId,
          `Build failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nUse /build to retry.`)
      }
    } catch (notifyErr) {
      console.error('Failed to send failure notification:', notifyErr)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
