import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// GET /api/documents/[id] — fetch a single document for the authenticated user
// Used by the Nvoyce mobile app
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ document: data })
}
