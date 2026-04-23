import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabase-server'

// GET /api/expenses — list user's expenses
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseServer
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expenses: data })
}

// POST /api/expenses — create an expense
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { description, amount, category, client_name, date, notes } = body

  if (!description || amount == null || !date) {
    return NextResponse.json({ error: 'description, amount, and date are required' }, { status: 400 })
  }

  const { data, error } = await supabaseServer
    .from('expenses')
    .insert({
      user_id: userId,
      description,
      amount: parseFloat(String(amount)),
      category: category || 'Other',
      client_name: client_name || null,
      date,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expense: data })
}
