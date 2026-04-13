'use client'

import Link from 'next/link'
import Sidebar, { SidebarHandle } from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import { useRef } from 'react'

export default function AboutPage() {
  const sidebarRef = useRef<SidebarHandle>(null)
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <TopBar onHamburgerClick={() => sidebarRef.current?.open()} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar ref={sidebarRef} activePage="about" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl font-bold font-display text-gray-900 mb-6">We do the hard stuff.</h1>
          <h2 className="text-5xl font-bold font-display mb-8 pb-1">
            <span className="bg-gradient-to-r from-[#3b2a4a] to-[#d4622a] bg-clip-text text-transparent">You get paid</span><span className="text-orange-500">.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Send a proposal in 30 seconds. Get paid without the back-and-forth.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-20">
          <h3 className="text-3xl font-bold font-display text-gray-900 mb-6">Our Mission</h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            Invoicing and proposal management shouldn't be complicated. Most freelancers spend valuable time on admin work instead of doing what they love. We're changing that.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Nvoyce automates the hard stuff—invoice generation, payment tracking, and smart reminders. So you can focus on delivering great work and getting paid on time.
          </p>
        </section>

        {/* Core Values */}
        <section className="mb-20">
          <h3 className="text-3xl font-bold font-display text-gray-900 mb-12">Our Core Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <div className="mb-4">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Speed</h4>
              <p className="text-gray-600">
                Create an invoice in seconds, not hours. Get paid faster with automated reminders and intelligent prioritization.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <div className="mb-4">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Simplicity</h4>
              <p className="text-gray-600">
                Intuitive tools that work the way you think. No complicated workflows or unnecessary features.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <div className="mb-4">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Empowerment</h4>
              <p className="text-gray-600">
                We're built for freelancers, by people who understand your challenges. Your success is our success.
              </p>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="mb-20">
          <h3 className="text-3xl font-bold font-display text-gray-900 mb-8">Who We Serve</h3>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8">
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
          <h3 className="text-3xl font-bold font-display text-gray-900 mb-8">The Story Behind the Mark</h3>
          <div className="bg-gradient-to-r from-orange-500 via-[#1a2f45] to-[#0d1b2a] rounded-2xl p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-shrink-0">
              <img
                src="/logo-icon.png"
                alt="Nvoyce N icon"
                className="w-28 h-28 object-contain"
              />
            </div>
            <div className="text-white">
              <p className="text-sm font-semibold text-orange-400 mb-3 tracking-wide uppercase">
                Hidden in plain sight
              </p>
              <p className="text-xl font-bold mb-4 leading-snug text-white">
                The orange dots inside the N spell <span className="text-orange-400">"VOICE"</span> in Braille.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Nvoyce is a fusion of <em>invoice</em> and <em>voice</em> — because every invoice is a freelancer's voice: a declaration of their work, their worth, and their right to be paid. The Braille lettering is a nod to universal access, a reminder that financial tools should work for everyone, and a tiny secret for those who look closely.
              </p>
            </div>
          </div>
        </section>

        {/* Features Highlight */}
        <section className="mb-20">
          <h3 className="text-3xl font-bold font-display text-gray-900 mb-12">What Makes Nvoyce Different</h3>
          <div className="space-y-6">
            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Instant Invoicing</h4>
                <p className="text-gray-600">Generate professional invoices and proposals with AI in seconds, not hours.</p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Smart Payment Assistant (Payme)</h4>
                <p className="text-gray-600">Get intelligent reminders about overdue invoices so you never lose track of money owed to you.</p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Real-Time Insights</h4>
                <p className="text-gray-600">Track payment patterns, outstanding invoices, and cash flow at a glance.</p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Shareable Proposals</h4>
                <p className="text-gray-600">Send clients a link to review and accept proposals. No sign-up required.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <h3 className="text-3xl font-bold font-display text-gray-900 mb-4">Stop chasing. Start getting paid.</h3>
          <p className="text-lg text-gray-600 mb-8">Because no one started freelancing to chase invoices.</p>
          <Link
            href="/dashboard"
            className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition text-lg font-semibold inline-block"
          >
            Start Your Free Trial →
          </Link>
        </section>

          {/* Footer */}
          <div className="border-t border-gray-100 mt-20 py-8 text-center flex flex-col items-center gap-3">
            <img src="/logo-icon.png" alt="Nvoyce" className="w-7 h-7 object-contain opacity-50" />
            <p className="text-gray-500 text-sm">© 2026 Nvoyce. Stop chasing. Start getting paid.</p>
            <a
              href="https://nvoyce.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-500 hover:text-orange-600 transition font-medium"
            >
              Visit nvoyce.ai →
            </a>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
