import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const range = parseInt(searchParams.get('range') || '1', 10)

  if (!date) {
    return NextResponse.json({ error: 'date parameter required' }, { status: 400 })
  }

  // Fetch single date or range of dates
  if (range <= 1) {
    const { data, error } = await supabase
      .from('calendar_time')
      .select('date, deep_work_min, meetings_min, learning_min, fitness_min, social_min, recovery_min')
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || null)
  }

  // Range query: get last N days from the given date
  const startDate = new Date(date + 'T12:00:00')
  startDate.setDate(startDate.getDate() - range + 1)
  const startStr = startDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('calendar_time')
    .select('date, deep_work_min, meetings_min, learning_min, fitness_min, social_min, recovery_min')
    .gte('date', startStr)
    .lte('date', date)
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
