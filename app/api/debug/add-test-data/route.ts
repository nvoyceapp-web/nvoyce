import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const userId = 'test-user'
    const now = new Date()

    const testInvoices = [
      { daysAgo: 45, client: 'Acme Corp', amount: 5000 },
      { daysAgo: 65, client: 'TechStart Inc', amount: 3500 },
      { daysAgo: 35, client: 'Creative Agency', amount: 2800 },
      { daysAgo: 92, client: 'Big Client LLC', amount: 7200 },
    ]

    const results = []

    for (const invoice of testInvoices) {
      const createdAt = new Date(now.getTime() - invoice.daysAgo * 24 * 60 * 60 * 1000)

      const { data, error } = await supabaseServer.from('documents').insert({
        user_id: userId,
        doc_type: 'invoice',
        client_name: invoice.client,
        client_email: `contact@${invoice.client.toLowerCase().replace(/ /g, '')}.com`,
        business_name: 'Wanderlust Trips',
        price: invoice.amount,
        status: 'unpaid',
        created_at: createdAt.toISOString(),
        generated_content: {
          invoice_number: `INV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          date: createdAt.toLocaleDateString(),
          due_date: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        },
        form_data: {
          serviceDescription: `Services rendered on ${createdAt.toLocaleDateString()}`,
          paymentTerms: 'Net 30',
        },
      })

      results.push({
        client: invoice.client,
        daysOld: invoice.daysAgo,
        amount: invoice.amount,
        success: !error,
        error: error?.message,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Added ${results.filter((r) => r.success).length} test invoices`,
      results,
    })
  } catch (error) {
    console.error('Error adding test data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
