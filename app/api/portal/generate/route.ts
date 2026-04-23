import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// POST /api/portal/generate
// Creates (or returns existing) a portal token for a given client email.
// Called from the Clients page when the freelancer clicks "Share portal".
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientEmail } = await req.json()
  if (!clientEmail) return NextResponse.json({ error: 'clientEmail is required' }, { status: 400 })

  // Upsert: if a portal already exists for this user+email, return the existing token
  const { data, error } = await supabaseServer
    .from('client_portals')
    .upsert({ user_id: userId, client_email: clientEmail.toLowerCase() }, { onConflict: 'user_id,client_email' })
    .select('token')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nvoyce.ai'}/portal/${data.token}`
  return NextResponse.json({ token: data.token, portalUrl })
}
