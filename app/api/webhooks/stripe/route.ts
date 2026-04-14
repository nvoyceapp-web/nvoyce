import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'
import { sendUpgradeConfirmationEmail, sendPaymentConfirmationEmail, sendPaymentReceivedEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// This endpoint listens for events from Stripe and updates invoice status
// Registered at: https://app.nvoyce.ai/api/webhooks/stripe
// Events: checkout.session.completed, customer.subscription.deleted,
//         customer.subscription.updated, invoice.payment_failed
export async function POST(req: NextRequest) {
  const body = await req.text() // Must use raw body for signature verification
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle invoice payment via checkout session (Payment Links)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Check if this is an invoice payment (has documentId in metadata)
    const documentId = session.metadata?.documentId

    if (documentId && session.payment_status === 'paid') {
      const amountPaidNow = (session.amount_total || 0) / 100

      // Fetch current document to compute new totals
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('price, amount_paid, status, client_email, client_name, business_name, document_number, user_id')
        .eq('id', documentId)
        .single()

      if (fetchError || !doc) {
        console.error('Could not find document for webhook:', documentId, fetchError)
      } else {
        const totalPaid = (doc.amount_paid || 0) + amountPaidNow
        const newStatus = totalPaid >= doc.price ? 'fully_paid' : 'partially_paid'

        await supabase
          .from('documents')
          .update({
            status: newStatus,
            amount_paid: totalPaid,
          })
          .eq('id', documentId)

        console.log(`Document ${documentId}: ${doc.status} → ${newStatus} ($${totalPaid} of $${doc.price})`)

        // Send payment emails on ANY payment — partial or full
        try {
          // 1. Notify the client — payment receipt (always)
          if (doc.client_email) {
            await sendPaymentConfirmationEmail({
              clientEmail: doc.client_email,
              clientName: doc.client_name || 'there',
              freelancerName: doc.business_name || 'your provider',
              amount: amountPaidNow,
              totalPaid,
              invoiceTotal: doc.price,
              documentNumber: doc.document_number || documentId,
              isPartial: newStatus === 'partially_paid',
            })
          }

          // 2. Notify the freelancer — payment received (always)
          const clerk = await clerkClient()
          const user = await clerk.users.getUser(doc.user_id)
          const primary = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)
          if (primary?.emailAddress) {
            await sendPaymentReceivedEmail({
              freelancerEmail: primary.emailAddress,
              freelancerName: user.firstName || 'there',
              clientName: doc.client_name || 'Your client',
              amount: amountPaidNow,
              totalPaid,
              invoiceTotal: doc.price,
              documentNumber: doc.document_number || documentId,
              isPartial: newStatus === 'partially_paid',
              dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents/${documentId}`,
              userId: doc.user_id,
            })
          }
        } catch (emailErr) {
          console.error('Payment email error (non-fatal):', emailErr)
        }
      }
    }

    // Check if this is a subscription upgrade (has userId in metadata)
    const userId = session.metadata?.userId
    if (userId && session.subscription) {
      const plan = (session.metadata?.plan as 'pro' | 'business') || 'pro'

      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          status: 'active',
          plan,
        })

      console.log(`User ${userId} upgraded to ${plan}`)

      // Send upgrade confirmation email
      try {
        const clerk = await clerkClient()
        const user = await clerk.users.getUser(userId)
        const primary = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)
        if (primary?.emailAddress) {
          await sendUpgradeConfirmationEmail({
            userEmail: primary.emailAddress,
            userName: user.firstName || 'there',
            plan,
          })
        }
      } catch (err) {
        console.error('Failed to send upgrade confirmation email:', err)
      }
    }
  }

  // Handle subscription cancelled
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('stripe_subscription_id', subscription.id)

    console.log(`Subscription ${subscription.id} cancelled`)
  }

  // Handle subscription updated (plan change / renewal)
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const plan = subscription.items.data[0]?.price?.nickname?.toLowerCase() || 'pro'
    await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        plan,
      })
      .eq('stripe_subscription_id', subscription.id)

    console.log(`Subscription ${subscription.id} updated → ${subscription.status} (${plan})`)
  }

  // Handle subscription payment failure
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription as string
    if (subscriptionId) {
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', subscriptionId)

      console.log(`Subscription ${subscriptionId} payment failed → past_due`)
    }
  }

  return NextResponse.json({ received: true })
}
