'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Document } from '@/lib/supabase'

export default function DocumentPage() {
  const { id } = useParams()
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copied, setCopied] = useState(false)
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [paymentNotes, setPaymentNotes] = useState<string>('')

  useEffect(() => {
    async function fetchDoc() {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        console.log('Loaded document:', data)
        setDoc(data as Document)
        if (data.amount_paid) setAmountPaid(data.amount_paid)
      } else {
        console.error('Error loading document:', error)
      }
      setLoading(false)
    }
    fetchDoc()
  }, [id])

  const generatePaymentLink = async () => {
    if (!doc) return
    setGeneratingLink(true)
    try {
      const payload = {
        documentId: id,
        amount: doc.price,
        description: `${doc.doc_type} from ${doc.business_name}`,
        clientEmail: doc.client_email,
      }
      console.log('Sending payment link request:', payload)
      const res = await fetch('/api/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      console.log('Payment link response:', data)
      if (data.paymentLink) {
        setDoc((prev) => prev ? { ...prev, stripe_payment_link: data.paymentLink } : prev)
      } else {
        console.error('No payment link in response:', data)
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

  if (!doc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Document not found.</p>
          <Link href="/dashboard" className="text-sm text-black underline">← Back to dashboard</Link>
        </div>
      </div>
    )
  }

  const content = doc.generated_content
  const effectiveStatus = getEffectiveStatus(doc)
  const isInvoice = doc.doc_type === 'invoice'
  const totalAmount = content.total || doc.price
  const paidAmount = doc.amount_paid || 0
  const outstandingAmount = Math.max(0, totalAmount - paidAmount)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700">
            ← Dashboard
          </Link>
          <span className="text-gray-200">|</span>
          <span className="text-sm font-medium text-gray-900">{content.documentNumber}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[effectiveStatus] || 'bg-gray-100 text-gray-600'}`}>
            {effectiveStatus === 'fully_paid' ? 'Fully Paid' : effectiveStatus === 'partially_paid' ? 'Partially Paid' : effectiveStatus}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isInvoice && effectiveStatus === 'fully_paid' ? (
            <span className="text-sm text-green-600 font-semibold">✓ Fully Paid</span>
          ) : isInvoice && doc.stripe_payment_link ? (
            <>
              <span className="text-xs text-gray-400 max-w-xs truncate hidden md:block">
                {doc.stripe_payment_link}
              </span>
              <button
                onClick={copyLink}
                className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                {copied ? '✓ Copied!' : 'Copy payment link'}
              </button>
            </>
          ) : isInvoice ? (
            <button
              onClick={generatePaymentLink}
              disabled={generatingLink}
              className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {generatingLink ? 'Creating link...' : '⚡ Generate payment link'}
            </button>
          ) : null}

          <button
            onClick={() => window.print()}
            className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Status banners for invoices */}
      {isInvoice && effectiveStatus === 'sent' && (
        <div className="bg-blue-50 border-b border-blue-100 px-8 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <span>📬</span>
            <span>Invoice sent — awaiting payment</span>
          </div>
          {doc.stripe_payment_link && (
            <button
              onClick={copyLink}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
            >
              {copied ? '✓ Copied!' : 'Copy payment link'}
            </button>
          )}
        </div>
      )}

      {isInvoice && effectiveStatus === 'overdue' && (
        <div className="bg-red-50 border-b border-red-100 px-8 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <span>⚠️</span>
            <span>
              This invoice is overdue — ${outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding
            </span>
          </div>
          {doc.stripe_payment_link && (
            <button
              onClick={copyLink}
              className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
            >
              {copied ? '✓ Copied!' : 'Copy payment link'}
            </button>
          )}
        </div>
      )}

      {isInvoice && effectiveStatus === 'partially_paid' && (
        <div className="bg-yellow-50 border-b border-yellow-100 px-8 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-yellow-700 text-sm">
            <span>💛</span>
            <span>
              Partial payment received — ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} received,{' '}
              ${outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding
            </span>
          </div>
          {doc.stripe_payment_link && (
            <button
              onClick={copyLink}
              className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700 transition"
            >
              {copied ? '✓ Copied!' : 'Copy payment link'}
            </button>
          )}
        </div>
      )}

      {isInvoice && effectiveStatus === 'fully_paid' && (
        <div className="bg-green-50 border-b border-green-100 px-8 py-3 flex items-center gap-2 text-green-700 text-sm print:hidden">
          <span>✅</span>
          <span>
            Payment complete — ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} received in full
          </span>
        </div>
      )}

      {/* Document */}
      <div className="max-w-3xl mx-auto px-4 py-12 print:py-0 print:px-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 print:shadow-none print:border-none print:rounded-none">

          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{content.from.name}</h1>
              <p className="text-gray-400 text-sm mt-1">{content.from.tagline}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 capitalize">{doc.doc_type}</div>
              <div className="text-sm text-gray-400 mt-1">{content.documentNumber}</div>
            </div>
          </div>

          {/* Date row */}
          <div className="flex gap-12 mb-10 text-sm">
            <div>
              <div className="text-gray-400 mb-0.5">Date</div>
              <div className="font-medium text-gray-900">{content.date}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">Due date</div>
              <div className="font-medium text-gray-900">{content.dueDate}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">Payment terms</div>
              <div className="font-medium text-gray-900">{content.paymentTerms}</div>
            </div>
          </div>

          {/* Bill to */}
          <div className="flex gap-16 mb-10">
            <div className="text-sm">
              <div className="text-gray-400 mb-1 uppercase text-xs font-semibold tracking-wide">From</div>
              <div className="font-semibold text-gray-900">{content.from.name}</div>
            </div>
            <div className="text-sm">
              <div className="text-gray-400 mb-1 uppercase text-xs font-semibold tracking-wide">Bill to</div>
              <div className="font-semibold text-gray-900">{content.to.name}</div>
              <div className="text-gray-500">{content.to.email}</div>
            </div>
          </div>

          {/* Subject + intro */}
          <div className="border-t border-gray-100 pt-8 mb-8">
            <h2 className="font-semibold text-gray-900 mb-3">{content.subject}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{content.introduction}</p>
          </div>

          {/* Line items table */}
          <div className="mb-8">
            <div className="grid grid-cols-12 text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-100">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {content.lineItems.map((item: { description: string; quantity: number; unitPrice: number; total: number }, i: number) => (
              <div
                key={i}
                className="grid grid-cols-12 text-sm py-4 border-b border-gray-50"
              >
                <div className="col-span-6 text-gray-900">{item.description}</div>
                <div className="col-span-2 text-right text-gray-600">{item.quantity}</div>
                <div className="col-span-2 text-right text-gray-600">${item.unitPrice.toLocaleString()}</div>
                <div className="col-span-2 text-right font-medium text-gray-900">${item.total.toLocaleString()}</div>
              </div>
            ))}

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-56 text-sm space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${content.subtotal.toLocaleString()}</span>
                </div>
                {content.tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${content.tax.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>${content.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {content.timeline && (
            <div className="bg-gray-50 rounded-xl p-5 mb-6 text-sm">
              <span className="font-semibold text-gray-700">Timeline: </span>
              <span className="text-gray-600">{content.timeline}</span>
            </div>
          )}

          {/* Notes */}
          {content.notes && (
            <div className="text-sm text-gray-600 mb-8">
              <div className="font-semibold text-gray-700 mb-1">Notes</div>
              <p className="leading-relaxed">{content.notes}</p>
            </div>
          )}

          {/* Payment link banner */}
          {isInvoice && doc.stripe_payment_link && effectiveStatus !== 'fully_paid' && (
            <div className="bg-black text-white rounded-xl p-6 text-center mb-8 print:hidden">
              <p className="text-sm text-gray-300 mb-3">Pay securely online</p>
              <a
                href={doc.stripe_payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-100 transition inline-block"
              >
                Pay ${outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} now →
              </a>
            </div>
          )}

          {isInvoice && effectiveStatus === 'fully_paid' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center mb-8">
              <p className="text-green-700 font-semibold">✓ Payment received in full</p>
              <p className="text-green-600 text-sm mt-1">Thank you for your business.</p>
            </div>
          )}

          {/* Closing */}
          <div className="border-t border-gray-100 pt-8 text-sm text-gray-600">
            <p className="leading-relaxed">{content.closingMessage}</p>
            <p className="mt-4 font-semibold text-gray-900">{content.from.name}</p>
          </div>

          {/* Payment Tracking — only for invoices not fully paid */}
          {isInvoice && effectiveStatus !== 'fully_paid' && (
            <div className="border-t border-gray-100 mt-10 pt-8 print:hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Payment Tracking</h3>

              {/* Summary */}
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
                  <div className={`text-xs font-semibold uppercase ${paidAmount >= totalAmount ? 'text-green-600' : paidAmount > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    Outstanding
                  </div>
                  <div className={`text-2xl font-bold ${paidAmount >= totalAmount ? 'text-green-900' : paidAmount > 0 ? 'text-yellow-900' : 'text-red-900'}`}>
                    ${outstandingAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div className="mb-6">
                {effectiveStatus === 'partially_paid' && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    ⚠ Partially Paid (${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                )}
                {(effectiveStatus === 'sent' || effectiveStatus === 'draft') && paidAmount === 0 && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                    ⧗ Awaiting Payment
                  </span>
                )}
                {effectiveStatus === 'overdue' && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700">
                    🔴 Overdue
                  </span>
                )}
              </div>

              {/* Record Payment Form */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Amount Paid</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter total amount received (including partial payments)</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Payment Notes (optional)</label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g., Received partial payment, remaining due by..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    console.log('Record payment:', { amountPaid, paymentNotes })
                    alert(`Payment of $${amountPaid.toLocaleString()} recorded${paymentNotes ? ' with note: ' + paymentNotes : ''}`)
                  }}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold text-sm"
                >
                  ✓ Save Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
