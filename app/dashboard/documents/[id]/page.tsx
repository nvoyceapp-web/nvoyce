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
          <span className="text-sm