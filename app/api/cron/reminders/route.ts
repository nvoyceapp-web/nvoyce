import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendInvoiceOverdueReminderEmail, sendProposalExpiringEmail, sendInvoiceEmail } from '@/lib/email'
import { assignDocumentNumber } from '@/lib/document-numbers'

async function getUserLogo(userId: string): Promise<string | undefined> {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await db
    .from('user_settings')
    .select('logo_url')
    .eq('user_id', userId)
    .single()
  return data?.logo_url || undefined
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vercel calls this route daily at 9am UTC (configured in vercel.json)
// Protected by CRON_SECRET env var
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nvoyce.ai'
  const results = {
    invoiceReminders14: 0,
    invoiceReminders30: 0,
    proposalReminders: 0,
    recurringInvoicesSent: 0,
    errors: [] as string[],
  }

  // ─────────────────────────────────────────────────
  // 1. OVERDUE INVOICE REMINDERS (14 day + 30 day)
  // ─────────────────────────────────────────────────
  const { data: invoices, error: invoiceError } = await supabase
    .from('documents')
    .select('*')
    .eq('doc_type', 'invoice')
    .in('status', ['sent', 'partially_paid'])

  if (invoiceError) {
    results.errors.push(`Invoice fetch error: ${invoiceError.message}`)
  }

  for (const invoice of invoices || []) {
    try {
      const dueDateStr = invoice.generated_content?.dueDate
      if (!dueDateStr) continue

      const dueDate = new Date(dueDateStr)
      if (isNaN(dueDate.getTime())) continue

      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysOverdue <= 0) continue

      const logoUrl = await getUserLogo(invoice.user_id).catch(() => undefined)
      const amount = invoice.price - (invoice.amount_paid || 0)

      // 14-day reminder
      if (daysOverdue >= 14 && !invoice.reminder_14_sent_at) {
        try {
          await sendInvoiceOverdueReminderEmail({
            clientEmail: invoice.client_email,
            clientName: invoice.client_name,
            freelancerName: invoice.business_name,
            businessName: invoice.business_name,
            amount,
            invoiceNumber: invoice.document_number || invoice.id,
            daysOverdue,
            paymentLink: invoice.stripe_payment_link,
            logoUrl,
          })
          await supabase
            .from('documents')
            .update({ reminder_14_sent_at: now.toISOString() })
            .eq('id', invoice.id)
          results.invoiceReminders14++
        } catch (err) {
          results.errors.push(`Invoice ${invoice.id} 14d reminder: ${err}`)
        }
      }

      // 30-day reminder
      if (daysOverdue >= 30 && !invoice.reminder_30_sent_at) {
        try {
          await sendInvoiceOverdueReminderEmail({
            clientEmail: invoice.client_email,
            clientName: invoice.client_name,
            freelancerName: invoice.business_name,
            businessName: invoice.business_name,
            amount,
            invoiceNumber: invoice.document_number || invoice.id,
            daysOverdue,
            paymentLink: invoice.stripe_payment_link,
            logoUrl,
          })
          await supabase
            .from('documents')
            .update({ reminder_30_sent_at: now.toISOString() })
            .eq('id', invoice.id)
          results.invoiceReminders30++
        } catch (err) {
          results.errors.push(`Invoice ${invoice.id} 30d reminder: ${err}`)
        }
      }
    } catch (err) {
      results.errors.push(`Invoice ${invoice.id} processing error: ${err}`)
    }
  }

  // ─────────────────────────────────────────────────
  // 2. PROPOSAL EXPIRING SOON REMINDERS (2 days out)
  // ─────────────────────────────────────────────────
  const { data: proposals, error: proposalError } = await supabase
    .from('documents')
    .select('*')
    .eq('doc_type', 'proposal')
    .eq('status', 'sent')
    .is('expiry_reminder_sent_at', null)

  if (proposalError) {
    results.errors.push(`Proposal fetch error: ${proposalError.message}`)
  }

  for (const proposal of proposals || []) {
    try {
      const expirationDays = parseInt(proposal.form_data?.expirationDays || '7', 10)
      const createdAt = new Date(proposal.created_at)
      const expiresAt = new Date(createdAt.getTime() + expirationDays * 24 * 60 * 60 * 1000)
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Only send when exactly 1 or 2 days remain
      if (daysRemaining < 1 || daysRemaining > 2) continue

      const logoUrl = await getUserLogo(proposal.user_id).catch(() => undefined)
      const proposalLink = `${appUrl}/p/${proposal.id}`

      await sendProposalExpiringEmail({
        clientEmail: proposal.client_email,
        clientName: proposal.client_name,
        freelancerName: proposal.business_name,
        businessName: proposal.business_name,
        amount: proposal.price,
        proposalNumber: proposal.document_number || proposal.id,
        daysRemaining,
        proposalLink,
        logoUrl,
      })

      await supabase
        .from('documents')
        .update({ expiry_reminder_sent_at: now.toISOString() })
        .eq('id', proposal.id)

      results.proposalReminders++
    } catch (err) {
      results.errors.push(`Proposal ${proposal.id} expiry reminder: ${err}`)
    }
  }

  // ─────────────────────────────────────────────────
  // 3. RECURRING INVOICES — auto-send on due date
  // ─────────────────────────────────────────────────
  const todayStr = now.toISOString().slice(0, 10)

  const { data: dueConfigs, error: recurringError } = await supabase
    .from('recurring_configs')
    .select('*')
    .eq('active', true)
    .lte('next_due_date', todayStr)

  if (recurringError) {
    results.errors.push(`Recurring fetch error: ${recurringError.message}`)
  }

  function calcNextDueDate(interval: string, from: Date): string {
    const d = new Date(from)
    switch (interval) {
      case 'weekly':    d.setDate(d.getDate() + 7); break
      case 'biweekly':  d.setDate(d.getDate() + 14); break
      case 'monthly':   d.setMonth(d.getMonth() + 1); break
      case 'quarterly': d.setMonth(d.getMonth() + 3); break
    }
    return d.toISOString().slice(0, 10)
  }

  for (const config of dueConfigs || []) {
    try {
      // Fetch source document
      const { data: sourceDoc, error: srcError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', config.source_document_id)
        .single()

      if (srcError || !sourceDoc) {
        results.errors.push(`Recurring ${config.id}: source doc not found`)
        continue
      }

      // Clone as a new sent invoice
      const { data: newDoc, error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: sourceDoc.user_id,
          doc_type: 'invoice',
          client_name: sourceDoc.client_name,
          client_email: sourceDoc.client_email,
          business_name: sourceDoc.business_name,
          price: sourceDoc.price,
          currency: sourceDoc.currency || 'USD',
          status: 'sent',
          generated_content: {
            ...sourceDoc.generated_content,
            date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            dueDate: '', // will be set by payment terms logic
          },
          form_data: sourceDoc.form_data,
          sent_at: now.toISOString(),
        })
        .select('id')
        .single()

      if (insertError || !newDoc) {
        results.errors.push(`Recurring ${config.id}: insert failed ${insertError?.message}`)
        continue
      }

      // Assign document number
      await assignDocumentNumber(sourceDoc.user_id, 'invoice', newDoc.id)

      // Send email to client
      const logoUrl = await getUserLogo(sourceDoc.user_id).catch(() => undefined)
      const invoiceLink = `${appUrl}/dashboard/documents/${newDoc.id}`

      await sendInvoiceEmail({
        clientEmail: sourceDoc.client_email,
        clientName: sourceDoc.client_name || sourceDoc.client_email,
        invoiceLink,
        paymentLink: '',
        businessName: sourceDoc.business_name || 'Your service provider',
        amount: sourceDoc.price,
        userId: sourceDoc.user_id,
        ...(logoUrl ? { logoUrl } : {}),
      })

      // Advance next_due_date and record last_sent_at
      await supabase
        .from('recurring_configs')
        .update({
          last_sent_at: now.toISOString(),
          next_due_date: calcNextDueDate(config.interval, now),
          updated_at: now.toISOString(),
        })
        .eq('id', config.id)

      results.recurringInvoicesSent++
    } catch (err) {
      results.errors.push(`Recurring ${config.id} error: ${err}`)
    }
  }

  console.log('Cron reminders complete:', results)
  return NextResponse.json(results)
}
