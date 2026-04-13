// Stripe configuration
   import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Create a Stripe payment link for a document
// This link is embedded directly in the invoice/proposal
export async function createPaymentLink({
  documentId,
  amount,
  description,
  clientEmail,
}: {
  documentId: string
  amount: number // in dollars
  description: string
  clientEmail: string
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
