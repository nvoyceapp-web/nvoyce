import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPaymentLink } from '@/lib/stripe'
import { sendInvoiceEmail } from '@/lib/email'
import { assignDocumentNumber } from '@/lib/document-numbers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { invoiceId } = await req.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })
    }

    const { data: invoice, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'sent') {
      return NextResponse.json({ success: true, alreadySent: true })
    }

    // Assign INV-YYYY-NNN number at send time (not at draft creation)
    let documentNumber = invoice.document_number
    if (!documentNumber) {
      documentNumber = await assignDocumentNumber(invoice.user_id, 'invoice', invoiceId)
    }

    // Create Stripe payment link
    let paymentLink = invoice.stripe_payment_link || ''
    if (!paymentLink) {
      try {
        paymentLink = await createPaymentLink({
          documentId: invoiceId,
          amount: invoice.price,
          description: `Invoice from ${invoice.business_name}`,
          clientEmail: invoice.client_email,
        })
        await supabase
          .from('documents')
          .update({ stripe_payment_link: paymentLink })
          .eq('id', invoiceId)
      } catch (paymentError) {
        console.error('Payment link creation error (non-fatal):', paymentError)
      }
    }

    // Update status to sent
    const { error: updateError } = await supabase
      .from('documents')
      .update({ status: 'sent' })
      .eq('id', invoiceId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // Send email to client
    const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents/${invoiceId}`
    try {
      await sendInvoiceEmail({
        clientEmail: invoice.client_email,
        clientName: invoice.client_name,
        invoiceLink,
        paymentLink,
        businessName: invoice.business_name,
        amount: invoice.price,
        invoiceNumber: documentNumber,
        dueDate: invoice.generated_content?.dueDate,
      })
      console.log('Invoice sent to:', invoice.client_email, 'as', documentNumber)
    } catch (emailError) {
      console.error('Email sending failed (non-fatal):', emailError)
    }

    return NextResponse.json({ success: true, documentNumber, paymentLink })
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 })
  }
}
