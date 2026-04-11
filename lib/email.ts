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
      subject: 'Welcome to Nvoyce! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);">
            <img src="${logoUrl}" alt="Nvoyce" style="max-width: 160px; height: auto;" />
            <p style="margin: 12px 0 0 0; color: #ffffff; font-size: 13px; font-weight: 500;">We do the hard stuff. You get paid.</p>
          </div>
          <div style="padding: 30px 20px;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #1f2937; font-weight: bold;">Welcome to Nvoyce, ${userName}! 🎉</p>
            <p style="margin: 0 0 30px 0; font-size: 14px; color: #374151; line-height: 1.6;">You're all set. Start creating professional invoices and proposals in seconds.</p>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
              <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; color: #1f2937;">Here's what you can do:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 2;">
                <li>✨ Generate professional invoices with AI (30 seconds)</li>
                <li>💼 Create proposals and track acceptance</li>
                <li>💰 Send invoices with built-in payment links</li>
                <li>📊 Track payment status and get paid faster</li>
                <li>🤖 Smart recommendations on overdue invoices</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 0 0 30px 0;">
              <a href="${appUrl}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #f97316; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Get Started → Create Your First Invoice</a>
            </div>
            <div style="background-color: #f3e8ff; padding: 20px; border-radius: 8px; margin: 0 0 30px 0; border-left: 4px solid #7c3aed;">
              <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #7c3aed;">What's Next?</h4>
              <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 13px; line-height: 1.8;">
                <li>Complete your business profile</li>
                <li>Create your first invoice</li>
                <li>Share it with a client and get paid</li>
              </ol>
            </div>
            <p style="margin: 0 0 30px 0; font-size: 13px; color: #6b7280;">
              Questions? Reply to this email or visit our help center. We're here to help you get paid faster.
            </p>
          </div>
          <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 Nvoyce. All rights reserved.</p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #d1d5db;">We do the hard stuff. You get paid.</p>
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