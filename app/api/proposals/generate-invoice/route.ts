import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

interface Document {
  id: string
  doc_type: string
  client_name: string
  client_email: string
  business_name: string
  price: number
  generated_content: any
  form_data: any
}

export async function POST(req: NextRequest) {
  try {
    const { proposalId } = await req.json()

    if (!proposalId) {
      return NextResponse.json({ error: 'proposalId is required' }, { status: 400 })
    }

    // Fetch the proposal (no auth required - public proposal acceptance)
    const { data: proposal, error: fetchError } = await supabaseServer
      .from('documents')
      .select('*')
      .eq('id', proposalId)
      .single()

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    if (proposal.doc_type !== 'proposal') {
      return NextResponse.json({ error: 'Document is not a proposal' }, { status: 400 })
    }

    // Extract key data from proposal
    const proposalContent = proposal.generated_content?.html || proposal.form_data?.serviceDescription || ''
    const formData = proposal.form_data || {}

    // Call Claude to transform proposal into invoice
    const invoiceGenerationPrompt = `You are converting a business proposal into a professional invoice.

Original Proposal Details:
- Client: ${proposal.client_name}
- Business: ${proposal.business_name}
- Amount: $${proposal.price}
- Description: ${formData.serviceDescription || 'Services as proposed'}
- Timeline: ${formData.timeline || 'As agreed'}
- Payment Terms: ${formData.paymentTerms || 'Due on receipt'}
- Notes: ${formData.notes || 'N/A'}

Generate a professional invoice in JSON format with this structure:
{
  "invoice_number": "INV-XXXXX",
  "date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "from": {
    "name": "${proposal.business_name}",
    "email": "${formData.businessEmail || ''}"
  },
  "to": {
    "name": "${proposal.client_name}",
    "email": "${proposal.client_email}"
  },
  "items": [
    {
      "description": "description of service",
      "quantity": 1,
      "unit_price": ${proposal.price},
      "amount": ${proposal.price}
    }
  ],
  "subtotal": ${proposal.price},
  "tax": 0,
  "total": ${proposal.price},
  "payment_terms": "${formData.paymentTerms || 'Due on receipt'}",
  "notes": "${formData.notes || ''}"
}

Generate ONLY valid JSON, no additional text.`

    let message
    try {
      message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: invoiceGenerationPrompt,
          },
        ],
      })
    } catch (claudeError) {
      console.error('Claude API error:', claudeError)
      const errorMsg = claudeError instanceof Error ? claudeError.message : String(claudeError)
      return NextResponse.json({
        error: 'Failed to call Claude API',
        details: errorMsg
      }, { status: 500 })
    }

    let invoiceData
    try {
      const content = message.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }
      invoiceData = JSON.parse(content.text)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      return NextResponse.json(
        { error: 'Failed to generate invoice from proposal' },
        { status: 500 }
      )
    }

    // Create the invoice document (with same user_id as the proposal)
    const { data: invoice, error: insertError } = await supabaseServer
      .from('documents')
      .insert({
        user_id: proposal.user_id,
        doc_type: 'invoice',
        client_name: proposal.client_name,
        client_email: proposal.client_email,
        business_name: proposal.business_name,
        price: proposal.price,
        status: 'sent',
        generated_content: invoiceData,
        form_data: {
          ...formData,
          sourceProposalId: proposalId,
          generatedFrom: 'proposal_acceptance',
        },
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert invoice:', insertError)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Update proposal status to "accepted"
    const { error: updateError } = await supabaseServer
      .from('documents')
      .update({ status: 'accepted' })
      .eq('id', proposalId)

    if (updateError) {
      console.error('Failed to update proposal status:', updateError)
      // Don't fail the response - invoice was created successfully
    }

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      message: `Invoice auto-generated from proposal for ${proposal.client_name}`,
    })
  } catch (error) {
    console.error('Error generating invoice from proposal:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 })
  }
}
