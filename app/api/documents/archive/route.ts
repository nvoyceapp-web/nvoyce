import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { documentId, action } = await req.json()

    if (!documentId || !action) {
      return NextResponse.json({ error: 'documentId and action are required' }, { status: 400 })
    }

    if (action !== 'archive' && action !== 'unarchive') {
      return NextResponse.json({ error: 'action must be archive or unarchive' }, { status: 400 })
    }

    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, doc_type, status, is_archived')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const isInvoice = document.doc_type === 'invoice'
    const isProposal = document.doc_type === 'proposal'

    if (action === 'archive') {
      if (isInvoice && document.status !== 'fully_paid') {
        return NextResponse.json({ error: 'Only fully paid invoices can be archived' }, { status: 400 })
      }
      if (isProposal && document.status !== 'accepted') {
        return NextResponse.json({ error: 'Only accepted proposals can be archived' }, { status: 400 })
      }
    }

    if (action === 'unarchive' && !document.is_archived) {
      return NextResponse.json({ error: 'Document is not archived' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update({ is_archived: action === 'archive' })
      .eq('id', documentId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    return NextResponse.json({ success: true, archived: action === 'archive' })
  } catch (error) {
    console.error('Archive error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
