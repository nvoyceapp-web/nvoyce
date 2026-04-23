import { createClient } from '@supabase/supabase-js'

// Client-side Supabase (uses anon key — safe to expose)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Database types — keep in sync with your Supabase schema
export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'fully_paid' | 'overdue' | 'accepted' | 'declined' | 'expired'
export type DocType = 'invoice' | 'proposal'

export interface Document {
  id: string
  user_id: string
  doc_type: DocType
  client_name: string
  client_email: string
  business_name: string
  price: number
  status: DocumentStatus
  generated_content: GeneratedDocument
  form_data: Record<string, string>
  document_number?: string
  stripe_payment_link?: string
  stripe_payment_intent_id?: string
  currency?: string
  amount_paid?: number
  paid_at?: string
  sent_at?: string
  reminder_14_sent_at?: string
  reminder_30_sent_at?: string
  expiry_reminder_sent_at?: string
  created_at: string
  updated_at: string
}

export interface GeneratedDocument {
  documentNumber: string
  date: string
  dueDate: string
  from: { name: string; tagline: string }
  to: { name: string; email: string }
  subject: string
  introduction: string
  lineItems: LineItem[]
  subtotal: number
  tax: number
  total: number
  paymentTerms: string
  timeline: string
  notes: string
  closingMessage: string
}

export interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Contact {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  created_at: string
  updated_at: string
}

export interface ServiceTemplate {
  id: string
  user_id: string
  name: string
  description?: string
  unit_price: number
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  description: string
  amount: number
  category: string
  client_name?: string
  date: string
  notes?: string
  created_at: string
  updated_at: string
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$',    label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€',    label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£',    label: 'British Pound (GBP)' },
  { code: 'CAD', symbol: 'CA$',  label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'AU$',  label: 'Australian Dollar (AUD)' },
  { code: 'SGD', symbol: 'S$',   label: 'Singapore Dollar (SGD)' },
  { code: 'CHF', symbol: 'CHF',  label: 'Swiss Franc (CHF)' },
  { code: 'JPY', symbol: '¥',    label: 'Japanese Yen (JPY)' },
  { code: 'INR', symbol: '₹',    label: 'Indian Rupee (INR)' },
  { code: 'AED', symbol: 'AED',  label: 'UAE Dirham (AED)' },
  { code: 'MXN', symbol: 'MX$',  label: 'Mexican Peso (MXN)' },
  { code: 'BRL', symbol: 'R$',   label: 'Brazilian Real (BRL)' },
] as const

export type CurrencyCode = typeof CURRENCIES[number]['code']

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`
  }
}

export const EXPENSE_CATEGORIES = [
  'Software',
  'Hardware',
  'Marketing',
  'Travel',
  'Meals',
  'Freelancers',
  'Office',
  'Education',
  'Other',
] as const

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: 'active' | 'cancelled' | 'past_due'
  plan: 'free' | 'pro' | 'business'
  created_at: string
}
