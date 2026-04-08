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

// Pricing plans
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    invoicesPerMonth: 3,
    features: ['3 invoices/proposals per month', 'PDF export', 'Stripe payment links'],
  },
  pro: {
    name: 'Pro',
    price: 19,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    invoicesPerMonth: Infinity,
    features: [
      'Unlimited invoices & proposals',
      'Invoice tracking (sent/viewed/paid)',
      'Follow-up email sequences',
      'Multiple document templates',
      'Client payment portal',
    ],
  },
  business: {
    name: 'Business',
    price: 39,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    invoicesPerMonth: Infinity,
    features: ['Everything in Pro', 'Multiple team members', 'Priority support', 'Custom branding'],
  },
}
