import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Use Resend's onboarding domain for testing, or your verified domain in production
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'

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
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: `Invoice from ${businessName}`,
      html: `
        <h2>Invoice from ${businessName}</h2>
        <p>Hi ${clientName},</p>
        <p>Your invoice for $${amount.toFixed(2)} is ready.</p>
        <p>
          <a href="${invoiceLink}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; margin-right: 12px; font-weight: bold;">
            View Invoice
          </a>
          <a href="${paymentLink}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Pay Now
          </a>
        </p>
        <p>Thank you for your business!</p>
      `,
    })

    console.log('Invoice email sent successfully:', result.id)
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
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Welcome to Nvoyce! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">Welcome to Nvoyce, ${userName}!</h1>
          
          <p>You're all set. Start creating professional invoices in seconds.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #374151; margin-top: 0;">Here's what you can do:</h2>
            <ul style="color: #4b5563;">
              <li>✨ Generate professional invoices with AI (30 seconds)</li>
              <li>💰 Send invoices with built-in payment links</li>
              <li>📊 Track payment status and get paid faster</li>
              <li>🤖 Get smart recommendations on overdue invoices</li>
            </ul>
          </div>
          
          <p style="margin-bottom: 30px;">
            <a href="https://app.nvoyce.ai/dashboard/new" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Create Your First Invoice
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            Questions? Reply to this email or check out our docs.
          </p>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Nvoyce — Fast payment for gig workers
          </p>
        </div>
      `,
    })

    console.log('Welcome email sent successfully:', result.id)
    return result
  } catch (error) {
    console.error('Welcome email sending error:', error)
    throw error
  }
}
