'use client'

import { useState } from 'react'
import Link from 'next/link'

interface MobileNavProps {
  activePage?: 'dashboard' | 'clients' | 'rate-card' | 'faq' | 'settings' | 'about'
}

export default function MobileNav({ activePage }: MobileNavProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)

  const linkClass = (page: string) =>
    `block px-3 py-2 rounded-lg text-sm transition font-medium ${
      activePage === page
        ? 'bg-purple-100 text-[#0d1b2a] font-semibold'
        : 'text-gray-700 hover:bg-purple-100'
    }`

  return (
    <div className="lg:hidden sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-display font-bold text-xl text-[#0d1b2a] tracking-tight hover:opacity-80 transition-opacity"
        >
          Nvoyce
        </Link>
        <button
          onClick={() => { setShowMenu(!showMenu); setShowCreateDropdown(false) }}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          aria-label="Toggle menu"
        >
          {showMenu ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-1 shadow-sm">
          {/* Create */}
          <button
            onClick={() => setShowCreateDropdown(!showCreateDropdown)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create
            </span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCreateDropdown && (
            <div className="ml-4 space-y-1 border-l-2 border-orange-200 pl-3">
              <Link
                href="/dashboard/new?type=invoice"
                onClick={() => { setShowMenu(false); setShowCreateDropdown(false) }}
                className="block px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                Invoice
              </Link>
              <Link
                href="/dashboard/new?type=proposal"
                onClick={() => { setShowMenu(false); setShowCreateDropdown(false) }}
                className="block px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                Proposal
              </Link>
            </div>
          )}

          {/* Nav links */}
          <Link href="/dashboard" onClick={() => setShowMenu(false)} className={linkClass('dashboard')}>
            Dashboard
          </Link>
          <Link href="/dashboard/clients" onClick={() => setShowMenu(false)} className={linkClass('clients')}>
            Clients
          </Link>
          <Link href="/dashboard/rate-card" onClick={() => setShowMenu(false)} className={linkClass('rate-card')}>
            Rate Card
          </Link>
          <Link href="/dashboard/faq" onClick={() => setShowMenu(false)} className={linkClass('faq')}>
            FAQ
          </Link>
          <Link href="/dashboard/settings" onClick={() => setShowMenu(false)} className={linkClass('settings')}>
            Settings
          </Link>
          <Link href="/about" onClick={() => setShowMenu(false)} className={linkClass('about')}>
            About Nvoyce
          </Link>
        </div>
      )}
    </div>
  )
}
