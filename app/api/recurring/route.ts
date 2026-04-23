import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabase-server'

function nextDueDate(interval: string, from: Date = new Date()): string {
  const d = new Date(from)
  switch (interval) {
    case 'weekly':    d.setDate(d.getDate() + 7); break
    case 'biweekly':  d.setDate(d.getDate() + 14); break
    case 'monthly':   d.setMonth(d.getMonth() + 1); break
    case 'quarterly': d.setMonth(d.getMonth() + 3); break
  }
  return d.toISOString().slice(0, 10)
}

// GET — list recurring configs for user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseServer
    .from('recurring_configs')
    .select('*, documents:source_document_id(client_name, document_number, price, currency)')
    .eq('user_id', userId)
    .eq('active', true)
    .order('next_due_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ configs: data })
}

// POST — create a recurring config
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId, interval } = await req.json()
  if (!documentId || !interval) {
    return NextResponse.json({ error: 'documentId and interval required' }, { status: 400 })
  }

  // Verify the document belongs to this user
  const { data: doc, error: docError } = await supabaseServer
    .from('documents')
    .select('id, user_id, doc_type')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single()

  if (docError || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  if (doc.doc_type !== 'invoice') return NextResponse.json({ error: 'Only invoices can be set as recurring' }, { status: 400 })

  // Upsert (one config per document)
  const { data, error } = await supabaseServer
    .from('recurring_configs')
    .upsert({
      user_id: userId,
      source_document_id: documentId,
      interval,
      next_due_date: nextDueDate(interval),
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'source_document_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}
