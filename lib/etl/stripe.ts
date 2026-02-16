// @ts-nocheck
/**
 * Stripe API ETL
 * Syncs daily revenue metrics: MRR, ARR, subscriptions, customers
 * Runs at 6am daily via cron
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

interface RevenueMetrics {
  date: string
  mrr: number
  arr: number
  daily_revenue: number
  active_subscriptions: number
  new_customers_today: number
  churned_customers_today: number
  raw_data: any
}

/**
 * Calculate MRR (Monthly Recurring Revenue) from active subscriptions
 */
async function calculateMRR(date: string): Promise<number> {
  const subscriptions = await stripe.subscriptions.list({
    status: 'active',
    limit: 100,
    expand: ['data.items.data.price']
  })

  let mrr = 0

  for (const sub of subscriptions.data) {
    for (const item of sub.items.data) {
      const price = item.price
      const quantity = item.quantity || 1

      if (price.recurring) {
        const amount = price.unit_amount || 0
        const interval = price.recurring.interval

        // Normalize to monthly
        let monthlyAmount = amount * quantity / 100 // Convert cents to dollars

        if (interval === 'year') {
          monthlyAmount = monthlyAmount / 12
        } else if (interval === 'week') {
          monthlyAmount = monthlyAmount * 4.33 // ~4.33 weeks per month
        } else if (interval === 'day') {
          monthlyAmount = monthlyAmount * 30
        }

        mrr += monthlyAmount
      }
    }
  }

  return Math.round(mrr * 100) / 100
}

/**
 * Calculate daily revenue from charges
 */
async function calculateDailyRevenue(date: string): Promise<number> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const charges = await stripe.charges.list({
    created: {
      gte: Math.floor(startOfDay.getTime() / 1000),
      lte: Math.floor(endOfDay.getTime() / 1000)
    },
    limit: 100
  })

  const revenue = charges.data
    .filter(charge => charge.status === 'succeeded')
    .reduce((sum, charge) => sum + charge.amount, 0)

  return revenue / 100 // Convert cents to dollars
}

/**
 * Count new customers for the date
 */
async function countNewCustomers(date: string): Promise<number> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const customers = await stripe.customers.list({
    created: {
      gte: Math.floor(startOfDay.getTime() / 1000),
      lte: Math.floor(endOfDay.getTime() / 1000)
    },
    limit: 100
  })

  return customers.data.length
}

/**
 * Count churned subscriptions for the date
 */
async function countChurnedSubscriptions(date: string): Promise<number> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const events = await stripe.events.list({
    type: 'customer.subscription.deleted',
    created: {
      gte: Math.floor(startOfDay.getTime() / 1000),
      lte: Math.floor(endOfDay.getTime() / 1000)
    },
    limit: 100
  })

  return events.data.length
}

/**
 * Sync revenue metrics for a given date
 */
export async function syncRevenueMetrics(date: string): Promise<RevenueMetrics | null> {
  const startTime = Date.now()

  try {
    // Log sync attempt
    await supabase.from('sync_status').insert({
      date,
      source: 'stripe',
      status: 'pending',
      started_at: new Date().toISOString()
    })

    // Fetch all metrics in parallel
    const [mrr, dailyRevenue, newCustomers, churnedSubs, activeSubsData] = await Promise.all([
      calculateMRR(date),
      calculateDailyRevenue(date),
      countNewCustomers(date),
      countChurnedSubscriptions(date),
      stripe.subscriptions.list({ status: 'active', limit: 1 })
    ])

    const metrics: RevenueMetrics = {
      date,
      mrr,
      arr: mrr * 12,
      daily_revenue: dailyRevenue,
      active_subscriptions: activeSubsData.data.length,
      new_customers_today: newCustomers,
      churned_customers_today: churnedSubs,
      raw_data: {
        mrr_breakdown: { /* Could add more detail here */ }
      }
    }

    // Insert to database (not upsert - we want daily snapshots)
    const { error } = await supabase
      .from('revenue_metrics')
      .insert(metrics)

    if (error) throw error

    // Log success
    await supabase.from('sync_status').insert({
      date,
      source: 'stripe',
      status: 'success',
      records_synced: 1,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    })

    console.log(`✅ Stripe synced for ${date}: $${mrr} MRR`)
    return metrics

  } catch (error: any) {
    console.error(`❌ Stripe sync failed for ${date}:`, error)

    // Log failure
    await supabase.from('sync_status').insert({
      date,
      source: 'stripe',
      status: 'failed',
      error_message: error.message,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    })

    return null
  }
}

/**
 * Backfill last N days of revenue data
 */
export async function backfillRevenueData(days: number = 90) {
  const results = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const metrics = await syncRevenueMetrics(dateStr)
    results.push({ date: dateStr, success: !!metrics })

    // Rate limit: wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const successful = results.filter(r => r.success).length
  console.log(`Backfilled ${successful}/${days} days of revenue data`)

  return results
}

/**
 * Get current MRR (useful for dashboard)
 */
export async function getCurrentMRR() {
  const today = new Date().toISOString().split('T')[0]
  return await calculateMRR(today)
}
