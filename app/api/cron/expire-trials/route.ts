import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Called daily by Vercel Cron — downgrades expired Pro trials to Free
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/expire-trials", "schedule": "0 0 * * *" }] }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  // Find all trial Pro subscriptions that have expired (no stripe_subscription_id = trial)
  const { data: expired, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, current_period_end')
    .eq('plan', 'pro')
    .eq('status', 'active')
    .is('stripe_subscription_id', null) // trial only — paid subs have a stripe ID
    .lt('current_period_end', now)

  if (error) {
    console.error('Error fetching expired trials:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ message: 'No expired trials', downgraded: 0 })
  }

  const ids = expired.map((s) => s.id)

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ plan: 'free', status: 'active' })
    .in('id', ids)

  if (updateError) {
    console.error('Error downgrading trials:', updateError)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  console.log(`✅ Downgraded ${expired.length} expired trials to Free`)
  return NextResponse.json({ message: 'Done', downgraded: expired.length })
}
