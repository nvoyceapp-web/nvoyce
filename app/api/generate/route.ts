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

  // Default to 'pro' when no subscription row exists — handles early users and the owner
  // Once billing is fully live, new signups will get a 'free' row inserted at registration
  const plan = sub?.plan || 'pro'

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

  // Fetch user's business profile to enrich Claude's context
  const { data: userProfile } = await supabase
    .from('user_settings')
    .select('business_type, industry, common_services, project_types, tone_preference, charges_tax, tax_rate, default_payment_terms')
    .eq('user_id', userId)
    .single()

  // Build a context string from whatever the user has filled in
  const profileParts: string[] = []
  if (userProfile?.business_type) profileParts.push(`They are a ${userProfile.business_type}.`)
  if (userProfile?.industry) profileParts.push(`They work with clients in: ${userProfile.industry}.`)
  if (userProfile?.common_services) profileParts.push(`Their typical services include: ${userProfile.common_services}.`)
  if (userProfile?.project_types?.length) profileParts.push(`They typically do ${userProfile.project_types.join(', ')} projects.`)
  if (userProfile?.tone_preference) {
    const toneMap: Record<string, string> = {
      professional: 'professional and formal',
      friendly: 'friendly and conversational',
      concise: 'concise and direct',
    }
    profileParts.push(`Use a ${toneMap[userProfile.tone_preference] || userProfile.tone_preference} tone throughout.`)
  }
  if (userProfile?.charges_tax && userProfile?.tax_rate) {
    profileParts.push(`Apply ${userProfile.tax_rate}% tax to the total.`)
  }
  const businessContext = profileParts.length > 0
    ? `\n\nFreelancer context (use this to personalise the document):\n${profileParts.join(' ')}`
    : ''

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
    replaceDraftId,
    currency,
    // Pricing extras
    lineItems,
    showLineItems,
    taxEnabled,
    taxRate,
    discountAmount,
    depositPercent,
  } = body

  // Compute the actual total price to store in DB
  let finalPrice = parseFloat((price || '0').replace(/,/g, '')) || 0
  if (showLineItems && lineItems && lineItems.length > 0) {
    const subtotal = lineItems.reduce((sum: number, item: { quantity: string; unitPrice: string }) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
    }, 0)
    const tax = taxEnabled && taxRate ? subtotal * (parseFloat(taxRate) / 100) : 0
    const discount = discountAmount ? parseFloat(discountAmount) || 0 : 0
    finalPrice = subtotal + tax - discount
  }

  // Build line items context string for Claude
  let lineItemsContext = ''
  if (showLineItems && lineItems && lineItems.length > 0) {
    const validItems = lineItems.filter((i: { description: string; unitPrice: string }) => i.description && i.unitPrice)
    if (validItems.length > 0) {
      const itemLines = validItems.map((i: { description: string; quantity: string; unitPrice: string }) =>
        `  - ${i.description}: ${i.quantity || 1} × $${i.unitPrice}`
      ).join('\n')
      lineItemsContext += `\n\nUse EXACTLY these line items (do not invent others):\n${itemLines}`
      if (taxEnabled && taxRate) lineItemsContext += `\nApply ${taxRate}% tax.`
      if (discountAmount && parseFloat(discountAmount) > 0) lineItemsContext += `\nApply a $${discountAmount} discount.`
      if (depositPercent && parseFloat(depositPercent) > 0) lineItemsContext += `\nNote a ${depositPercent}% deposit is required upfront.`
    }
  } else {
    if (taxEnabled && taxRate) lineItemsContext += `\nApply ${taxRate}% tax to the total.`
    if (discountAmount && parseFloat(discountAmount) > 0) lineItemsContext += `\nApply a $${discountAmount} discount.`
    if (depositPercent && parseFloat(depositPercent) > 0) lineItemsContext += `\nNote a ${depositPercent}% deposit is required upfront.`
  }

  // If the user is regenerating from an existing draft (via "← Back to Edit"),
  // delete that draft first so we never accumulate orphaned duplicates.
  if (replaceDraftId) {
    await supabase
      .from('documents')
      .delete()
      .eq('id', replaceDraftId)
      .eq('user_id', userId)   // safety: only delete own drafts
      .eq('status', 'draft')   // never delete a sent/paid document
  }

  // 2. Build the Claude prompt
  // This is where the AI magic happens — we give Claude structured instructions
  // and ask for structured output so we can render it beautifully
  const systemPrompt = `You are a professional document generator for freelancers and small businesses.${businessContext}
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
- Currency: ${currency || 'USD'}
- Price: ${showLineItems ? finalPrice.toFixed(2) : price} ${currency || 'USD'}
- Timeline: ${timeline}
- Payment terms: ${paymentTerms}
- Additional notes: ${notes || 'None'}${lineItemsContext}

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
        price: finalPrice,
        currency: currency || 'USD',
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