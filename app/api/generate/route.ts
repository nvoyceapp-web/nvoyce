import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
// Payment link + email + number assignment happen in /api/invoices/send and /api/proposals/send
// Generate only creates the draft — nothing is sent to the client here

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Enforce Free tier limit: 3 docs per month
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .single()

  const plan = sub?.plan || 'free'

  if (plan === 'free') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'draft')
      .gte('created_at', startOfMonth.toISOString())

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Free plan limit reached. You\'ve used 3 documents this month. Upgrade to Pro for unlimited.', limitReached: true },
        { status: 403 }
      )
    }
  }

  // Compute today's date server-side so Claude always gets the real date
  const today = new Date()
  const todayFormatted = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const body = await req.json()
  const {
    docType,
    clientName,
    clientEmail,
    businessName,
    serviceDescription,
    price,
    timeline,
    paymentTerms,
    notes,
  } = body

  // 2. Build the Claude prompt
  // This is where the AI magic happens — we give Claude structured instructions
  // and ask for structured output so we can render it beautifully
  const systemPrompt = `You are a professional document generator for freelancers and small businesses.
Generate a professional ${docType} in JSON format. The output must be ONLY valid JSON — absolutely no markdown formatting, no triple backticks, no code blocks, no extra text. Return only the raw JSON object with this structure:
{
  "documentNumber": "PENDING",
  "date": "string (use exactly: ${todayFormatted})",
  "dueDate": "string (calculate from ${todayFormatted} + payment terms, formatted as Month DD, YYYY)",
  "from": {
    "name": "string",
    "tagline": "string (a short professional tagline for their business)"
  },
  "to": {
    "name": "string",
    "email": "string"
  },
  "subject": "string (a brief professional subject line for this ${docType})",
  "introduction": "string (2-3 sentence professional intro paragraph)",
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "total": number
    }
  ],
  "subtotal": number,
  "tax": number,
  "total": number,
  "paymentTerms": "string",
  "timeline": "string",
  "notes": "string",
  "closingMessage": "string (warm, professional closing 1-2 sentences)"
}`

  const userPrompt = `Generate a professional ${docType} with these details:
- Business name: ${businessName}
- Client name: ${clientName}
- Client email: ${clientEmail}
- Service: ${serviceDescription}
- Price: $${price}
- Timeline: ${timeline}
- Payment terms: ${paymentTerms}
- Additional notes: ${notes || 'None'}

IMPORTANT: Return ONLY the JSON object, nothing else. No markdown, no code blocks, no explanation.`

  try {
    // 3. Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    })

    // 4. Parse the JSON response from Claude
    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const generatedDoc = JSON.parse(content.text)

    // 5. Save to Supabase
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        doc_type: docType,
        client_name: clientName,
        client_email: clientEmail,
        business_name: businessName,
        price: parseFloat(price.replace(',', '')),
        status: 'draft',
        generated_content: generatedDoc,
        form_data: body,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }

    console.log('Draft saved:', data.id, `(${docType})`)

    // Draft is ready — user reviews in /dashboard/documents/[id] and clicks Send to Client
    return NextResponse.json({ id: data.id, document: generatedDoc })
  } catch (err: any) {
    console.error('Generation error full:', JSON.stringify(err?.error || err, null, 2))
    console.error('Status:', err?.status)
    console.error('Message:', err?.message)
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    )
  }
}