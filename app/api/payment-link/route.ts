import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPaymentLink } from '@/lib/stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { documentId } = await req.json()

  // Fetch the document
  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId) // security: users can only access their own docs
    .single()

  if (error || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Don't create a new link if one already exists
  if (doc.stripe_payment_link) {
    return NextResponse.json({ url: doc.stripe_payment_link })
  }

  try {
    const content = doc.generated_content
    const description = `${content.documentNumber} — ${doc.doc_type} from ${doc.business_name}`

    // Create the Stripe payment link
    const paymentUrl = await createPaymentLink({
      documentId,
      amount: doc.price,
      description,
      clientEmail: doc.client_email,
    })

    // Save the payment link URL to the document
    await supabase
      .from('documents')
      .update({
        stripe_payment_link: paymentUrl,
        status: 'sent',
      })
      .eq('id', documentId)

    return NextResponse.json({ url: paymentUrl })
  } catch (err) {
    console.error('Payment link error:', err)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
