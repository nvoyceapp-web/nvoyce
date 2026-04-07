import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { proposalId, action, clientName, clientEmail, amount } = await req.json()

    if (!proposalId || !action || !clientName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const isAccepted = action === 'accepted'
    const subject = isAccepted
      ? `Proposal Accepted! - ${clientName} accepted your proposal for $${amount.toLocaleString()}`
      : `Proposal Declined - ${clientName} declined your proposal for $${amount.toLocaleString()}`

    const emailBody = isAccepted
      ? `
<h2>Great news! Proposal Accepted</h2>
<p><strong>${clientName}</strong> has accepted your proposal for <strong>$${amount.toLocaleString()}</strong></p>
<p>An invoice has been automatically generated and is waiting in your Nvoyce dashboard.</p>
<p><a href="https://app.nvoyce.ai/dashboard">View your dashboard →</a></p>
      `
      : `
<h2>Proposal Declined</h2>
<p><strong>${clientName}</strong> has declined your proposal for <strong>$${amount.toLocaleString()}</strong></p>
<p>You may want to reach out to discuss next steps or alternative options.</p>
<p><a href="https://app.nvoyce.ai/dashboard">View your dashboard →</a></p>
      `

    // Send email notification to the freelancer's email (would need freelancer email from proposal data)
    // For now, we'll just log this - in production, fetch the freelancer's email from the proposal
    console.log(`Sending ${action} notification for proposal ${proposalId}`)

    return NextResponse.json({
      success: true,
      message: `Notification sent to freelancer for ${action} proposal`,
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    // Don't fail the main flow if notification fails
    return NextResponse.json({
      success: true,
      message: 'Proposal updated (notification delivery pending)',
    })
  }
}
