'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PublicNavProps {
  activePage?: 'faq' | 'about' | 'pricing'
}

function NvoyceMark() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
      <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-label="nvoyce">
        <rect x="2" y="2" width="36" height="36" rx="9" fill="#0d1b2a" />
        <rect x="9" y="9" width="3.2" height="22" fill="white" />
        <rect x="27.8" y="9" width="3.2" height="22" fill="white" />
        <path d="M12.2 9 L15 9 L28 27 L28 31 L25.2 31 Z" fill="white" />
        <circle cx="17.5" cy="14" r="1.2" fill="#e04e1a" />
        <circle cx="22.5" cy="14" r="1.2" fill="#e04e1a" />
        <circle cx="17.5" cy="20" r="1.2" fill="#e04e1a" />
        <circle cx="22.5" cy="20" r="1.2" fill="#e04e1a" />
        <circle cx="17.5" cy="26" r="1.2" fill="#e04e1a" />
        <circle cx="22.5" cy="26" r="1.2" fill="#e04e1a" />
      </svg>
      <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: '#0d1b2a', lineHeight: 1 }}>nvoyce</span>
    </div>
  )
}

const navLinks: { label: string; href: string; key: string }[] = [
  { label: 'Pricing', href: '/#pricing', key: 'pricing' },
  { label: 'FAQ', href: '/faq', key: 'faq' },
  { label: 'About', href: '/about', key: 'about' },
]

export default function PublicNav({ activePage }: PublicNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(251,250,247,0.92)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <NvoyceMark />
        </Link>

        {/* Desktop nav */}
        <nav className="public-nav-desktop" style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
          {navLinks.map(({ label, href, key }) => (
            <Link
              key={key}
              href={href}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: activePage === key ? 'var(--orange)' : 'var(--text)',
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          ))}
          <Link href="/sign-in" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', borderRadius: 10, background: 'var(--orange)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
            Start free
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="public-nav-mobile"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#0d1b2a', display: 'none' }}
        >
          {open ? (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="public-nav-mobile"
          style={{
            display: 'none',
            flexDirection: 'column',
            padding: '8px 20px 16px',
            borderTop: '1px solid var(--line)',
            background: 'rgba(251,250,247,0.98)',
            gap: 2,
          }}
        >
          {navLinks.map(({ label, href, key }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: activePage === key ? 600 : 500,
                color: activePage === key ? 'var(--orange)' : 'var(--text)',
                textDecoration: 'none',
                background: activePage === key ? 'var(--paper-2)' : 'transparent',
              }}
            >
              {label}
            </Link>
          ))}
          <div style={{ height: 1, background: 'var(--line)', margin: '8px 0' }} />
          <Link
            href="/sign-in"
            onClick={() => setOpen(false)}
            style={{ display: 'block', padding: '10px 12px', borderRadius: 8, fontSize: 15, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            onClick={() => setOpen(false)}
            style={{ display: 'block', padding: '11px 12px', borderRadius: 10, fontSize: 15, fontWeight: 600, color: 'white', textDecoration: 'none', background: 'var(--orange)', textAlign: 'center', marginTop: 4 }}
          >
            Start free
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .public-nav-desktop { display: none !important; }
          .public-nav-mobile { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
