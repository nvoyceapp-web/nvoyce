import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'
import { sendTrialWarningEmail, sendTrialExpiredEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Called daily by Vercel Cron at midnight
// Handles: trial expiry emails (day 5 & 6) + downgrade on day 7
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = { downgraded: 0, warned2d: 0, warned1d: 0, errors: 0 }

  // Fetch all active trials
  const { data: trials, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, current_period_end')
    .eq('plan', 'pro')
    .eq('status', 'active')
    .is('stripe_subscription_id', null)

  if (error) {
    console.error('Error fetching trials:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!trials || trials.length === 0) {
    return NextResponse.json({ message: 'No active trials', ...results })
  }

  const clerk = await clerkClient()

  for (const trial of trials) {
    const trialEnd = new Date(trial.current_period_end)
    const msLeft = trialEnd.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

    // Get user email from Clerk
    let userEmail: string | null = null
    let userName = 'there'
    try {
      const user = await clerk.users.getUser(trial.user_id)
      const primary = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)
      userEmail = primary?.emailAddress || null
      userName = user.firstName || 'there'
    } catch (err) {
      console.error(`Could not fetch Clerk user ${trial.user_id}:`, err)
      results.errors++
      continue
    }

    if (!userEmail) continue

    try {
      if (daysLeft <= 0) {
        // Downgrade to free + send expiry email
        await supabase
          .from('subscriptions')
          .update({ plan: 'free', status: 'active' })
          .eq('id', trial.id)
        await sendTrialExpiredEmail({ userEmail, userName })
        results.downgraded++
        console.log(`✅ Downgraded ${trial.user_id} to Free, sent expiry email`)
      } else if (daysLeft === 1) {
        await sendTrialWarningEmail({ userEmail, userName, daysLeft: 1 })
        results.warned1d++
        console.log(`📧 Sent 1-day warning to ${userEmail}`)
      } else if (daysLeft === 2) {
        await sendTrialWarningEmail({ userEmail, userName, daysLeft: 2 })
        results.warned2d++
        console.log(`📧 Sent 2-day warning to ${userEmail}`)
      }
    } catch (err) {
      console.error(`Error processing trial for ${trial.user_id}:`, err)
      results.errors++
    }
  }

  return NextResponse.json({ message: 'Done', ...results })
}
