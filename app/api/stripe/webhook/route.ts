import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const documentId = session.metadata?.documentId

    if (!documentId) {
      console.error('No documentId in session metadata')
      return NextResponse.json({ received: true })
    }

    const amountPaid = session.amount_total / 100 // convert from cents

    // Fetch current invoice
    const { data: doc } = await supabase
      .from('documents')
      .select('price, amount_paid')
      .eq('id', documentId)
      .single()

    if (doc) {
      const totalPaid = (doc.amount_paid || 0) + amountPaid
      const newStatus = totalPaid >= doc.price ? 'fully_paid' : 'partially_paid'

      await supabase
        .from('documents')
        .update({ status: newStatus, amount_paid: totalPaid })
        .eq('id', documentId)

      console.log(`Invoice ${documentId} updated to ${newStatus} — $${totalPaid} of $${doc.price} received`)
    }
  }

  return NextResponse.json({ received: true })
}
