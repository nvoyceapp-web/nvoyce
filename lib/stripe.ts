// Stripe configuration
   import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Create a Stripe payment link for a document.
// If connectedAccountId is provided (freelancer has completed Stripe Connect),
// the payment is routed to their account automatically via transfer_data.
export async function createPaymentLink({
  documentId,
  amount,
  description,
  clientEmail,
  connectedAccountId,
}: {
  documentId: string
  amount: number // in dollars
  description: string
  clientEmail: string
  connectedAccountId?: string
}): Promise<string> {
  const product = await stripe.products.create({
    name: description,
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(amount * 100), // convert to cents
    currency: 'usd',
  })

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { documentId },
    // Route funds directly to the freelancer's connected Stripe account
    // transfer_data is supported by the API but missing from the TS types for this version
    ...(connectedAccountId
      ? { payment_intent_data: { transfer_data: { destination: connectedAccountId } } as Stripe.PaymentLinkCreateParams.PaymentIntentData }
      : {}),
    after_completion: {
      type: 'redirect',
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/success?doc=${documentId}`,
      },
    },
  })

  return paymentLink.url
}

// Re-export PLANS from plans.ts for server-side use
export { PLANS } from '@/lib/plans'
