import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()

  const priceId =
    plan === 'pro'
      ? process.env.STRIPE_PRO_PRICE_ID
      : plan === 'business'
      ? process.env.STRIPE_BUSINESS_PRICE_ID
      : null

  if (!priceId) {
    console.error(`Missing price ID for plan "${plan}". STRIPE_PRO_PRICE_ID=${process.env.STRIPE_PRO_PRICE_ID}, STRIPE_BUSINESS_PRICE_ID=${process.env.STRIPE_BUSINESS_PRICE_ID}`)
    return NextResponse.json({ error: `Price not configured for plan: ${plan}` }, { status: 400 })
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('NEXT_PUBLIC_APP_URL is not set')
    return NextResponse.json({ error: 'App URL not configured' }, { status: 500 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err?.message, err?.type, err?.code)
    return NextResponse.json({ error: err?.message || 'Stripe error' }, { status: 500 })
  }
}
