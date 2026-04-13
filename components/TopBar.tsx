'use client'

interface TopBarProps {
  onHamburgerClick?: () => void
}

export default function TopBar({ onHamburgerClick }: TopBarProps) {
  return (
    <header className="w-full h-14 bg-[#0d1b2a] flex items-center px-4 gap-4 flex-shrink-0 z-50">
      <button
        onClick={onHamburgerClick}
        className="w-9 h-9 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 transition"
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <img src="/logo-wordmark-white.png" alt="Nvoyce" className="h-7 w-auto object-contain" />
    </header>
  )
}
