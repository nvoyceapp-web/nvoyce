'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Document, type GeneratedDocument } from '@/lib/supabase'
import QRModal from '@/components/QRModal'

// Editable text field — shows plain text when sent, input when draft
function EditableText({
  value,
  onChange,
  className = '',
  multiline = false,
  placeholder = '',
  isDraft,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  multiline?: boolean
  placeholder?: string
  isDraft: boolean
}) {
  if (!isDraft) {
    return multiline
      ? <p className={className}>{value}</p>
      : <span className={className}>{value}</span>
  }
  return multiline ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className={`${className} w-full bg-orange-50 border border-orange-200 rounded px-2 py-1 focus:outline-none focus:border-orange-400 resize-none text-sm`}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${className} bg-orange-50 border border-orange-200 rounded px-2 py-1 focus:outline-none focus:border-orange-400 w-full`}
    />
  )
}

export default function DocumentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [paymentNotes, setPaymentNotes] = useState<string>('')
  const [editingContent, setEditingContent] = useState<Record<string, any> | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [userLogo, setUserLogo] = useState<string | null>(null)
  const [qrModal, setQrModal] = useState(false)

  useEffect(() => {
    async function fetchDoc() {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .single()

        if (!error && data) {
          setDoc(data as Document)
          setEditingContent(data.generated_content)
          if (data.amount_paid) setAmountPaid(data.amount_paid)

          // Fetch user settings to get logo
          const { data: settings } = await supabase
            .from('user_settings')
            .select('logo_url')
            .eq('user_id', data.user_id)
            .single()

          if (settings?.logo_url) {
            setUserLogo(settings.logo_url)
          }
        } else {
          console.error('Error loading document:', error)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchDoc()
  }, [id])

  const updateField = useCallback((path: string, value: any) => {
    setEditingContent((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      const keys = path.split('.')
      let obj: any = next
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] }
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
      return next
    })
    setHasUnsavedChanges(true)
  }, [])

  const updateLineItem = useCallback((index: number, field: string, value: any) => {
    setEditingContent((prev) => {
      if (!prev) return prev
      const items = prev.lineItems.map((item: any, i: number) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        // Auto-compute total when qty or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? Number(value) : Number(item.quantity)
          const price = field === 'unitPrice' ? Number(value) : Number(item.unitPrice)
          updated.total = qty * price
        }
        return updated
      })
      // Recompute subtotal and total
      const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0)
      const tax = prev.tax || 0
      return { ...prev, lineItems: items, subtotal, total: subtotal + tax }
    })
    setHasUnsavedChanges(true)
  }, [])

  const addLineItem = useCallback(() => {
    setEditingContent((prev) => {
      if (!prev) return prev
      const newItem = { description: 'New item', quantity: 1, unitPrice: 0, total: 0 }
      return { ...prev, lineItems: [...prev.lineItems, newItem] }
    })
    setHasUnsavedChanges(true)
  }, [])

  const removeLineItem = useCallback((index: number) => {
    setEditingContent((prev) => {
      if (!prev) return prev
      const items = prev.lineItems.filter((_: any, i: number) => i !== index)
      const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0)
      return { ...prev, lineItems: items, subtotal, total: subtotal + (prev.tax || 0) }
    })
    setHasUnsavedChanges(true)
  }, [])

  const saveChanges = async () => {
    if (!doc || !editingContent) return
    setSaving(true)
    const { error } = await supabase
      .from('documents')
      .update({ generated_content: editingContent })
      .eq('id', doc.id)
    if (!error) {
      setDoc((prev) => prev ? { ...prev, generated_content: editingContent as unknown as GeneratedDocument } : prev)
      setHasUnsavedChanges(false)
    }
    setSaving(false)
  }

  const generatePaymentLink = async () => {
    if (!doc) return
    setGeneratingLink(true)
    try {
      const res = await fetch('/api/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: id,
          amount: doc.price,
          description: `${doc.doc_type} from ${doc.business_name}`,
          clientEmail: doc.client_email,
        }),
      })
      const data = await res.json()
      if (data.paymentLink) {
        setDoc((prev) => prev ? { ...prev, stripe_payment_link: data.paymentLink } : prev)
      }
    } catch (error) {
      console.error('Payment link error:', error)
    } finally {
      setGeneratingLink(false)
    }
  }

  const copyLink = async () => {
    if (!doc?.stripe_payment_link) return
    await navigator.clipboard.writeText(doc.stripe_payment_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendToClient = async () => {
    if (!doc) return
    // Save any unsaved changes first
    if (hasUnsavedChanges) await saveChanges()
    setSending(true)
    try {
      const endpoint = doc.doc_type === 'invoice' ? '/api/invoices/send' : '/api/proposals/send'
      const bodyKey = doc.doc_type === 'invoice' ? 'invoiceId' : 'proposalId'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: doc.id }),
      })
      const data = await res.json()
      if (data.success || data.alreadySent) {
        setHasUnsavedChanges(false)
        // Redirect to dashboard with success notification
        // Do NOT pass paymentLink in URL — Stripe URLs contain '?' which breaks query string parsing
        const params = new URLSearchParams()
        if (doc.doc_type === 'invoice') {
          params.append('invoiceCreated', doc.id)
        } else {
          params.append('proposalCreated', doc.id)
        }
        router.push(`/dashboard?${params.toString()}`)
      }
    } catch (err) {
      console.error('Send error:', err)
    } finally {
      setSending(false)
    }
  }

  // Compute effective status (overdue is derived, not stored)
  const getEffectiveStatus = (doc: Document): string => {
    if (doc.status === 'sent' && doc.generated_content?.dueDate) {
      const due = new Date(doc.generated_content.dueDate)
      if (due < new Date()) return 'overdue'
    }
    return doc.status
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-50 text-blue-600',
    viewed: 'bg-yellow-50 text-yellow-700',
    partially_paid: 'bg-yellow-100 text-yellow-700',
    fully_paid: 'bg-green-50 text-green-700',
    overdue: 'bg-red-50 text-red-600',
    accepted: 'bg-green-50 text-green-700',
    declined: 'bg-red-50 text-red-600',
    expired: 'bg-gray-100 text-gray-500',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading document...</div>
      </div>
    )
  }

  if (!doc || !editingContent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Document not found.</p>
          <Link href="/dashboard" className="text-sm text-black underline">← Back to dashboard</Link>
        </div>
      </div>
    )
  }

  const content = editingContent
  const effectiveStatus = getEffectiveStatus(doc)
  const isDraft = effectiveStatus === 'draft'
  const isInvoice = doc.doc_type === 'invoice'
  const totalAmount = content.total || doc.price
  const paidAmount = doc.amount_paid || 0
  const outstandingAmount = Math.max(0, totalAmount - paidAmount)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700">
            ← Dashboard
          </Link>
          <span className="text-gray-200 hidden sm:inline">|</span>
          <span className="text-sm font-medium text-gray-900">
            {doc.document_number || content.documentNumber || 'Draft'}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[effectiveStatus] || 'bg-gray-100 text-gray-600'}`}>
            {effectiveStatus === 'fully_paid' ? 'Fully Paid' : effectiveStatus === 'partially_paid' ? 'Partially Paid' : effectiveStatus}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isDraft && (
            <>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="text-sm border border-orange-300 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <Link
                href={`/dashboard/new?prefill=${doc.id}`}
                className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                ← Back to Edit
              </Link>
              <button
                onClick={sendToClient}
                disabled={sending}
                className="text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-semibold"
              >
                {sending ? 'Sending...' : 'Send to Client'}
              </button>
            </>
          )}
          {!isDraft && isInvoice && effectiveStatus === 'fully_paid' && (
            <span className="text-sm text-green-600 font-semibold">✓ Fully Paid</span>
          )}
          {!isDraft && isInvoice && doc.stripe_payment_link && effectiveStatus !== 'fully_paid' && (
            <>
              <button onClick={copyLink} className="text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition">
                {copied ? '✓ Copied!' : 'Copy payment link'}
              </button>
              <button
                onClick={() => setQrModal(true)}
                className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5"
                title="Show QR Code"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
                </svg>
                <span className="hidden sm:inline">QR Code</span>
              </button>
            </>
          )}
          {!isDraft && isInvoice && !doc.stripe_payment_link && effectiveStatus !== 'fully_paid' && (
            <button
              onClick={generatePaymentLink}
              disabled={generatingLink}
              className="text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {generatingLink ? 'Creating...' : 'Generate payment link'}
            </button>
          )}
          <button onClick={() => window.print()} className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition hidden sm:block">
            Print / PDF
          </button>
        </div>
      </div>

      {/* AI disclosure banner — drafts only */}
      {isDraft && (
        <div className="bg-orange-50 border-b border-orange-100 px-4 sm:px-8 py-3 flex items-start sm:items-center justify-between gap-2 print:hidden">
          <div className="flex items-start sm:items-center gap-2 text-orange-700 text-sm">
            <span className="mt-0.5 sm:mt-0">✨</span>
            <span>AI-generated draft — review and edit before sending. Click any field to make changes.</span>
          </div>
          <span className="text-xs text-orange-400 font-medium shrink-0">NOT sent yet</span>
        </div>
      )}

      {/* Sent status banners */}
      {isInvoice && effectiveStatus === 'sent' && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 sm:px-8 py-3 flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <span>📬</span>
            <span>Invoice sent — awaiting payment</span>
          </div>
          {doc.stripe_payment_link && (
            <button onClick={copyLink} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition shrink-0">
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
          )}
        </div>
      )}
      {isInvoice && effectiveStatus === 'overdue' && (
        <div className="bg-red-50 border-b border-red-100 px-4 sm:px-8 py-3 flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <span>⚠️</span>
            <span className="hidden sm:inline">This invoice is overdue — ${outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding</span>
            <span className="sm:hidden">Overdue — ${outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding</span>
          </div>
          {doc.stripe_payment_link && (
            <button onClick={copyLink} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition shrink-0">
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
          )}
        </div>
      )}
      {isInvoice && effectiveStatus === 'partially_paid' && (
        <div className="bg-yellow-50 border-b border-yellow-100 px-4 sm:px-8 py-3 flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 text-yellow-700 text-sm">
            <span>💛</span>
            <span className="hidden sm:inline">
              Partial payment received — ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} received,{' '}
              ${outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding
            </span>
            <span className="sm:hidden">${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paid</span>
          </div>
          {doc.stripe_payment_link && (
            <button onClick={copyLink} className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700 transition shrink-0">
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
          )}
        </div>
      )}
      {isInvoice && effectiveStatus === 'fully_paid' && (
        <div className="bg-green-50 border-b border-green-100 px-4 sm:px-8 py-3 flex items-center gap-2 text-green-700 text-sm print:hidden">
          <span>✅</span>
          <span>Payment complete — ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} received in full</span>
        </div>
      )}

      {/* Document */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-12 print:py-0 print:px-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-12 print:shadow-none print:border-none print:rounded-none">

          {/* Logo Section */}
          <div className="text-center mb-12 pb-8 border-b border-gray-100">
            {userLogo ? (
              <img src={userLogo} alt="Logo" className="max-w-sm max-h-48 mx-auto mb-2 object-contain" />
            ) : (
              <img src="/logo.png" alt="Nvoyce" className="max-w-sm max-h-48 mx-auto mb-2 object-contain" />
            )}
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-8 sm:mb-10">
            <div className="flex-1 mr-4 sm:mr-8">
              <EditableText
                value={content.from.name}
                onChange={(v) => updateField('from.name', v)}
                className="text-3xl font-bold text-gray-900"
                placeholder="Business name"
                isDraft={isDraft}
              />
              <div className="mt-1">
                <EditableText
                  value={content.from.tagline}
                  onChange={(v) => updateField('from.tagline', v)}
                  className="text-gray-400 text-sm"
                  placeholder="Business tagline"
                  isDraft={isDraft}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 capitalize">{doc.doc_type}</div>
              <div className="text-sm text-gray-400 mt-1">{doc.document_number || 'Draft'}</div>
            </div>
          </div>

          {/* Date row */}
          <div className="flex flex-wrap gap-6 sm:gap-12 mb-8 sm:mb-10 text-sm">
            <div>
              <div className="text-gray-400 mb-0.5">Date</div>
              <div className="font-medium text-gray-900">{content.date}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">Due date</div>
              {isDraft ? (
                <input
                  type="text"
                  value={content.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                  className="font-medium text-gray-900 bg-orange-50 border border-orange-200 rounded px-2 py-0.5 focus:outline-none focus:border-orange-400 text-sm"
                />
              ) : (
                <div className="font-medium text-gray-900">{content.dueDate}</div>
              )}
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">Payment terms</div>
              {isDraft ? (
                <input
                  type="text"
                  value={content.paymentTerms}
                  onChange={(e) => updateField('paymentTerms', e.target.value)}
                  className="font-medium text-gray-900 bg-orange-50 border border-orange-200 rounded px-2 py-0.5 focus:outline-none focus:border-orange-400 text-sm"
                />
              ) : (
                <div className="font-medium text-gray-900">{content.paymentTerms}</div>
              )}
            </div>
          </div>

          {/* Bill to */}
          <div className="flex flex-wrap gap-8 sm:gap-16 mb-8 sm:mb-10">
            <div className="text-sm">
              <div className="text-gray-400 mb-1 uppercase text-xs font-semibold tracking-wide">From</div>
              <div className="font-semibold text-gray-900">{content.from.name}</div>
            </div>
            <div className="text-sm">
              <div className="text-gray-400 mb-1 uppercase text-xs font-semibold tracking-wide">Bill to</div>
              <EditableText
                value={content.to.name}
                onChange={(v) => updateField('to.name', v)}
                className="font-semibold text-gray-900"
                placeholder="Client name"
                isDraft={isDraft}
              />
              <div className="mt-1">
                <EditableText
                  value={content.to.email}
                  onChange={(v) => updateField('to.email', v)}
                  className="text-gray-500"
                  placeholder="Client email"
                  isDraft={isDraft}
                />
              </div>
            </div>
          </div>

          {/* Subject + intro */}
          <div className="border-t border-gray-100 pt-8 mb-8">
            <div className="mb-3">
              <EditableText
                value={content.subject}
                onChange={(v) => updateField('subject', v)}
                className="font-semibold text-gray-900 text-base"
                placeholder="Subject line"
                isDraft={isDraft}
              />
            </div>
            <EditableText
              value={content.introduction}
              onChange={(v) => updateField('introduction', v)}
              className="text-gray-600 text-sm leading-relaxed"
              placeholder="Introduction paragraph"
              multiline
              isDraft={isDraft}
            />
          </div>

          {/* Line items */}
          <div className="mb-8 overflow-x-auto -mx-1 px-1">
            <div className="min-w-[420px]">
            <div className="grid grid-cols-12 text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-100">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit price</div>
              <div className="col-span-2 text-right">{isDraft ? 'Total' : 'Total'}</div>
            </div>

            {content.lineItems.map((item: { description: string; quantity: number; unitPrice: number; total: number }, i: number) => (
              <div key={i} className="grid grid-cols-12 text-sm py-4 border-b border-gray-50 items-center">
                <div className="col-span-6 text-gray-900">
                  {isDraft ? (
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                      className="w-full bg-orange-50 border border-orange-200 rounded px-2 py-1 focus:outline-none focus:border-orange-400 text-sm"
                    />
                  ) : item.description}
                </div>
                <div className="col-span-2 text-right text-gray-600">
                  {item.quantity}
                </div>
                <div className="col-span-2 text-right text-gray-600">
                  ${item.unitPrice.toLocaleString()}
                </div>
                <div className="col-span-2 text-right font-medium text-gray-900 flex items-center justify-end gap-2">
                  ${(item.total || 0).toLocaleString()}
                  {isDraft && (
                    <button
                      onClick={() => removeLineItem(i)}
                      className="text-red-400 hover:text-red-600 text-xs ml-1"
                      title="Remove line item"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isDraft && (
              <button
                onClick={addLineItem}
                className="mt-3 text-xs text-orange-600 hover:text-orange-700 font-semibold border border-dashed border-orange-300 rounded-lg px-4 py-2 w-full hover:bg-orange-50 transition"
              >
                + Add line item
              </button>
            )}

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-56 text-sm space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${(content.subtotal || 0).toLocaleString()}</span>
                </div>
                {content.tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${content.tax.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>${(content.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Timeline */}
          {(content.timeline || isDraft) && (
            <div className="bg-gray-50 rounded-xl p-5 mb-6 text-sm">
              <span className="font-semibold text-gray-700">Timeline: </span>
              {isDraft ? (
                <input
                  type="text"
                  value={content.timeline || ''}
                  onChange={(e) => updateField('timeline', e.target.value)}
                  placeholder="e.g. 2 weeks from project start"
                  className="bg-orange-50 border border-orange-200 rounded px-2 py-0.5 focus:outline-none focus:border-orange-400 text-sm w-64"
                />
              ) : (
                <span className="text-gray-600">{content.timeline}</span>
              )}
            </div>
          )}

          {/* Notes */}
          {(content.notes || isDraft) && (
            <div className="text-sm text-gray-600 mb-8">
              <div className="font-semibold text-gray-700 mb-1">Notes</div>
              <EditableText
                value={content.notes || ''}
                onChange={(v) => updateField('notes', v)}
                className="leading-relaxed text-gray-600"
                placeholder="Add any notes for the client..."
                multiline
                isDraft={isDraft}
              />
            </div>
          )}

          {isInvoice && effectiveStatus === 'fully_paid' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center mb-8">
              <p className="text-green-700 font-semibold">✓ Payment received in full</p>
              <p className="text-green-600 text-sm mt-1">Thank you for your business.</p>
            </div>
          )}

          {/* Closing message */}
          <div className="border-t border-gray-100 pt-8 text-sm text-gray-600">
            <EditableText
              value={content.closingMessage}
              onChange={(v) => updateField('closingMessage', v)}
              className="leading-relaxed text-gray-600"
              placeholder="Closing message..."
              multiline
              isDraft={isDraft}
            />
            <p className="mt-4 font-semibold text-gray-900">{content.from.name}</p>
          </div>

          {/* Payment tracking (invoices, not fully paid) */}
          {isInvoice && effectiveStatus !== 'fully_paid' && !isDraft && (
            <div className="border-t border-gray-100 mt-10 pt-8 print:hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Payment Tracking</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-xs text-blue-600 font-semibold uppercase">Total</div>
                  <div className="text-2xl font-bold text-blue-900">${totalAmount.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-xs text-green-600 font-semibold uppercase">Paid</div>
                  <div className="text-2xl font-bold text-green-900">${paidAmount.toLocaleString()}</div>
                </div>
                <div className={`rounded-lg p-4 ${paidAmount >= totalAmount ? 'bg-green-50' : paidAmount > 0 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                  <div className={`text-xs font-semibold uppercase ${paidAmount >= totalAmount ? 'text-green-600' : paidAmount > 0 ? 'text-yellow-600' : 'text-red-600'}`}>Outstanding</div>
                  <div className={`text-2xl font-bold ${paidAmount >= totalAmount ? 'text-green-900' : paidAmount > 0 ? 'text-yellow-900' : 'text-red-900'}`}>
                    ${outstandingAmount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Amount Paid</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Payment Notes (optional)</label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
                  />
                </div>
                <button
                  onClick={() => alert(`Payment of $${amountPaid.toLocaleString()} recorded`)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold text-sm"
                >
                  ✓ Save Payment
                </button>
              </div>
            </div>
          )}

          {/* Made with nvoyce footer */}
          <div className="border-t border-gray-100 mt-12 pt-8 text-center flex flex-col items-center gap-2">
            <img src="/logo-icon.png" alt="Nvoyce" className="w-6 h-6 object-contain opacity-50" />
            <p className="text-xs text-gray-400">
              Made with <span className="text-purple-600 font-semibold">nvoyce</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sticky save bar — appears when there are unsaved changes */}
      {isDraft && hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 px-8 py-4 flex items-center justify-between shadow-lg z-50 print:hidden">
          <p className="text-sm text-orange-600 font-medium">You have unsaved changes</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setEditingContent(doc.generated_content); setHasUnsavedChanges(false) }}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Discard
            </button>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="text-sm bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-semibold"
            >
              {saving ? 'Saving...' : '💾 Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && doc?.stripe_payment_link && (
        <QRModal
          url={doc.stripe_payment_link}
          label={`${doc.client_name} — Invoice`}
          onClose={() => setQrModal(false)}
        />
      )}
    </div>
  )
}
