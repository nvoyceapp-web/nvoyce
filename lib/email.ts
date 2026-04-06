import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
      from: 'invoices@nvoyce.ai',
      to: clientEmail,
      subject: `Invoice from ${businessName}`,
      html: `
        <h2>Invoice from ${businessName}</h2>
        <p>Hi ${clientName},</p>
        <p>Your invoice for $${amount.toFixed(2)} is ready.</p>
        <p>
          <a href="${invoiceLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-right: 12px;">
            View Invoice
          </a>
          <a href="${paymentLink}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px;">
            Pay Now
          </a>
        </p>
        <p>Thank you for your business!</p>
      `,
    })

    return result
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}
