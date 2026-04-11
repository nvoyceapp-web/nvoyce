import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_STATUSES = ['draft', 'sent', 'partially_paid', 'fully_paid']

export async function POST(req: NextRequest) {
  try {
    const { documentId, status } = await req.json()

    if (!documentId || !status) {
      return NextResponse.json({ error: 'documentId and status are required' }, { status: 400 })
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 })
    }

    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, doc_type, status')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Only invoices can be manually marked paid
    if (document.doc_type === 'proposal' && status === 'fully_paid') {
      return NextResponse.json({ error: 'Proposals cannot be marked as paid' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update({ status })
      .eq('id', documentId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
