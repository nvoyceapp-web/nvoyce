import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="font-bold text-2xl text-[#0d1b2a] tracking-tight hover:opacity-80 transition">
            Nvoyce
          </Link>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-orange-50 rounded-full w-24 h-24 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-[#0d1b2a] mb-3">Page not found</h1>
        <p className="text-gray-500 mb-8 text-lg leading-relaxed">
          This page doesn't exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-[#0d1b2a] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a2f45] transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
