// Pricing plans — safe to import in client components (no Stripe SDK)
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    invoicesPerMonth: 3,
    features: ['3 invoices/proposals per month', 'PDF export', 'Stripe payment links'],
  },
  pro: {
    name: 'Pro',
    price: 19.99,
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
    price: 39.99,
    invoicesPerMonth: Infinity,
    features: ['Everything in Pro', 'Multiple team members', 'Priority support', 'Custom branding'],
  },
}
