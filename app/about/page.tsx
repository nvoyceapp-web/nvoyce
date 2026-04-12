'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header/Nav */}
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="Nvoyce" className="w-8 h-8 object-contain" />
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Home
            </Link>
            <Link href="/about" className="text-gray-900 text-sm font-medium">
              About
            </Link>
            <Link href="/dashboard" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">We do the hard stuff.</h1>
          <h2 className="text-5xl font-bold text-purple-600 mb-8">You get paid.</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Nvoyce is built for freelancers and gig workers who deserve better tools to manage their business and get paid faster.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            Invoicing and proposal management shouldn't be complicated. Most freelancers spend valuable time on admin work instead of doing what they love. We're changing that.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Nvoyce automates the hard stuff—invoice generation, payment tracking, and smart reminders. So you can focus on delivering great work and getting paid on time.
          </p>
        </section>

        {/* Core Values */}
        <section className="mb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-12">Our Core Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg border border-purple-100 p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Speed</h4>
              <p className="text-gray-600">
                Create an invoice in seconds, not hours. Get paid faster with automated reminders and intelligent prioritization.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-purple-100 p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Simplicity</h4>
              <p className="text-gray-600">
                Intuitive tools that work the way you think. No complicated workflows or unnecessary features.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-purple-100 p-6">
              <div className="text-4xl mb-4">💪</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Empowerment</h4>
              <p className="text-gray-600">
                We're built for freelancers, by people who understand your challenges. Your success is our success.
              </p>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="mb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Who We Serve</h3>
          <div className="bg-purple-50 rounded-lg border border-purple-200 p-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              <strong>Freelancers & Gig Workers</strong> who manage their own invoices and need to track payment quickly. Whether you're a designer, writer, developer, consultant, or service provider—Nvoyce helps you get paid faster.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mt-4">
              We believe freelancers deserve the same professional tools as big companies. We're making that possible.
            </p>
          </div>
        </section>

        {/* Brand Story — The Logo */}
        <section className="mb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">The Story Behind the Mark</h3>
          <div className="bg-gradient-to-r from-purple-700 to-purple-600 rounded-2xl p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-shrink-0">
              <img
                src="/logo-icon.png"
                alt="Nvoyce N icon"
                className="w-28 h-28 object-contain"
              />
            </div>
            <div className="text-white">
              <p className="text-lg font-semibold text-purple-100 mb-3 tracking-wide uppercase text-sm">
                Hidden in plain sight
              </p>
              <p className="text-xl font-bold mb-4 leading-snug text-white">
                The orange dots inside the N spell <span className="text-orange-300">"VOICE"</span> in Braille.
              </p>
              <p className="text-purple-100 leading-relaxed">
                Nvoyce is a fusion of <em>invoice</em> and <em>voice</em> — because every invoice is a freelancer's voice: a declaration of their work, their worth, and their right to be paid. The Braille lettering is a nod to universal access, a reminder that financial tools should work for everyone, and a tiny secret for those who look closely.
              </p>
            </div>
          </div>
        </section>

        {/* Features Highlight */}
        <section className="mb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-12">What Makes Nvoyce Different</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 text-2xl">📄</div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Instant Invoicing</h4>
                <p className="text-gray-600">Generate professional invoices and proposals in seconds, not hours.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 text-2xl">💰</div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Smart Payment Assistant (Payme)</h4>
                <p className="text-gray-600">Get intelligent reminders about overdue invoices so you never lose track of money owed to you.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 text-2xl">📊</div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Real-Time Insights</h4>
                <p className="text-gray-600">Track payment patterns, outstanding invoices, and cash flow at a glance.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 text-2xl">🔗</div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Shareable Proposals</h4>
                <p className="text-gray-600">Send clients a link to review and accept proposals. No sign-up required.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white rounded-lg border border-purple-200 p-12 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to get paid faster?</h3>
          <p className="text-lg text-gray-600 mb-8">Join freelancers who are already using Nvoyce to manage their business better.</p>
          <Link
            href="/dashboard"
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition text-lg font-semibold inline-block"
          >
            Start Using Nvoyce →
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white/50 backdrop-blur-sm mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center flex flex-col items-center gap-3">
          <img src="/logo-icon.png" alt="Nvoyce" className="w-7 h-7 object-contain opacity-50" />
          <p className="text-gray-500 text-sm">© 2026 Nvoyce. Built for freelancers and gig workers.</p>
        </div>
      </footer>
    </div>
  )
}
