'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(10)
  const documentId = searchParams.get('documentId')

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success checkmark */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
        <p className="text-gray-500 text-base mb-8">
          Your payment has been processed. You&apos;ll receive a confirmation shortly.
        </p>

        {/* Countdown card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-sm text-gray-500 mb-1">Thank you for your payment</p>
          <p className="text-gray-700 text-sm">
            {countdown > 0
              ? `This page will close in ${countdown} second${countdown !== 1 ? 's' : ''}.`
              : 'You may close this tab.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <a
            href="/"
            className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition text-sm"
          >
            Back to homepage
          </a>
          {documentId && (
            <p className="text-xs text-gray-400 mt-1">
              Reference: {documentId}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaySuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
