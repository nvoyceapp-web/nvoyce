import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Auth temporarily disabled while debugging Clerk session issue
  const userId = 'test-user'

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
  "documentNumber": "string (e.g. INV-2024-001 or PROP-2024-001)",
  "date": "string (today's date formatted as Month DD, YYYY)",
  "dueDate": "string (based on payment terms)",
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

    console.log('Document saved successfully:', data.id)
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
