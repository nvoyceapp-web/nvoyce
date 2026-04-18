import { createPaymentLink } from '@/lib/stripe'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId, amount, description, clientEmail } = await req.json()

    if (!documentId || !amount || !description || !clientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Look up the freelancer's connected Stripe account
    const { data: settings } = await supabase
      .from('user_settings')
      .select('stripe_account_id, stripe_connect_complete')
      .eq('user_id', userId)
      .single()
    const connectedAccountId =
      settings?.stripe_connect_complete && settings?.stripe_account_id
        ? settings.stripe_account_id
        : undefined

    const paymentLink = await createPaymentLink({
      documentId,
      amount,
      description,
      clientEmail,
      connectedAccountId,
    })

    return NextResponse.json({ paymentLink })
  } catch (error) {
    console.error('Payment link error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
