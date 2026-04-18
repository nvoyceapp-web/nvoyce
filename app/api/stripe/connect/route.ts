import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — create or resume Express Connect onboarding, return the account link URL
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Look up existing account ID for this user
    const { data: settings } = await supabase
      .from('user_settings')
      .select('stripe_account_id')
      .eq('user_id', userId)
      .single()

    let accountId = settings?.stripe_account_id

    // Create a new Express account if this user hasn't started Connect yet
    if (!accountId) {
      const account = await stripe.accounts.create({ type: 'express' })
      accountId = account.id

      await supabase.from('user_settings').upsert({
        user_id: userId,
        stripe_account_id: accountId,
        updated_at: new Date().toISOString(),
      })
    }

    // Generate a fresh account link (they expire after ~5 min)
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      // If the link expires, send them back to settings to start again
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?stripe_refresh=true`,
      // After onboarding, send them back to settings to confirm
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?stripe_return=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err: any) {
    console.error('Stripe Connect error:', err)
    return NextResponse.json({ error: 'Failed to create Connect link' }, { status: 500 })
  }
}

// GET — check whether onboarding is complete and sync status to user_settings
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('stripe_account_id, stripe_connect_complete')
      .eq('user_id', userId)
      .single()

    if (!settings?.stripe_account_id) {
      return NextResponse.json({ connected: false })
    }

    const account = await stripe.accounts.retrieve(settings.stripe_account_id)
    const isComplete = !!(account.details_submitted && account.charges_enabled)

    // Persist the completed status so we don't need to re-check every load
    if (isComplete && !settings.stripe_connect_complete) {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        stripe_connect_complete: true,
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      connected: isComplete,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    })
  } catch (err: any) {
    console.error('Stripe Connect status error:', err)
    return NextResponse.json({ error: 'Failed to check Connect status' }, { status: 500 })
  }
}
