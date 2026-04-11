import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendProposalSentEmail } from '@/lib/email'
import { assignDocumentNumber } from '@/lib/document-numbers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { proposalId } = await req.json()

    if (!proposalId) {
      return NextResponse.json({ error: 'proposalId is required' }, { status: 400 })
    }

    const { data: proposal, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', proposalId)
      .single()

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    if (proposal.status === 'sent') {
      return NextResponse.json({ success: true, alreadySent: true })
    }

    // Assign PRO-YYYY-NNN number at send time (drafts have no number)
    let documentNumber = proposal.document_number
    if (!documentNumber) {
      documentNumber = await assignDocumentNumber(
        proposal.user_id,
        'proposal',
        proposalId
      )
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update({ status: 'sent' })
      .eq('id', proposalId)

    if (updateError) {
      console.error('Status update error:', updateError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    const proposalLink = `${process.env.NEXT_PUBLIC_APP_URL}/p/${proposalId}`
    try {
      await sendProposalSentEmail({
        clientEmail: proposal.client_email,
        clientName: proposal.client_name || proposal.client_email,
        businessName: proposal.business_name || 'Your service provider',
        proposalLink,
        serviceDescription:
          proposal.form_data?.serviceDescription ||
          proposal.generated_content?.subject ||
          'Professional Services',
        amount: parseFloat(String(proposal.price).replace(/,/g, '')) || 0,
      })
      console.log('Proposal email sent to:', proposal.client_email)
    } catch (emailError) {
      console.error('Email sending failed (non-fatal):', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send proposal error:', error)
    return NextResponse.json({ error: 'Failed to send proposal' }, { status: 500 })
  }
}
