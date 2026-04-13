'use client'

import Link from 'next/link'

interface TopBarProps {
  onHamburgerClick?: () => void
}

export default function TopBar({ onHamburgerClick }: TopBarProps) {
  return (
    <header className="w-full h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0 z-50">
      <button
        onClick={onHamburgerClick}
        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <Link href="/dashboard" aria-label="Go to dashboard" className="flex items-center hover:opacity-80 transition-opacity">
        <img
          src="/logo-wordmark.png"
          alt="Nvoyce"
          className="h-7 w-auto object-contain block"
        />
      </Link>
    </header>
  )
}
