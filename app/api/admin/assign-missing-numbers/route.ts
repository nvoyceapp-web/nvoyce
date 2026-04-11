import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Bulk assign document numbers to documents that don't have one yet.
 * For each user + doc_type + year combination, assigns INV-YYYY-NNN or PRO-YYYY-NNN
 * sequentially by created_at date.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get all documents for this user that don't have a number yet
    const { data: docs, error: fetchError } = await supabase
      .from('documents')
      .select('id, doc_type, created_at, document_number')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError
    if (!docs || docs.length === 0) {
      return NextResponse.json({ assigned: 0, message: 'No documents found' })
    }

    // Group by doc_type and year, track sequence counters
    const counters: Record<string, number> = {}
    const updates: Array<{ id: string; number: string }> = []

    for (const doc of docs) {
      // Skip if already has a number
      if (doc.document_number) continue

      const year = new Date(doc.created_at).getFullYear()
      const prefix = doc.doc_type === 'invoice' ? 'INV' : 'PRO'
      const key = `${prefix}-${year}`

      // Increment counter for this prefix+year combo
      counters[key] = (counters[key] || 0) + 1
      const sequence = counters[key]
      const documentNumber = `${prefix}-${year}-${String(sequence).padStart(3, '0')}`

      updates.push({ id: doc.id, number: documentNumber })
    }

    // Batch update all documents
    if (updates.length === 0) {
      return NextResponse.json({ assigned: 0, message: 'All documents already have numbers' })
    }

    // Update each document (Supabase doesn't support batch updates easily, so we loop)
    for (const update of updates) {
      const { error } = await supabase
        .from('documents')
        .update({ document_number: update.number })
        .eq('id', update.id)

      if (error) {
        console.error(`Failed to update ${update.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      assigned: updates.length,
      message: `Assigned numbers to ${updates.length} documents`,
    })
  } catch (err) {
    console.error('Error assigning numbers:', err)
    return NextResponse.json(
      { error: 'Failed to assign document numbers' },
      { status: 500 }
    )
  }
}
