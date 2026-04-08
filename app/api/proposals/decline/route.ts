import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendProposalDeclinedEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const userId = 'test-user'
  const body = await req.json()
  const { proposalId } = body

  try {
    // Fetch proposal details for email
    const { data: proposalData, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', proposalId)
      .single()

    if (fetchError || !proposalData) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Update proposal status to declined
    const { error } = await supabase
      .from('documents')
      .update({ status: 'declined' })
      .eq('id', proposalId)

    if (error) {
      console.error('Supabase update error:', error)
      throw error
    }

    // Send decline email to freelancer
    try {
      const freelancerName = proposalData.business_name || 'Freelancer'
      const clientName = proposalData.client_name || 'Client'
      const freelancerEmail = proposalData.user_email || proposalData.form_data?.businessEmail

      if (freelancerEmail) {
        await sendProposalDeclinedEmail({
          freelancerEmail: freelancerEmail,
          freelancerName: freelancerName,
          clientName: clientName,
        })
        console.log('Decline email sent to:', freelancerEmail)
      }
    } catch (emailError) {
      console.error('Error sending decline email:', emailError)
      // Don't fail the response - proposal was already declined
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Decline error:', err)
    return NextResponse.json(
      { error: 'Failed to decline proposal' },
      { status: 500 }
    )
  }
}