/**
 * Daily Orders cache and promise ledger.
 *
 * One doc per athlete per day at `users_orders/{person}_{date}`, holding two
 * separate things:
 *
 *   orders    the last assembled payload, with a TTL. The watch is a
 *             battery-powered client on a flaky BLE link, so it must never be
 *             the thing that triggers a four-way forecast fetch plus a dozen
 *             Firestore reads. The crons warm this; the watch reads it.
 *
 *   promised  what the previous evening committed to for this date. This is
 *             written a day ahead and is NOT part of the cache — it has to
 *             survive every rebuild, or the morning loses its ability to say
 *             what changed overnight.
 *
 * The TTL is the safety net: if a cron fails, the next read rebuilds rather
 * than serving yesterday's wind.
 */

import {
  buildDailyOrders,
  currentPhase,
  promiseOf,
  type DailyOrders,
  type DayPromise,
  type OrderPhase,
  type Person,
} from '@/lib/exec/orders'
import { addDaysISO } from '@/lib/exec/windows'
import { todayLocal } from '@/lib/ironman/plan'

export const ORDERS_TTL_MS = 20 * 60 * 1000

interface OrdersDoc {
  orders?: DailyOrders
  phase?: OrderPhase
  builtAtMs?: number
  promised?: DayPromise
}

export interface OrdersResult {
  orders: DailyOrders
  source: 'cache' | 'rebuilt'
  ageMs: number
}

async function docRef(person: Person, date: string) {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb.collection('daily_orders').doc(`${person}_${date}`)
}

/** Firestore rejects `undefined`; the compact builder relies on absent keys. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function getDailyOrders(
  person: Person = 'lori',
  opts: { date?: string; force?: boolean; maxAgeMs?: number; now?: Date } = {}
): Promise<OrdersResult> {
  const now = opts.now ?? new Date()
  const date = opts.date ?? todayLocal()
  const maxAgeMs = opts.maxAgeMs ?? ORDERS_TTL_MS
  const ref = await docRef(person, date)

  let promised: DayPromise | null = null

  try {
    const snap = await ref.get()
    if (snap.exists) {
      const doc = snap.data() as OrdersDoc
      promised = doc.promised ?? null

      if (!opts.force && doc.orders && doc.builtAtMs) {
        const ageMs = now.getTime() - doc.builtAtMs
        // A stale phase is as wrong as stale wind: the evening review must not
        // keep serving the morning's orders.
        if (ageMs < maxAgeMs && doc.phase === currentPhase(now)) {
          return { orders: doc.orders, source: 'cache', ageMs }
        }
      }
    }
  } catch (e) {
    console.error('[daily-orders] cache read failed, rebuilding:', e)
  }

  const orders = await buildDailyOrders(person, date, now, promised)

  try {
    // merge:true so `promised` — written a day earlier — survives this write.
    await ref.set(
      clean({ orders, phase: orders.phase, builtAtMs: now.getTime() }),
      { merge: true }
    )
  } catch (e) {
    console.error('[daily-orders] cache write failed:', e)
  }

  // An evening that has worked out tomorrow's plan owes the next morning a
  // record of it, so "the forecast moved" can be distinguished from "the
  // forecast was always this".
  if (orders.phase === 'evening' && orders.tomorrow) {
    try {
      const tomorrowRef = await docRef(person, addDaysISO(date, 1))
      await tomorrowRef.set({ promised: clean(promiseOf(orders.tomorrow)) }, { merge: true })
    } catch (e) {
      console.error('[daily-orders] promise write failed:', e)
    }
  }

  return { orders, source: 'rebuilt', ageMs: 0 }
}

/** Warm the cache from a cron. Never throws — a brief must not fail over this. */
export async function refreshDailyOrders(person: Person, date?: string): Promise<DailyOrders | null> {
  try {
    const { orders } = await getDailyOrders(person, { date, force: true })
    return orders
  } catch (e) {
    console.error(`[daily-orders] refresh failed for ${person}:`, e)
    return null
  }
}
