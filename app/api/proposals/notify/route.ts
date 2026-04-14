import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabase-server'
import { sendProposalAcceptedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { proposalId, action } = await req.json()

    if (!proposalId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Only send freelancer notification for accepted proposals
    // (declined is informational — no email for now)
    if (action !== 'accepted') {
      return NextResponse.json({ success: true, message: 'No notification needed for declined proposals' })
    }

    // Fetch the proposal to get user_id, client info, amount, document_number
    const { data: proposal, error: fetchError } = await supabaseServer
      .from('documents')
      .select('user_id, client_name, price, document_number')
      .eq('id', proposalId)
      .single()

    if (fetchError || !proposal) {
      console.error('Failed to fetch proposal for notification:', fetchError)
      return NextResponse.json({ success: true, message: 'Proposal not found — notification skipped' })
    }

    // Get freelancer's email from Clerk
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(proposal.user_id)
    const primary = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)

    if (!primary?.emailAddress) {
      console.error('No primary email found for user:', proposal.user_id)
      return NextResponse.json({ success: true, message: 'Freelancer email not found — notification skipped' })
    }

    await sendProposalAcceptedEmail({
      freelancerEmail: primary.emailAddress,
      freelancerName: user.firstName || 'there',
      clientName: proposal.client_name || 'Your client',
      amount: proposal.price,
      proposalNumber: proposal.document_number || proposalId,
      dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents/${proposalId}`,
      userId: proposal.user_id,
    })

    return NextResponse.json({ success: true, message: 'Proposal accepted notification sent' })
  } catch (error) {
    console.error('Error sending proposal notification:', error)
    // Non-blocking — don't fail the proposal acceptance flow
    return NextResponse.json({ success: true, message: 'Notification delivery failed (non-fatal)' })
  }
}
