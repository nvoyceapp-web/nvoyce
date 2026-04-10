'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase, type Document } from '@/lib/supabase'

export default function DocumentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copied, setCopied] = useState(false)
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [paymentNotes, setPaymentNotes] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

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
      const res = await fetch('/api/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    setSending(true)
    try {
      const res = await fetch('/api/proposals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: id }),
      })
      if (res.ok) {
        setSent(true)
        setDoc((prev) => prev ? { ...prev, status: 'sent' } : prev)
      } else {
        console.error('Failed to send proposal')
      }
    } catch (error) {
      console.error('Send error:', error)
    } finally {
      setSending(false)
    }
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
        <div className="flex items-center gap-3">
          {doc.doc_type === 'invoice' && (
            <>
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
            </>
          )}
          <button
            onClick={() => window.print()}
            className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Draft proposal action bar */}
      {doc.doc_type === 'proposal' && doc.status === 'draft' && (
        <div className="bg-amber-50 border-b border-amber-100">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="text-amber-500 font-semibold text-lg">✎</div>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Review your proposal before sending</h3>
                <p className="text-sm text-amber-700 mt-0.5">
                  This proposal is saved as a draft. Send it to <strong>{doc.client_email}</strong> when ready.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => router.push(`/dashboard/new?edit=${id}&step=1`)}
                className="text-sm border border-amber-300 text-amber-800 px-4 py-2 rounded-lg hover:bg-amber-100 transition"
              >
                ← Edit Inputs
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Save as Draft
              </button>
              <button
                onClick={sendToClient}
                disabled={sending}
                className="text-sm bg-violet-600 text-white px-5 py-2 rounded-lg hover:bg-violet-700 transition font-semibold disabled:opacity-50"
              >
                {sending ? 'Sending...' : '✉ Send to Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sent confirmation banner */}
      {doc.doc_type === 'proposal' && (doc.status === 'sent' || sent) && (
        <div className="bg-green-50 border-b border-green-100">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="text-green-600 font-semibold text-lg">✓</div>
              <div>
                <h3 className="text-sm font-semibold text-green-900">Proposal sent!</h3>
                <p className="text-sm text-green-700 mt-0.5">
                  Your proposal has been sent to <strong>{doc.client_email}</strong>. They can review and respond.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document */}
      <div className="max-w-3xl mx-auto px-4 py-12 print:py-0 print:px-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 print:shadow-none print:border-none print:rounded-none">

          {/* Logo */}
          <div className="flex justify-start mb-8">
            <Image
              src="/logo.png"
              alt="Nvoyce"
              width={280}
              height={90}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

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

          {/* Line items */}
          <div className="mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-gray-400 font-medium">Description</th>
                  <th className="text-right py-3 text-gray-400 font-medium">Qty</th>
                  <th className="text-right py-3 text-gray-400 font-medium">Unit Price</th>
                  <th className="text-right py-3 text-gray-400 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {content.lineItems.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-4 text-gray-900">{item.description}</td>
                    <td className="text-right py-4 text-gray-600">{item.quantity}</td>
                    <td className="text-right py-4 text-gray-600">${item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-4 font-medium text-gray-900">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-10">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">${content.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900 font-medium">${content.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">${content.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Timeline & Notes */}
          <div className="grid grid-cols-2 gap-8 mb-10 border-t border-gray-100 pt-8">
            {content.timeline && (
              <div className="text-sm">
                <div className="text-gray-400 mb-1 font-semibold">Timeline</div>
                <div className="text-gray-900">{content.timeline}</div>
              </div>
            )}
            {content.notes && (
              <div className="text-sm">
                <div className="text-gray-400 mb-1 font-semibold">Notes</div>
                <div className="text-gray-900">{content.notes}</div>
              </div>
            )}
          </div>

          {/* Closing message */}
          <div className="border-t border-gray-100 pt-8">
            <p className="text-gray-600 text-sm leading-relaxed">{content.closingMessage}</p>
          </div>

        </div>
      </div>
    </div>
  )
}