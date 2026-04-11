import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { documentIds } = await req.json()

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'documentIds array is required' }, { status: 400 })
    }

    // Verify all documents belong to this user before deleting
    const { data: docs, error: fetchError } = await supabase
      .from('documents')
      .select('id, user_id')
      .in('id', documentIds)

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to verify documents' }, { status: 500 })
    }

    // Check ownership
    const unauthorized = docs?.some((doc) => doc.user_id !== userId)
    if (unauthorized) {
      return NextResponse.json({ error: 'Unauthorized: cannot delete documents you do not own' }, { status: 403 })
    }

    // Delete the documents
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .in('id', documentIds)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete documents' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: documentIds.length,
      message: `Deleted ${documentIds.length} document(s)`,
    })
  } catch (err) {
    console.error('Delete documents error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
