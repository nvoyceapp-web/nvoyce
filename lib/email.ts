import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'

export async function sendWelcomeEmail({
  userEmail,
  userName,
  dashboardLink,
}: {
  userEmail: string
  userName: string
  dashboardLink: string
}) {
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `Welcome to Nvoyce, ${userName}! 🎉`,
    html: `<h1 style="color: #7c3aed;">Welcome to Nvoyce!</h1>
           <p>Hi <strong>${userName}</strong>,</p>
           <p>Your account is ready. Start creating professional proposals and invoices in minutes.</p>
           <a href="${dashboardLink}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Go to Dashboard</a>
           <p style="margin-top: 40px; color: #666; font-size: 14px;">Questions? We're here to help.</p>`,
  })
  return result
}

export async function sendInvoiceEmail({
  clientEmail,
  clientName,
  invoiceLink,
  paymentLink,
  businessName,
  amount,
}: {
  clientEmail: string
  clientName: string
  invoiceLink: string
  paymentLink: string
  businessName: string
  amount: number
}) {
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: clientEmail,
    subject: `Invoice from ${businessName}`,
    html: `<h1 style="color: #7c3aed;">Invoice from ${businessName}</h1>
           <p>Hi <strong>${clientName}</strong>,</p>
           <p>An invoice for <strong>$${amount.toFixed(2)}</strong> is ready for payment.</p>
           <div style="margin: 30px 0;">
             <a href="${invoiceLink}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin-right: 10px;">View Invoice</a>
             <a href="${paymentLink}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px;">Pay Now</a>
           </div>
           <p style="margin-top: 40px; color: #666; font-size: 14px;">Invoice details are in the link above.</p>`,
  })
  return result
}

export async function sendProposalSentEmail({
  clientEmail,
  clientName,
  businessName,
  proposalLink,
  serviceDescription,
  amount,
}: {
  clientEmail: string
  clientName: string
  businessName: string
  proposalLink: string
  serviceDescription: string
  amount: number
}) {
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: clientEmail,
    subject: `Proposal from ${businessName} for ${serviceDescription}`,
    html: `<h1 style="color: #7c3aed;">New Proposal from ${businessName}</h1>
           <p>Hi <strong>${clientName}</strong>,</p>
           <p><strong>${businessName}</strong> sent you a proposal for <strong>${serviceDescription}</strong></p>
           <p style="font-size: 18px; margin: 20px 0;"><strong>Proposed Amount: $${amount.toFixed(2)}</strong></p>
           <a href="${proposalLink}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">View & Respond to Proposal</a>
           <p style="margin-top: 40px; color: #666; font-size: 14px;">You can accept or decline this proposal from the link above.</p>`,
  })
  return result
}

export async function sendProposalAcceptedEmail({
  freelancerEmail,
  freelancerName,
  clientName,
  amount,
  dashboardLink,
}: {
  freelancerEmail: string
  freelancerName: string
  clientName: string
  amount: number
  dashboardLink: string
}) {
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: freelancerEmail,
    subject: `Great news! ${clientName} accepted your proposal 🎉`,
    html: `<h1 style="color: #10b981;">Great news, ${freelancerName}!</h1>
           <p><strong>${clientName}</strong> accepted your proposal for <strong>$${amount.toFixed(2)}</strong></p>
           <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0;">
             <p style="color: #10b981; font-size: 16px;"><strong>✓ Invoice Auto-Generated</strong></p>
             <p>A professional invoice has been automatically created and sent to your client.</p>
           </div>
           <a href="${dashboardLink}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">View in Dashboard</a>
           <p style="margin-top: 40px; color: #666; font-size: 14px;">Track payment status from your dashboard.</p>`,
  })
  return result
}

export async function sendProposalDeclinedEmail({
  freelancerEmail,
  freelancerName,
  clientName,
}: {
  freelancerEmail: string
  freelancerName: string
  clientName: string
}) {
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: freelancerEmail,
    subject: `Update on your proposal to ${clientName}`,
    html: `<h1 style="color: #7c3aed;">Proposal Update</h1>
           <p>Hi <strong>${freelancerName}</strong>,</p>
           <p><strong>${clientName}</strong> has declined your proposal.</p>
           <p style="margin-top: 20px; color: #666;">This doesn't mean the end of the conversation. Consider reaching out to discuss alternatives or modifications.</p>
           <a href="http://localhost:3000/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Back to Dashboard</a>
           <p style="margin-top: 40px; color: #666; font-size: 14px;">Keep exploring opportunities!</p>`,
  })
  return result
}