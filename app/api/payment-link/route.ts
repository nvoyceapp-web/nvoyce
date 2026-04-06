import { createPaymentLink } from '@/lib/stripe'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId, amount, description, clientEmail } = await req.json()

    if (!documentId || !amount || !description || !clientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const paymentLink = await createPaymentLink({
      documentId,
      amount,
      description,
      clientEmail,
    })

    return NextResponse.json({ paymentLink })
  } catch (error) {
    console.error('Payment link error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
