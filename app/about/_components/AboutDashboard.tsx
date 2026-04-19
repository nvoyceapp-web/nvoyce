'use client'

import { useRef } from 'react'
import Sidebar, { SidebarHandle } from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import MobileNav from '@/components/MobileNav'

export default function AboutDashboard() {
  const sidebarRef = useRef<SidebarHandle>(null)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="hidden lg:block">
        <TopBar onHamburgerClick={() => sidebarRef.current?.open()} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar ref={sidebarRef} activePage="about" />
        <main className="flex-1 overflow-auto">
          <MobileNav activePage="about" />
          <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">About Nvoyce</h1>
              <p className="text-gray-500">What we stand for and why we built this.</p>
            </div>

            {/* Mission */}
            <section className="mb-10 bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
                <h2 className="text-sm font-bold text-orange-500 uppercase tracking-wider">Mission</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Invoicing and proposals shouldn't be complicated. Most freelancers spend valuable time on admin work instead of doing what they love. Nvoyce automates the hard stuff so you can focus on delivering great work and getting paid on time.
              </p>
            </section>

            {/* Core Values */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <h2 className="text-sm font-bold text-orange-500 uppercase tracking-wider">Core Values</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
                    title: 'Speed',
                    desc: 'Every second you spend on admin is a second not spent on work. We obsess over removing friction.',
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
                    title: 'Simplicity',
                    desc: "Tools should work the way you think. If something requires a tutorial, we haven't done our job.",
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                    title: 'Empowerment',
                    desc: 'Freelancers deserve the same professional tools as big companies. Full stop.',
                  },
                ].map(v => (
                  <div key={v.title} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-3">{v.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Brand Story */}
            <section className="mb-10 bg-[#0d1b2a] rounded-xl p-8">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">Hidden in plain sight</p>
              <p className="text-white text-lg font-semibold leading-snug mb-4">
                The orange dots inside the N spell <span className="text-orange-400">"VOICE"</span> in Braille.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Nvoyce is a fusion of <em>invoice</em> and <em>voice</em>. Every invoice is a freelancer's declaration of their work, their worth, and their right to be paid. The Braille lettering is a nod to universal access — a reminder that financial tools should work for everyone.
              </p>
            </section>

            {/* Who we serve */}
            <section className="mb-10 bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h2 className="text-sm font-bold text-orange-500 uppercase tracking-wider">Who We Serve</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Freelancers and independent workers who manage their own invoices and want to get paid faster — designers, developers, writers, consultants, and anyone else who works for themselves.
              </p>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-400 text-sm">
                Questions? <a href="mailto:support@nvoyce.ai" className="text-orange-500 hover:text-orange-600 font-medium">support@nvoyce.ai</a>
              </p>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
