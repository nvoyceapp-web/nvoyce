import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function addTestData() {
  const userId = 'test-user'
  const now = new Date()

  const testInvoices = [
    {
      // 45 days old - should show in Payme (overdue)
      daysAgo: 45,
      client_name: 'Acme Corp',
      amount: 5000,
      status: 'unpaid',
    },
    {
      // 65 days old - critical (should show in Payme as critical)
      daysAgo: 65,
      client_name: 'TechStart Inc',
      amount: 3500,
      status: 'unpaid',
    },
    {
      // 35 days old - slightly overdue
      daysAgo: 35,
      client_name: 'Creative Agency',
      amount: 2800,
      status: 'unpaid',
    },
    {
      // 90+ days old - very critical
      daysAgo: 92,
      client_name: 'Big Client LLC',
      amount: 7200,
      status: 'unpaid',
    },
  ]

  for (const invoice of testInvoices) {
    const createdAt = new Date(now.getTime() - invoice.daysAgo * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase.from('documents').insert({
      user_id: userId,
      doc_type: 'invoice',
      client_name: invoice.client_name,
      client_email: `contact@${invoice.client_name.toLowerCase().replace(/ /g, '')}.com`,
      business_name: 'Wanderlust Trips',
      price: invoice.amount,
      status: invoice.status,
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

    if (error) {
      console.error(`Error adding invoice for ${invoice.client_name}:`, error)
    } else {
      console.log(
        `✓ Added ${invoice.daysAgo}-day-old invoice for ${invoice.client_name} ($${invoice.amount})`
      )
    }
  }

  console.log('\n✓ Test data added! Payme should now show recommendations.')
}

addTestData().catch(console.error)
