import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserLogo(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('logo_url')
      .eq('user_id', userId)
      .single()

    if (!error && data?.logo_url) {
      return data.logo_url
    }
  } catch (err) {
    console.error('Error fetching user logo:', err)
  }
  return null
}

export async function sendInvoiceEmail({
  clientEmail,
  clientName,
  invoiceLink,
  paymentLink,
  businessName,
  amount,
  invoiceNumber = 'INV-2026-001',
  dueDate,
  userId,
}: {
  clientEmail: string
  clientName: string
  invoiceLink: string
  paymentLink: string
  businessName: string
  amount: number
  invoiceNumber?: string
  dueDate?: string
  userId?: string
}) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nvoyce.ai'
    let logoUrl = `${appUrl}/logo.png`

    // Try to get user's logo if userId provided
    if (userId) {
      const userLogo = await getUserLogo(userId)
      if (userLogo) {
        logoUrl = userLogo
      }
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: `Invoice from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #e5e7eb;">
            <img src="${logoUrl}" alt="Nvoyce" style="max-width: 320px; height: auto; display: block; margin: 0 auto;" />
            <div style="margin-top: 15px; text-align: center;">
              <div style="display: inline-block; background-color: #f0fdf4; padding: 8px 16px; border-radius: 4px; border: 1px solid #d1fae5;">
                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #047857;">✓ Invoice Ready for Payment</p>
              </div>
            </div>
          </div>
          <div style="padding: 30px 20px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #1f2937;">Hi ${clientName},</p>
            <p style="margin: 0 0 30px 0; font-size: 14px; color: #374151; line-height: 1.6;">Your invoice from ${businessName} is ready. Please see the details below and proceed with payment.</p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px; margin: 0 0 30px 0;">
              <div style="display: flex; justify-content: space-between; margin: 0 0 12px 0; padding-bottom: 12px; border-bottom: 1px solid #d1fae5;">
                <div>
                  <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Number</p>
                  <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1f2937;">${invoiceNumber}</p>
                </div>
                <div>
                  <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Date</p>
                  <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1f2937;">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div>
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</p>
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1f2937;">${dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #d1fae5;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #f97316;">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 4px; margin: 0 0 30px 0;">
              <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; color: #7c3aed;">How to Pay</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 13px; line-height: 1.8;">
                <li style="margin-bottom: 6px;">Pay securely with a credit card</li>
                <li style="margin-bottom: 6px;">Bank transfer available</li>
                <li>Payment is due upon receipt</li>
              </ul>
            </div>
            <div style="background-color: #f3f4f6; padding: 30px 20px; border-radius: 4px; margin: 0 0 30px 0; text-align: center;">
              <p style="margin: 0 0 15px 0; font-size: 15px; font-weight: bold; color: #1f2937;">Complete Payment Securely</p>
              <a href="${paymentLink}" style="display: inline-block; padding: 14px 40px; background-color: #f97316; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Pay Now</a>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #6b7280;">Click the button above to view your invoice and complete payment securely.</p>
            </div>
            <p style="margin: 0 0 30px 0; font-size: 13px; color: #6b7280;">
              Questions about this invoice? Contact ${businessName} directly or reply to this email.
            </p>
          </div>
          <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
            <img src="${appUrl}/logo-icon.png" alt="Nvoyce" style="width: 28px; height: 28px; object-fit: contain; margin: 0 auto 10px; display: block; opacity: 0.7;" />
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 Nvoyce. All rights reserved.</p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #d1d5db;">Fast invoicing for gig workers</p>
          </div>
        </div>
      `,
    })

    if (result.error) {
      console.error('Invoice email error:', result.error)
      throw result.error
    }

    console.log('Invoice email sent successfully:', result.data?.id)
    return result
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}

export async function sendWelcomeEmail({
  userEmail,
  userName,
}: {
  userEmail: string
  userName: string
}) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nvoyce.ai'
    const logoUrl = `${appUrl}/logo.png`

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Welcome to Nvoyce — your 7-day Pro trial starts now',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="text-align: center; padding: 30px 20px; background-color: #0d1b2a;">
            <img src="${logoUrl}" alt="Nvoyce" style="max-width: 160px; height: auto;" />
            <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 13px;">We do the hard stuff. You get paid.</p>
          </div>

          <div style="padding: 30px 20px;">
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937; font-weight: bold;">Welcome, ${userName}!</p>
            <p style="margin: 0 0 24px 0; font-size: 14px; color: #374151; line-height: 1.6;">
              No one started freelancing to chase invoices. We built Nvoyce so you don't have to.
            </p>

            <!-- Trial banner -->
            <div style="background-color: #0d1b2a; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px 0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; color: #f97316; text-transform: uppercase; letter-spacing: 1px;">Your Pro Trial</p>
              <p style="margin: 0 0 8px 0; font-size: 22px; font-weight: bold; color: #ffffff;">7 days of full Pro access</p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">No credit card needed. Ends in 7 days.</p>
            </div>

            <!-- What's included -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
              <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #1f2937;">Everything included in your trial:</p>
              <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 2.2;">
                <li>⚡ AI invoices & proposals in 30 seconds</li>
                <li>📬 Invoice tracking — sent, viewed, paid</li>
                <li>💸 Built-in Stripe payment links</li>
                <li>🔁 Automated follow-up email sequences</li>
                <li>🤖 Payme — smart assistant for overdue invoices</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 0 0 24px 0;">
              <a href="${appUrl}/dashboard" style="display: inline-block; padding: 14px 36px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                Create Your First Invoice →
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #1f2937;">What happens after 7 days?</p>
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                You'll move to the Free plan (3 docs/month). We'll remind you before your trial ends so you're never caught off guard. Upgrade to Pro anytime from your <a href="${appUrl}/dashboard/settings" style="color: #f97316; text-decoration: none;">settings</a>.
              </p>
            </div>
          </div>

          <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">© 2026 Nvoyce · We do the hard stuff. You get paid.</p>
          </div>
        </div>
      `,
    })

    if (result.error) {
      console.error('Welcome email error:', result.error)
      throw result.error
    }

    console.log('Welcome email sent successfully:', result.data?.id)
    return result
  } catch (error) {
    console.error('Welcome email sending error:', error)
    throw error
  }
}

export async function sendProposalSentEmail({
  clientEmail,
  clientName,
  businessName,
  proposalLink,
  serviceDescription,
  amount,
  timeline = '2 weeks',
  userId,
}: {
  clientEmail: string
  clientName: string
  businessName: string
  proposalLink: string
  serviceDescription: string
  amount: number
  timeline?: string
  userId?: string
}) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nvoyce.ai'
    let logoUrl = `${appUrl}/logo.png`

    // Try to get user's logo if userId provided
    if (userId) {
      const userLogo = await getUserLogo(userId)
      if (userLogo) {
        logoUrl = userLogo
      }
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: `Proposal from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="text-align: center; padding: 30px 20px 20px; border-bottom: 1px solid #e5e7eb;">
            <img src="${logoUrl}" alt="Nvoyce" style="max-width: 320px; height: auto;" />
            <p style="margin: 15px 0 0 0; color: #374151; font-size: 14px;">Professional Proposals from <strong>${businessName}</strong></p>
          </div>
          <div style="padding: 30px 20px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #1f2937;">Hi ${clientName},</p>
            <p style="margin: 0 0 30px 0; font-size: 14px; color: #374151; line-height: 1.6;">We're excited to share a proposal for your project. Please review the details below and let us know if you have any questions.</p>
            <div style="background-color: #f3e8ff; border-left: 4px solid #7c3aed; padding: 20px; border-radius: 4px; margin: 0 0 30px 0;">
              <div style="margin: 0 0 12px 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Service</p>
                <p style="margin: 0; font-size: 15px; font-weight: bold; color: #1f2937;">${serviceDescription}</p>
              </div>
              <div style="margin: 0 0 12px 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Proposed Amount</p>
                <p style="margin: 0; font-size: 20px; font-weight: bold; color: #f97316;">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div style="margin: 0 0 12px 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Timeline</p>
                <p style="margin: 0; font-size: 14px; color: #374151;">${timeline}</p>
              </div>
              <div style="margin: 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Valid Until</p>
                <p style="margin: 0; font-size: 14px; color: #374151;">${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
            <div style="margin: 0 0 30px 0;">
              <h3 style="margin: 0 0 15px 0; font-size: 15px; font-weight: bold; color: #1f2937;">What's Included</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                <li style="margin-bottom: 8px;">Professional service delivery</li>
                <li style="margin-bottom: 8px;">Communication and support</li>
                <li style="margin-bottom: 8px;">Quality assurance</li>
                <li>On-time delivery</li>
              </ul>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 4px; margin: 0 0 30px 0; text-align: center;">
              <p style="margin: 0 0 15px 0; font-size: 15px; font-weight: bold; color: #1f2937;">Ready to Move Forward?</p>
              <a href="${proposalLink}" style="display: inline-block; padding: 14px 32px; background-color: #f97316; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; margin: 0 0 12px 0;">Review & Respond to Proposal</a>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">You can accept this proposal, request changes, or decline. ${businessName} will be notified of your response.</p>
            </div>
            <p style="margin: 0 0 30px 0; font-size: 13px; color: #6b7280;">
              Have questions? Reply to this email or contact ${businessName} directly.
            </p>
          </div>
          <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
            <img src="${appUrl}/logo-icon.png" alt="Nvoyce" style="width: 28px; height: 28px; object-fit: contain; margin: 0 auto 10px; display: block; opacity: 0.7;" />
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 Nvoyce. All rights reserved.</p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #d1d5db;">Fast invoicing for gig workers</p>
          </div>
        </div>
      `,
    })

    if (result.error) {
      console.error('Proposal sent email error:', result.error)
      throw result.error
    }

    console.log('Proposal sent email delivered:', result.data?.id)
    return result
  } catch (error) {
    console.error('Proposal sent email error:', error)
    throw error
  }
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
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nvoyce.ai'
    const logoUrl = `${appUrl}/logo.png`

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: freelancerEmail,
      subject: `Great news! ${clientName} accepted your proposal 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <img src="${logoUrl}" alt="Nvoyce" style="max-width: 140px; height: auto; opacity: 0.9;" />
          </div>
          <div style="padding: 30px 20px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 28px;">🎉</p>
            <h1 style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold; color: #1f2937;">Great news, ${freelancerName}!</h1>
            <p style="margin: 0 0 30px 0; font-size: 16px; color: #374151; line-height: 1.6;"><strong>${clientName}</strong> accepted your proposal for <strong style="color: #f97316;">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 0 0 30px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #065f46; font-weight: bold;">✓ Invoice Auto-Generated</p>
              <p style="margin: 0; font-size: 13px; color: #047857; line-height: 1.6;">An invoice has been automatically created and sent to your client. Payment will be due on the agreed date.</p>
            </div>
            <a href="${dashboardLink}" style="display: inline-block; padding: 14px 40px; background-color: #f97316; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; margin: 0 0 20px 0;">View Invoice in Dashboard</a>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
              <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #1f2937;">What Happens Next?</h3>
              <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 12px; line-height: 2; text-align: left;">
                <li>Invoice is sent to ${clientName}</li>
                <li>Payment is due on the invoice date</li>
                <li>You'll get notified when paid</li>
              </ol>
            </div>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              Track all your payments and proposals in your Nvoyce dashboard.
            </p>
          </div>
          <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
            <img src="${appUrl}/logo-icon.png" alt="Nvoyce" style="width: 28px; height: 28px; object-fit: contain; margin: 0 auto 8px; display: block; opacity: 0.7;" />
            <p style="margin: 0; font-size: 11px; color: #d1d5db;">© 2026 Nvoyce. We do the hard stuff. You get paid.</p>
          </div>
        </div>
      `,
    })

    if (result.error) {
      console.error('Proposal accepted email error:', result.error)
      throw result.error
    }

    console.log('Proposal accepted email sent:', result.data?.id)
    return result
  } catch (error) {
    console.error('Proposal accepted email error:', error)
    throw error
  }
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
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nvoyce.ai'
    const logoUrl = `${appUrl}/logo.png`

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: freelancerEmail,
      subject: `Proposal update: ${clientName} declined your proposal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="text-align: center; padding: 30px 20px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <img src="${logoUrl}" alt="Nvoyce" style="max-width: 140px; height: auto;" />
          </div>
          <div style="padding: 30px 20px;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #1f2937;">Hi ${freelancerName},</p>
            <p style="margin: 0 0 30px 0; font-size: 15px; color: #374151; line-height: 1.6;">Unfortunately, <strong>${clientName}</strong> declined your proposal.</p>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 0 0 30px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #92400e;">This doesn't mean the end</p>
              <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.6;">Many successful freelancers follow up with an alternative proposal or reach out to discuss next steps. Don't be discouraged—the next opportunity is just around the corner.</p>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
              <h3 style="margin: 0 0 15px 0; font-size: 13px; font-weight: bold; color: #1f2937;">What You Can Do</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 13px; line-height: 2;">
                <li>Create a new proposal with a different approach</li>
                <li>Reach out to ${clientName} to understand their concerns</li>
                <li>Focus on your other active proposals</li>
              </ul>
            </div>
            <div style="text-align: center;">
              <a href="${appUrl}/dashboard" style="display: inline-block; padding: 12px 32px; background-color: #f97316; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Back to Dashboard</a>
            </div>
          </div>
          <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
            <img src="${appUrl}/logo-icon.png" alt="Nvoyce" style="width: 28px; height: 28px; object-fit: contain; margin: 0 auto 8px; display: block; opacity: 0.7;" />
            <p style="margin: 0; font-size: 11px; color: #d1d5db;">© 2026 Nvoyce. We do the hard stuff. You get paid.</p>
          </div>
        </div>
      `,
    })

    if (result.error) {
      console.error('Proposal declined email error:', result.error)
      throw result.error
    }

    console.log('Proposal declined email sent:', result.data?.id)
    return result
  } catch (error) {
    console.error('Proposal declined email error:', error)
    throw error
  }
}

// ── Trial expiry emails ────────────────────────────────────────────────────

function trialEmailShell(logoUrl: string, appUrl: string, body: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="text-align: center; padding: 30px 20px; background-color: #0d1b2a;">
        <img src="${logoUrl}" alt="Nvoyce" style="max-width: 140px; height: auto;" />
      </div>
      <div style="padding: 30px 20px;">${body}</div>
      <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
        <p style="margin: 0; font-size: 11px; color: #9ca3af;">© 2026 Nvoyce · We do the hard stuff. You get paid.</p>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #d1d5db;">
          <a href="${appUrl}/dashboard/settings" style="color: #f97316; text-decoration: none;">Manage your plan</a>
        </p>
      </div>
    </div>
  `
}

export async function sendTrialWarningEmail({
  userEmail,
  userName,
  daysLeft,
}: {
  userEmail: string
  userName: string
  daysLeft: 2 | 1
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nvoyce.ai'
  const logoUrl = `${appUrl}/logo.png`

  const isLastDay = daysLeft === 1
  const subject = isLastDay
    ? 'Your Nvoyce Pro trial ends tomorrow'
    : 'Your Nvoyce Pro trial ends in 2 days'

  const urgencyColor = isLastDay ? '#ef4444' : '#f97316'
  const urgencyText = isLastDay
    ? 'Last chance — your trial ends tomorrow.'
    : 'Heads up — your trial ends in 2 days.'

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937; font-weight: bold;">Hi ${userName},</p>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #374151; line-height: 1.6;">${urgencyText} After that, you'll drop to the Free plan (3 docs/month).</p>

    <div style="background-color: #fff7ed; border-left: 4px solid ${urgencyColor}; padding: 16px 20px; border-radius: 8px; margin: 0 0 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #92400e;">What you'll lose on the Free plan:</p>
      <ul style="margin: 0; padding-left: 18px; color: #b45309; font-size: 13px; line-height: 2;">
        <li>Unlimited invoices & proposals</li>
        <li>Invoice tracking (sent / viewed / paid)</li>
        <li>Follow-up email sequences</li>
        <li>Client payment portal</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 0 0 24px 0;">
      <a href="${appUrl}/dashboard/settings" style="display: inline-block; padding: 14px 36px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
        Keep Pro — $19.99/mo →
      </a>
    </div>

    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">No commitment. Cancel anytime.</p>
  `

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject,
    html: trialEmailShell(logoUrl, appUrl, body),
  })

  if (result.error) throw result.error
  console.log(`Trial warning (${daysLeft}d) sent to ${userEmail}:`, result.data?.id)
  return result
}

export async function sendTrialExpiredEmail({
  userEmail,
  userName,
}: {
  userEmail: string
  userName: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nvoyce.ai'
  const logoUrl = `${appUrl}/logo.png`

  const body = `
    <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937; font-weight: bold;">Hi ${userName},</p>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #374151; line-height: 1.6;">Your 7-day Pro trial has ended. You're now on the <strong>Free plan</strong> — limited to 3 docs/month.</p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 0 0 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #1f2937;">During your trial you had access to:</p>
      <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 2;">
        <li>✓ Unlimited invoices & proposals</li>
        <li>✓ Invoice tracking (sent / viewed / paid)</li>
        <li>✓ Follow-up email sequences</li>
        <li>✓ Client payment portal</li>
      </ul>
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #6b7280;">All of that is waiting for you when you upgrade.</p>
    </div>

    <div style="text-align: center; margin: 0 0 16px 0;">
      <a href="${appUrl}/dashboard/settings" style="display: inline-block; padding: 14px 36px; background-color: #0d1b2a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
        Upgrade to Pro — $19.99/mo →
      </a>
    </div>

    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">No commitment. Cancel anytime from your settings.</p>
  `

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: "Your Nvoyce Pro trial has ended",
    html: trialEmailShell(logoUrl, appUrl, body),
  })

  if (result.error) throw result.error
  console.log(`Trial expired email sent to ${userEmail}:`, result.data?.id)
  return result
}

export async function sendUpgradeConfirmationEmail({
  userEmail,
  userName,
  plan,
}: {
  userEmail: string
  userName: string
  plan: 'pro' | 'business'
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nvoyce.ai'
  const logoUrl = `${appUrl}/logo.png`
  const planName = plan === 'pro' ? 'Pro' : 'Business'
  const planPrice = plan === 'pro' ? '$19.99' : '$39.99'

  const proFeatures = [
    '⚡ Unlimited invoices & proposals',
    '📬 Invoice tracking — sent, viewed, paid',
    '💸 Built-in Stripe payment links',
    '🔁 Automated follow-up email sequences',
    '🤖 Payme smart assistant',
  ]
  const businessExtras = ['👥 Multiple team members', '🎨 Custom branding', '🚀 Priority support']
  const features = plan === 'business' ? [...proFeatures, ...businessExtras] : proFeatures

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `You're on Nvoyce ${planName} — welcome to unlimited`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="text-align: center; padding: 30px 20px; background-color: #0d1b2a;">
          <img src="${logoUrl}" alt="Nvoyce" style="max-width: 160px; height: auto;" />
          <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 13px;">We do the hard stuff. You get paid.</p>
        </div>

        <div style="padding: 30px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937; font-weight: bold;">You're on ${planName}, ${userName}.</p>
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #374151; line-height: 1.6;">
            No more chasing. No more limits. Here's everything you now have access to.
          </p>

          <div style="background-color: #0d1b2a; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px 0; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; color: #f97316; text-transform: uppercase; letter-spacing: 1px;">Active Plan</p>
            <p style="margin: 0 0 4px 0; font-size: 26px; font-weight: bold; color: #ffffff;">Nvoyce ${planName}</p>
            <p style="margin: 0; font-size: 13px; color: #9ca3af;">${planPrice}/month · Cancel anytime</p>
          </div>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
            <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #1f2937;">What's included:</p>
            <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 2.2;">
              ${features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>

          <div style="text-align: center; margin: 0 0 24px 0;">
            <a href="${appUrl}/dashboard" style="display: inline-block; padding: 14px 36px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
              Go to Dashboard →
            </a>
          </div>

          <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
            Manage your plan anytime from <a href="${appUrl}/dashboard/settings" style="color: #f97316; text-decoration: none;">Settings</a>.
          </p>
        </div>

        <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">© 2026 Nvoyce · Stop chasing. Start getting paid.</p>
        </div>
      </div>
    `,
  })

  if (result.error) throw result.error
  console.log(`Upgrade confirmation sent to ${userEmail}:`, result.data?.id)
  return result
}

export async function sendLaunchAnnouncementEmail({
  userEmail,
  userName,
}: {
  userEmail: string
  userName: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nvoyce.ai'
  const logoUrl = `${appUrl}/logo.png`
  const phUrl = 'https://www.producthunt.com'

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: "Nvoyce just launched on Product Hunt 🚀",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="text-align: center; padding: 30px 20px; background-color: #0d1b2a;">
          <img src="${logoUrl}" alt="Nvoyce" style="max-width: 160px; height: auto;" />
          <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 13px;">We do the hard stuff. You get paid.</p>
        </div>

        <div style="padding: 30px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937; font-weight: bold;">Hey ${userName} — we're live. 🚀</p>
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #374151; line-height: 1.6;">
            Nvoyce just launched publicly on Product Hunt today. You're one of the first people to use it — and that means a lot.
          </p>

          <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #92400e; font-weight: bold;">One small ask 🙏</p>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #b45309; line-height: 1.6;">
              If Nvoyce has saved you time or helped you get paid faster, an upvote on Product Hunt goes a long way. It takes 10 seconds and helps more freelancers find the tool.
            </p>
            <a href="${phUrl}" style="display: inline-block; padding: 12px 28px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
              ▲ Upvote Nvoyce on Product Hunt
            </a>
          </div>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
            <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #1f2937;">What's new since you signed up:</p>
            <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 2.2;">
              <li>📊 Full dashboard with revenue charts and metrics</li>
              <li>🏷️ Subscription plans — Free, Pro ($19.99), Business ($39.99)</li>
              <li>🔔 Automated trial and payment reminder emails</li>
              <li>🎨 Cleaner UI with Space Grotesk typography</li>
              <li>⚡ Faster invoice generation and smarter Payme assistant</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 0 0 24px 0;">
            <a href="${appUrl}/dashboard" style="display: inline-block; padding: 14px 36px; background-color: #0d1b2a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
              Go to Your Dashboard →
            </a>
          </div>

          <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
            Thank you for being here early. Reply to this email anytime — I read every message.
          </p>
        </div>

        <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">© 2026 Nvoyce · Stop chasing. Start getting paid.</p>
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #d1d5db;">
            <a href="${appUrl}/dashboard/settings" style="color: #9ca3af; text-decoration: none;">Manage preferences</a>
          </p>
        </div>
      </div>
    `,
  })

  if (result.error) throw result.error
  console.log(`Launch announcement sent to ${userEmail}:`, result.data?.id)
  return result
}

// Sent to the CLIENT confirming their payment was received (partial or full)
export async function sendPaymentConfirmationEmail({
  clientEmail,
  clientName,
  freelancerName,
  amount,
  totalPaid,
  invoiceTotal,
  documentNumber,
  isPartial = false,
}: {
  clientEmail: string
  clientName: string
  freelancerName: string
  amount: number
  totalPaid: number
  invoiceTotal: number
  documentNumber: string
  isPartial?: boolean
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nvoyce.ai'
  const logoUrl = `${appUrl}/logo.png`
  const remaining = invoiceTotal - totalPaid

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: clientEmail,
    subject: isPartial ? `Partial payment received — ${documentNumber}` : `Payment confirmed — ${documentNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, ${isPartial ? '#f59e0b 0%, #d97706' : '#10b981 0%, #059669'} 100%);">
          <img src="${logoUrl}" alt="Nvoyce" style="max-width: 140px; height: auto; opacity: 0.9;" />
        </div>
        <div style="padding: 40px 30px; text-align: center;">
          <p style="margin: 0 0 12px 0; font-size: 40px;">${isPartial ? '🧾' : '✅'}</p>
          <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: bold; color: #1f2937;">
            ${isPartial ? 'Partial Payment Received' : 'Payment Received'}
          </h1>
          <p style="margin: 0 0 30px 0; font-size: 15px; color: #6b7280;">
            Hi ${clientName}, your payment has been confirmed.
          </p>

          <div style="background-color: ${isPartial ? '#fffbeb' : '#f0fdf4'}; border: 1px solid ${isPartial ? '#fde68a' : '#bbf7d0'}; border-radius: 10px; padding: 24px; margin: 0 0 ${isPartial ? '16px' : '30px'} 0; text-align: left;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">Invoice</td>
                <td style="padding: 6px 0; font-size: 13px; color: #1f2937; font-weight: bold; text-align: right;">${documentNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">Paid to</td>
                <td style="padding: 6px 0; font-size: 13px; color: #1f2937; font-weight: bold; text-align: right;">${freelancerName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">This payment</td>
                <td style="padding: 6px 0; font-size: 15px; color: ${isPartial ? '#d97706' : '#059669'}; font-weight: bold; text-align: right;">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">Total paid so far</td>
                <td style="padding: 6px 0; font-size: 13px; color: #1f2937; font-weight: bold; text-align: right;">$${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr style="border-top: 1px solid ${isPartial ? '#fde68a' : '#bbf7d0'};">
                <td style="padding: 10px 0 4px; font-size: 13px; color: #6b7280;">Invoice total</td>
                <td style="padding: 10px 0 4px; font-size: 13px; color: #1f2937; text-align: right;">$${invoiceTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>

          ${isPartial ? `
          <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 20px; margin: 0 0 30px 0; text-align: left;">
            <p style="margin: 0; font-size: 13px; color: #9a3412;">
              <strong>Remaining balance:</strong> $${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} — please complete payment at your earliest convenience.
            </p>
          </div>` : ''}

          <p style="margin: 0; font-size: 13px; color: #9ca3af;">Keep this email as your payment receipt. Questions? Reply directly to this email.</p>
        </div>
        <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
          <p style="margin: 0; font-size: 11px; color: #d1d5db;">Powered by Nvoyce · nvoyce.ai</p>
        </div>
      </div>
    `,
  })

  if (result.error) throw result.error
  console.log(`Payment confirmation sent to client ${clientEmail}:`, result.data?.id)
  return result
}

// Sent to the FREELANCER notifying them of any payment (partial or full)
export async function sendPaymentReceivedEmail({
  freelancerEmail,
  freelancerName,
  clientName,
  amount,
  totalPaid,
  invoiceTotal,
  documentNumber,
  isPartial = false,
  dashboardLink,
}: {
  freelancerEmail: string
  freelancerName: string
  clientName: string
  amount: number
  totalPaid: number
  invoiceTotal: number
  documentNumber: string
  isPartial?: boolean
  dashboardLink: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nvoyce.ai'
  const logoUrl = `${appUrl}/logo.png`
  const remaining = invoiceTotal - totalPaid

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: freelancerEmail,
    subject: isPartial
      ? `💛 Partial payment — $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} from ${clientName}`
      : `💰 You got paid — $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} from ${clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="text-align: center; padding: 30px 20px; background-color: #0d1b2a;">
          <img src="${logoUrl}" alt="Nvoyce" style="max-width: 140px; height: auto;" />
        </div>
        <div style="padding: 40px 30px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 40px;">${isPartial ? '💛' : '💰'}</p>
          <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #1f2937;">
            ${isPartial ? `Partial payment from ${clientName}` : `You got paid, ${freelancerName}!`}
          </h1>
          <p style="margin: 0 0 30px 0; font-size: 15px; color: #6b7280;">
            <strong>${clientName}</strong> paid <strong>$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> toward invoice <strong>${documentNumber}</strong>.
          </p>

          <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 24px; margin: 0 0 16px 0; text-align: left;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #9a3412;">This payment</td>
                <td style="padding: 6px 0; font-size: 18px; color: #f97316; font-weight: bold; text-align: right;">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #9a3412;">Total paid so far</td>
                <td style="padding: 6px 0; font-size: 13px; color: #1f2937; font-weight: bold; text-align: right;">$${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr style="border-top: 1px solid #fed7aa;">
                <td style="padding: 10px 0 4px; font-size: 13px; color: #9a3412;">Invoice total</td>
                <td style="padding: 10px 0 4px; font-size: 13px; color: #1f2937; text-align: right;">$${invoiceTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>

          ${isPartial ? `
          <div style="background-color: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 14px 20px; margin: 0 0 30px 0; text-align: left;">
            <p style="margin: 0; font-size: 13px; color: #713f12;">
              <strong>$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} still outstanding</strong> — Payme will flag this if it goes overdue.
            </p>
          </div>` : ''}

          <a href="${dashboardLink}" style="display: inline-block; padding: 14px 40px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin: 0 0 30px 0;">View in Dashboard →</a>

          <p style="margin: 0; font-size: 13px; color: #9ca3af;">
            ${isPartial ? `Invoice ${documentNumber} is now marked as Partially Paid.` : `Invoice ${documentNumber} has been automatically marked as Fully Paid.`}
          </p>
        </div>
        <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
          <p style="margin: 0; font-size: 11px; color: #d1d5db;">© 2026 Nvoyce · We do the hard stuff. You get paid.</p>
        </div>
      </div>
    `,
  })

  if (result.error) throw result.error
  console.log(`Payment received notification sent to ${freelancerEmail}:`, result.data?.id)
  return result
}
}
