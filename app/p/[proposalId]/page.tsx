'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Logo from '@/components/Logo'

interface Proposal {
  id: string
  client_name: string
  client_email: string
  business_name: string
  price: number
  status: string
  generated_content: any
  form_data: any
  created_at: string
}

export default function PublicProposalPage() {
  const params = useParams()
  const proposalId = params.proposalId as string
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [action, setAction] = useState<'accepted' | 'declined' | null>(null)
  const [lastAction, setLastAction] = useState<'accept' | 'decline' | null>(null)

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', proposalId)
          .eq('doc_type', 'proposal')
          .single()

        if (fetchError) {
          setError('Proposal not found')
          return
        }

        setProposal(data)
      } catch (err) {
        setError('Failed to load proposal')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (proposalId) {
      fetchProposal()
    }
  }, [proposalId])

  const handleAccept = async () => {
    if (!proposal) return

    try {
      setLastAction('accept')
      setAccepting(true)

      // Call the invoice generation API
      const response = await fetch('/api/proposals/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to accept proposal')
        throw new Error(errorMsg)
      }

      const data = await response.json()

      // Send notification to freelancer
      await fetch('/api/proposals/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposal.id,
          action: 'accepted',
          clientName: proposal.client_name,
          clientEmail: proposal.client_email,
          amount: proposal.price,
        }),
      }).catch(err => console.log('Notification send failed (non-blocking):', err))

      setAction('accepted')
      setAccepted(true)
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to accept proposal'}`)
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    if (!proposal) return

    try {
      setLastAction('decline')
      setAccepting(true)

      // Update proposal status to declined
      const response = await fetch('/api/proposals/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to decline proposal')
        throw new Error(errorMsg)
      }

      // Send notification to freelancer
      await fetch('/api/proposals/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposal.id,
          action: 'declined',
          clientName: proposal.client_name,
          clientEmail: proposal.client_email,
          amount: proposal.price,
        }),
      }).catch(err => console.log('Notification send failed (non-blocking):', err))

      setAction('declined')
      setAccepted(true)
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to decline proposal'}`)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading proposal...</div>
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <Logo size="medium" />
          </div>
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600">{error || 'This proposal link may have expired or be invalid.'}</p>
        </div>
      </div>
    )
  }

  if (accepted && action === 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mb-6">
            <Logo size="medium" />
          </div>
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 text-green-600 rounded-full w-24 h-24 flex items-center justify-center text-7xl">✓</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Proposal Accepted!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for accepting this proposal. An invoice has been automatically generated and {proposal.business_name} will be notified.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-900 font-medium">
              💳 You should expect to receive an invoice shortly with payment details.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            If you have any questions, please contact {proposal.business_name}.
          </p>
        </div>
      </div>
    )
  }

  if (accepted && action === 'declined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mb-6">
            <Logo size="medium" />
          </div>
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 text-red-600 rounded-full w-24 h-24 flex items-center justify-center text-7xl">✗</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Proposal Declined</h1>
          <p className="text-gray-600 mb-6">
            Your response has been recorded and {proposal.business_name} has been notified of your decision.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 font-medium">
              💬 {proposal.business_name} may reach out to discuss further if needed.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            If you'd like to reconsider, please contact {proposal.business_name}.
          </p>
        </div>
      </div>
    )
  }

  const formData = proposal.form_data || {}
  const createdDate = new Date(proposal.created_at)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <Logo size="medium" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Proposal</h1>
          <p className="text-gray-600">From {proposal.business_name}</p>
        </div>

        {/* Proposal Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-8 mb-8">
          {/* From/To Section */}
          <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">From</h3>
              <div className="text-lg font-semibold text-gray-900">{proposal.business_name}</div>
              <div className="text-sm text-gray-600">{formData.businessEmail || 'Contact info provided'}</div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">To</h3>
              <div className="text-lg font-semibold text-gray-900">{proposal.client_name}</div>
              <div className="text-sm text-gray-600">{proposal.client_email}</div>
            </div>
          </div>

          {/* Proposal Details */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Proposal Details</h3>

            {formData.serviceDescription && (
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 block mb-2">Service Description</label>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{formData.serviceDescription}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Amount</label>
                <div className="text-2xl font-bold text-purple-600">${proposal.price.toLocaleString()}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Timeline</label>
                <div className="text-gray-900">{formData.timeline || 'As discussed'}</div>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          {formData.paymentTerms && (
            <div className="mb-8 pb-8 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Payment Terms</h3>
              <p className="text-gray-700">{formData.paymentTerms}</p>
            </div>
          )}

          {/* Notes */}
          {formData.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Additional Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{formData.notes}</p>
            </div>
          )}

          {/* Proposal Date */}
          <div className="text-xs text-gray-400 text-right">
            Proposal sent {createdDate.toLocaleDateString()}
          </div>
        </div>

        {/* Action Section */}
        <div className="text-center">
          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className={`px-8 py-3 rounded-lg font-semibold text-white text-lg transition ${
                accepting && lastAction === 'accept'
                  ? 'bg-green-400 cursor-not-allowed opacity-75'
                  : 'bg-green-600 hover:bg-green-700 cursor-pointer'
              }`}
            >
              {accepting && lastAction === 'accept' ? '⏳ Processing...' : '✓ Accept'}
            </button>
            <button
              onClick={handleDecline}
              disabled={accepting}
              className={`px-8 py-3 rounded-lg font-semibold text-white text-lg transition ${
                accepting && lastAction === 'decline'
                  ? 'bg-red-400 cursor-not-allowed opacity-75'
                  : 'bg-red-600 hover:bg-red-700 cursor-pointer'
              }`}
            >
              {accepting && lastAction === 'decline' ? '⏳ Processing...' : '✗ Decline'}
            </button>
          </div>

          <p className="text-sm text-gray-600">
            By accepting, you agree to the terms above. An invoice will be generated immediately.
          </p>
        </div>
      </div>
    </div>
  )
}
