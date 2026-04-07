import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { proposalId } = await req.json()

    if (!proposalId) {
      return NextResponse.json({ error: 'proposalId is required' }, { status: 400 })
    }

    // Update proposal status to "declined"
    const { error: updateError } = await supabaseServer
      .from('documents')
      .update({ status: 'declined' })
      .eq('id', proposalId)

    if (updateError) {
      console.error('Failed to update proposal status:', updateError)
      return NextResponse.json({ error: 'Failed to decline proposal' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Proposal declined',
    })
  } catch (error) {
    console.error('Error declining proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
