import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { sendProposalSentEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — re-send a proposal follow-up email to a client
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await req.json()
  if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 })

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single()

  if (error || !doc) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  if (doc.doc_type !== 'proposal') return NextResponse.json({ error: 'Only proposals can receive follow-up emails' }, { status: 400 })
  if (!['sent', 'viewed'].includes(doc.status)) return NextResponse.json({ error: 'Proposal must be in sent or viewed state' }, { status: 400 })

  const { data: settings } = await supabase
    .from('user_settings')
    .select('business_name')
    .eq('user_id', userId)
    .single()

  const proposalLink = `${process.env.NEXT_PUBLIC_APP_URL}/p/${documentId}`
  const formData = typeof doc.form_data === 'string' ? JSON.parse(doc.form_data) : doc.form_data || {}

  try {
    await sendProposalSentEmail({
      clientEmail: doc.client_email,
      clientName: doc.client_name,
      businessName: settings?.business_name || 'Your freelancer',
      proposalLink,
      serviceDescription: formData.serviceDescription || 'Professional services',
      amount: doc.price,
      timeline: formData.timeline || undefined,
      userId,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Follow-up email error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send follow-up' }, { status: 500 })
  }
}
