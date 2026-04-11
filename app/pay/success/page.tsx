'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); window.location.href = '/' }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-green-100 p-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
        <p className="text-gray-600 mb-2">Your payment has been processed securely.</p>
        <p className="text-gray-500 text-sm mb-8">The freelancer has been notified and your invoice has been updated.</p>
        <div className="bg-green-50 rounded-xl p-4 mb-8 border border-green-100">
          <p className="text-sm text-green-800 font-medium">🎉 Thank you for your payment</p>
          <p className="text-xs text-green-600 mt-1">A receipt has been sent to your email by Stripe.</p>
        </div>
        <p className="text-xs text-gray-400">Redirecting in {countdown}s...</p>
      </div>
    </div>
  )
}

export default function PaySuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <SuccessContent />
    </Suspense>
  )
}
