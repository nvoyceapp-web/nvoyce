import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-gray-900">Nvoyce</span>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-gray-600 hover:text-gray-900">Sign in</button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Get started free
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          AI-powered · Takes 30 seconds
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Professional proposals &<br />invoices — instantly
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Answer 5 questions. Get a polished proposal or invoice with a built-in payment link.
          Your clients pay. You get back to work.
        </p>
        <div className="flex items-center justify-center gap-4">
          <SignedOut>
            <Link
              href="/sign-up"
              className="bg-black text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-gray-800 transition"
            >
              Create your first invoice free →
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard/new"
              className="bg-black text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-gray-800 transition"
            >
              Create a new document →
            </Link>
          </SignedIn>
        </div>
        <p className="text-sm text-gray-400 mt-4">Free for 3 invoices/month. No credit card required.</p>

        {/* Social proof */}
        <div className="mt-20 grid grid-cols-3 gap-8 text-center">
          {[
            { stat: '30 sec', label: 'Average generation time' },
            { stat: '$19/mo', label: 'Pro plan, unlimited invoices' },
            { stat: '2x faster', label: 'Than writing it yourself' },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <div className="text-3xl font-bold text-gray-900">{stat}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
