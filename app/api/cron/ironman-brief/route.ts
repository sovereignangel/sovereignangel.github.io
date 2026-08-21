/**
 * Ironman Brief Cron — daily adapted training session to Telegram
 *
 * Runs daily at 04:45 UTC (07:45 Palanga, EEST) via vercel.json, after the
 * 04:30 kite brief and before the day starts. Reads the latest Garmin
 * recovery metrics + recent activities, computes readiness, adapts today's
 * planned session, and sends it through the inbox router.
 *
 * Manual trigger: GET /api/cron/ironman-brief with Authorization: Bearer CRON_SECRET
 * Dry run (no Telegram send): add ?dry=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { sendToInbox } from '@/lib/inbox/client'
import { getPlanDay, daysToRace, todayLocal, nextRace } from '@/lib/ironman/plan'
import { computeReadiness, adaptDay, matchDay } from '@/lib/ironman/adapt'
import type { GarminMetrics, GarminActivity } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uid = process.env.FIREBASE_UID
  if (!uid) {
    return NextResponse.json({ error: 'FIREBASE_UID not set' }, { status: 500 })
  }

  try {
    const today = todayLocal()
    const countdown = daysToRace(today)

    if (countdown < 0) {
      return NextResponse.json({ success: true, skipped: 'race is over' })
    }

    const [metricsSnap, activitiesSnap] = await Promise.all([
      adminDb.collection('users').doc(uid).collection('garmin_metrics')
        .orderBy('date', 'desc').limit(35).get(),
      adminDb.collection('users').doc(uid).collection('garmin_activities')
        .orderBy('date', 'desc').limit(60).get(),
    ])
    const metrics = metricsSnap.docs.map((d) => d.data() as GarminMetrics)
    const activities = activitiesSnap.docs.map((d) => d.data() as GarminActivity)

    const readiness = computeReadiness(metrics, activities, today)
    const day = getPlanDay(today)

    const lines: string[] = []
    lines.push(`IRONMAN — ${countdown} day${countdown === 1 ? '' : 's'} to ${nextRace(today).name}`)
    lines.push('')

    if (readiness.score !== null) {
      const bandWord = readiness.band === 'green' ? 'GREEN' : readiness.band === 'amber' ? 'AMBER' : 'RED'
      lines.push(`Readiness ${readiness.score}/100 (${bandWord})`)
      for (const f of readiness.factors) {
        lines.push(`  ${f.label}: ${f.value}`)
      }
    } else {
      lines.push('Readiness: no Garmin data yet — self-assess.')
    }
    lines.push('')

    let adaptationLevel = 'none'
    if (day) {
      const adaptation = adaptDay(day, readiness)
      adaptationLevel = adaptation.level
      lines.push(`${adaptation.headline} — ${day.phase}: ${day.focus}`)
      lines.push('')
      for (const x of adaptation.sessions) {
        const meta = [
          x.durationMin > 0 ? `${x.durationMin}min` : null,
          x.distanceKm ? `${x.distanceKm}km` : null,
          x.zone !== '-' ? x.zone : null,
        ].filter(Boolean).join(' · ')
        lines.push(`${x.title}${meta ? ` (${meta})` : ''}`)
        lines.push(`  ${x.detail}`)
      }

      // Yesterday's compliance
      const yesterday = new Date(today + 'T00:00:00Z')
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      const yDate = yesterday.toISOString().slice(0, 10)
      const yPlan = getPlanDay(yDate)
      if (yPlan) {
        const yStatus = matchDay(yPlan, activities, today)
        const done = yStatus.sessions.filter((m) => m.status === 'done' || m.status === 'partial')
        const missed = yStatus.sessions.filter((m) => m.status === 'missed')
        lines.push('')
        if (done.length > 0) {
          const parts = done.map((m) =>
            `${m.session.sport} ${m.actual?.distanceKm != null ? m.actual.distanceKm + 'km' : (m.actual?.durationMin ?? 0) + 'min'}`
          )
          lines.push(`Yesterday: ${parts.join(', ')} logged.`)
        }
        if (missed.length > 0) {
          lines.push(`Missed yesterday: ${missed.map((m) => m.session.title).join(', ')} — absorbed, not rescheduled.`)
        }
      }
    } else {
      lines.push('No session planned today.')
    }

    const message = lines.join('\n')

    if (request.nextUrl.searchParams.get('dry') === '1') {
      return NextResponse.json({ success: true, dry: true, message, readiness })
    }

    const result = await sendToInbox({
      source: 'thesis',
      kind: 'info',
      severity: 'info',
      title: `Ironman Brief — ${today}`,
      body: message,
      link: 'https://www.loricorpuz.com/ironman',
      dedupe_key: `ironman-brief:${today}`,
    })

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      date: today,
      countdown,
      readiness: readiness.score,
      adaptation: adaptationLevel,
      deduped: 'deduped' in result ? result.deduped : undefined,
    })
  } catch (error) {
    console.error('[ironman-brief] Cron failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
