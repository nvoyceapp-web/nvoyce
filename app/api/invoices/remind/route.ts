import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { sendInvoiceOverdueReminderEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — send an on-demand overdue reminder email for a specific invoice
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await req.json()
  if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 })

  // Fetch the document + user settings together
  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single()

  if (error || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  if (doc.doc_type !== 'invoice') return NextResponse.json({ error: 'Only invoices can receive payment reminders' }, { status: 400 })
  if (['draft', 'fully_paid'].includes(doc.status)) return NextResponse.json({ error: 'Invoice is not eligible for a reminder' }, { status: 400 })

  const { data: settings } = await supabase
    .from('user_settings')
    .select('business_name, logo_url')
    .eq('user_id', userId)
    .single()

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single()

  const daysOverdue = Math.max(0, Math.floor(
    (Date.now() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24) - 30
  ))

  try {
    await sendInvoiceOverdueReminderEmail({
      clientEmail: doc.client_email,
      clientName: doc.client_name,
      freelancerName: profile?.full_name || settings?.business_name || 'Your freelancer',
      businessName: settings?.business_name || 'Nvoyce',
      amount: doc.price,
      invoiceNumber: doc.document_number || 'N/A',
      daysOverdue,
      paymentLink: doc.stripe_payment_link || undefined,
      logoUrl: settings?.logo_url || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Remind email error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send reminder' }, { status: 500 })
  }
}
