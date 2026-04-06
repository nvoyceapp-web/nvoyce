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

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-50 text-blue-600',
    viewed: 'bg-yellow-50 text-yellow-700',
    paid: 'bg-green-50 text-green-700',
    overdue: 'bg-red-50 text-red-600',
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
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[doc.status]}`}>
            {doc.status}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {doc.status === 'paid' ? (
            <span className="text-sm text-green-600 font-semibold">✓ Paid</span>
          ) : doc.stripe_payment_link ? (
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
          ) : (
            <button
              onClick={generatePaymentLink}
              disabled={generatingLink}
              className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {generatingLink ? 'Creating link...' : '⚡ Generate payment link'}
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

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

            {content.lineItems.map((item, i) => (
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
          {doc.stripe_payment_link && doc.status !== 'paid' && (
            <div className="bg-black text-white rounded-xl p-6 text-center mb-8 print:hidden">
              <p className="text-sm text-gray-300 mb-3">Pay securely online</p>
              <a
                href={doc.stripe_payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-100 transition inline-block"
              >
                Pay ${content.total.toLocaleString()} now →
              </a>
            </div>
          )}

          {doc.status === 'paid' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center mb-8">
              <p className="text-green-700 font-semibold">✓ Payment received</p>
              <p className="text-green-600 text-sm mt-1">Thank you for your business.</p>
            </div>
          )}

          {/* Closing */}
          <div className="border-t border-gray-100 pt-8 text-sm text-gray-600">
            <p className="leading-relaxed">{content.closingMessage}</p>
            <p className="mt-4 font-semibold text-gray-900">{content.from.name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
