import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// GET /api/portal/[token]
// Public endpoint — no auth required. Returns all sent documents for this portal token.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Look up the portal
  const { data: portal, error: portalError } = await supabaseServer
    .from('client_portals')
    .select('user_id, client_email')
    .eq('token', token)
    .single()

  if (portalError || !portal) {
    return NextResponse.json({ error: 'Portal not found' }, { status: 404 })
  }

  // Fetch the freelancer's business name from user_settings
  const { data: settings } = await supabaseServer
    .from('user_settings')
    .select('business_name')
    .eq('user_id', portal.user_id)
    .single()

  // Fetch all non-draft documents sent to this client email by this freelancer
  const { data: documents, error: docsError } = await supabaseServer
    .from('documents')
    .select('id, doc_type, doc_number, client_name, status, price, amount_paid, created_at, generated_content')
    .eq('user_id', portal.user_id)
    .eq('client_email', portal.client_email)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  if (docsError) return NextResponse.json({ error: docsError.message }, { status: 500 })

  return NextResponse.json({
    clientEmail: portal.client_email,
    businessName: settings?.business_name || 'Your Freelancer',
    documents: documents || [],
  })
}
